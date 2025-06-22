import { playSVG, pauseSVG } from "../../icons.js";
import { minimalChatlogsDate } from "../../definitions.js";
import { fetchChatLogs } from './chatlogs.js';
import { renderChatMessages } from './chatlogsMessages.js';
import { renderActiveUsers } from './chatlogsUserlist.js';
import { getExactUserIdByName, getHistoryUsernamesByName } from '../../helpers.js';

/**
 * Attach parse logic to the parse button in the chat logs panel header.
 * @param {HTMLElement} parseButton - The parse button element.
 * @param {HTMLElement} chatLogsContainer - The container with chat log messages.
 */
export function setupChatLogsParser(parseButton, chatLogsPanelOrContainer) {
  let isParsing = false;
  let stopRequested = false;
  let abortController = null;

  // Helper to get the messages container
  function getMessagesContainer(panelOrContainer) {
    if (!panelOrContainer) return null;
    if (panelOrContainer.classList.contains('chat-logs-container')) return panelOrContainer;
    return panelOrContainer.querySelector('.chat-logs-container');
  }

  // Helper to prompt for options
  async function promptOptions() {
    // Updated parse mode prompt
    const modeInput = prompt(
      [
        'Select parse mode:',
        '1. Single date',
        '2. From date',
        '3. Date range',
        '4. From start'
      ].join('\n'),
      '1'
    );
    const opts = {};
    function isValidDateParts(year, month, day) {
      const now = new Date();
      const currentYear = now.getFullYear();
      year = parseInt(year, 10);
      month = parseInt(month, 10);
      day = parseInt(day, 10);
      if (year > currentYear) return false;
      if (month < 1 || month > 12) return false;
      if (day < 1 || day > 31) return false;
      return true;
    }
    function normalizeDate(str) {
      let y, m, d;
      if (/^\d{4}[:\-]\d{2}[:\-]\d{2}$/.test(str)) {
        [y, m, d] = str.replace(/:/g, '-').split('-');
      } else if (/^\d{8}$/.test(str)) {
        y = str.slice(0, 4); m = str.slice(4, 6); d = str.slice(6, 8);
      } else if (/^\d{6}$/.test(str)) {
        y = '20' + str.slice(0, 2); m = str.slice(2, 4); d = str.slice(4, 6);
      } else {
        return null;
      }
      if (!isValidDateParts(y, m, d)) return null;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (modeInput === '4') {
      opts.from = minimalChatlogsDate;
      opts.to = new Date().toISOString().slice(0, 10);
      opts.mode = 'fromstart';
      return opts;
    } else if (modeInput === '3') {
      // Prompt for date range in a single input (e.g. 240202-240303 or 2024-02-02 - 2024-03-03)
      let rangeInput, fromDate, toDate;
      while (true) {
        rangeInput = prompt(
          [
            'Enter date range (any supported format, e.g. 240202-240303, 2024-02-02 - 2024-03-03):',
            'Examples:',
            '2024-01-01 - 2024-01-07',
            '20240101-20240107',
            '2024:01:01 - 2024:01:07',
            '240101-240107',
            '24-02-02 - 24-03-03',
          ].join('\n'),
          ''
        );
        if (!rangeInput || !rangeInput.trim()) return null;
        // Accept with or without spaces around the dash
        const match = rangeInput.match(/([\d:\-]{6,10})\s*-\s*([\d:\-]{6,10})/);
        if (match) {
          fromDate = normalizeDate(match[1]);
          toDate = normalizeDate(match[2]);
          if (fromDate && toDate) {
            opts.from = fromDate;
            opts.to = toDate;
            opts.mode = 'range';
            return opts;
          }
        }
        alert('Invalid range format or one/both dates out of bounds. Please try again.');
      }
    } else if (modeInput === '2') {
      // Prompt for FROM date, TO is today
      let fromInput, fromDate;
      while (true) {
        fromInput = prompt(
          [
            'Enter FROM date (any supported format):',
            'Examples:',
            '2024-01-01',
            '20240101',
            '2024:01:01',
            '240101',
            'Range will be FROM this date to today.'
          ].join('\n'),
          ''
        );
        if (!fromInput || !fromInput.trim()) return null;
        fromDate = normalizeDate(fromInput.trim());
        if (fromDate) {
          opts.from = fromDate;
          opts.to = new Date().toISOString().slice(0, 10);
          opts.mode = 'fromdate';
          return opts;
        }
        alert('Invalid FROM date format or date out of bounds. Please try again.');
      }
    } else if (modeInput === '1') {
      // Prompt for single date
      let dateInput, dateVal;
      while (true) {
        dateInput = prompt(
          [
            'Enter a date (any supported format):',
            'Examples:',
            '2024-01-01',
            '20240101',
            '2024:01:01',
            '240101',
          ].join('\n'),
          ''
        );
        if (!dateInput || !dateInput.trim()) return null;
        dateVal = normalizeDate(dateInput.trim());
        if (dateVal) {
          opts.from = dateVal;
          opts.to = dateVal;
          opts.mode = 'single';
          return opts;
        }
        alert('Invalid date format or date out of bounds. Please try again.');
      }
    } else {
      alert('Invalid selection.');
      return null;
    }
  }

  // Helper to prompt for usernames and validate them using getExactUserIdByName
  async function promptUsernames() {
    let usernamesInput = "";
    while (true) {
      usernamesInput = prompt("Enter username(s) to parse (comma-separated):", usernamesInput || "");
      if (!usernamesInput) return null;
      let usernames = usernamesInput.split(',').map(u => u.trim()).filter(Boolean);
      if (usernames.length === 0) return null;
      // Validate each username using getExactUserIdByName
      const invalidUsernames = [];
      for (const username of usernames) {
        const userId = await getExactUserIdByName(username);
        if (!userId) invalidUsernames.push(username);
      }
      if (invalidUsernames.length > 0) {
        alert(
          invalidUsernames.length === 1
            ? `User not found: ${invalidUsernames[0]}`
            : `The following usernames are invalid or not found:\n${invalidUsernames.join(', ')}`
        );
        // Loop again, keeping the previous value
        continue;
      }
      // If only one username, ask if user wants to retrieve all previous history usernames
      if (usernames.length === 1) {
        const answer = prompt(
          `Do you want to retrieve all previous history usernames for this user? (1 - yes, 2 - no)`,
          '2'
        );
        if (answer === '1') {
          if (typeof getHistoryUsernamesByName === 'function') {
            const historyUsernames = await getHistoryUsernamesByName(usernames[0]);
            if (Array.isArray(historyUsernames) && historyUsernames.length > 0) {
              // Always keep the original username as first, then add unique history usernames
              const allUsernames = [usernames[0], ...historyUsernames.filter(u => u !== usernames[0])];
              // Prompt user to confirm/edit the expanded list, no validation
              const confirmed = prompt(
                'Confirm or edit the list of usernames to parse (comma-separated):',
                allUsernames.join(', ')
              );
              if (!confirmed) return null;
              return confirmed.split(',').map(u => u.trim()).filter(Boolean);
            }
          }
        }
      }
      return usernames;
    }
  }

  // Main parse logic
  async function startParsing() {
    isParsing = true;
    stopRequested = false;
    abortController = new AbortController();
    parseButton.innerHTML = pauseSVG;
    parseButton.title = "Stop parsing";

    const opts = await promptOptions();
    if (!opts) {
      resetButton();
      return;
    }
    const usernames = await promptUsernames();
    if (!usernames || usernames.length === 0) {
      resetButton();
      return;
    }
    // Use opts.from and opts.to directly for all modes
    let from = opts.from;
    let to = opts.to;

    // Prepare for rendering
    const usernameHueMap = {};
    let allFiltered = [];
    const usernameMessageCountMap = new Map();
    // Clear the messages container before starting
    const messagesContainer = getMessagesContainer(chatLogsPanelOrContainer);
    if (messagesContainer) messagesContainer.innerHTML = '';
    // Fetch and filter chat logs for each date in the range, render in real time
    const startDate = new Date(from);
    const endDate = new Date(to);
    let currentDate = new Date(startDate);
    while (currentDate <= endDate && !stopRequested) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      try {
        const { chatlogs } = await fetchChatLogs(dateStr, null, abortController.signal);
        if (stopRequested) break;
        // Filter messages by username(s) and remove null/undefined and null message
        const filtered = chatlogs.filter(log => log && log.message && usernames.includes(log.username));
        if (stopRequested) break;
        allFiltered = allFiltered.concat(filtered);
        // Update message count map
        filtered.forEach(({ username }) => {
          usernameMessageCountMap.set(username, (usernameMessageCountMap.get(username) || 0) + 1);
        });
        if (stopRequested) break;
        // Render incrementally
        if (messagesContainer && filtered.length > 0) {
          renderChatMessages(filtered, messagesContainer, usernameHueMap, true, dateStr);
          if (stopRequested) break;
          renderActiveUsers(usernameMessageCountMap, messagesContainer.closest('.chat-logs-panel'), usernameHueMap);
        }
        if (stopRequested) break;
        // Optional: add a small delay for smoother UI
        await new Promise(res => setTimeout(res, 60));
        if (stopRequested) break;
        currentDate.setDate(currentDate.getDate() + 1);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Parsing was aborted');
          break;
        } else {
          console.error('Error during parsing:', error);
          break;
        }
      }
    }
    // If nothing was found, show placeholder
    if (messagesContainer && allFiltered.length === 0) {
      messagesContainer.innerHTML = '<div class="no-messages">No messages found for the selected user(s) and date(s).</div>';
      // Also clear userlist
      const panel = messagesContainer.closest('.chat-logs-panel');
      if (panel) {
        const activeUsers = panel.querySelector('.active-users');
        if (activeUsers) activeUsers.innerHTML = '';
      }
    }
    resetButton();
    // Always update userlist after parsing (even if stopped early)
    if (messagesContainer) {
      renderActiveUsers(usernameMessageCountMap, messagesContainer.closest('.chat-logs-panel'), usernameHueMap);
    }
  }

  function stopParsing() {
    stopRequested = true;
    if (abortController) {
      abortController.abort();
    }
    isParsing = false;
    resetButton();
  }

  function resetButton() {
    parseButton.innerHTML = playSVG;
    isParsing = false;
    stopRequested = false;
    abortController = null;
  }

  parseButton.addEventListener('click', async () => {
    if (!isParsing) {
      await startParsing();
    } else {
      stopParsing();
    }
  });
}
