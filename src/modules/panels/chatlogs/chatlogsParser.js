import { playSVG, pauseSVG, shuffleSVG, sunSVG } from "../../icons.js";
import { minimalChatlogsDate } from "../../definitions.js";
import { fetchChatLogs } from './chatlogs.js';
import { renderChatMessages } from './chatlogsMessages.js';
import { renderActiveUsers } from './chatlogsUserlist.js';
import { getCurrentLanguage, getExactUserIdByName, getHistoryUsernamesByName } from '../../helpers.js';
import { chatlogsParserMessages } from './messages.js';
import { createCustomTooltip } from "../../tooltip.js";

/**
 * Attach parse logic to the parse button in the chat logs panel header.
 * @param {HTMLElement} parseButton - The parse button element.
 * @param {HTMLElement} chatLogsContainer - The container with chat log messages.
 */
export function setupChatLogsParser(parseButton, chatLogsPanelOrContainer) {
  let isParsing = false;
  let stopRequested = false;
  let abortController = null;
  const lang = getCurrentLanguage();

  // Helper to get the messages container
  function getMessagesContainer(panelOrContainer) {
    if (!panelOrContainer) return null;
    if (panelOrContainer.classList.contains('chat-logs-container')) return panelOrContainer;
    return panelOrContainer.querySelector('.chat-logs-container');
  }

  // Helper to prompt for options
  async function promptOptions() {
    let modeInput;
    while (true) {
      modeInput = prompt(chatlogsParserMessages.selectParseMode[lang], '1');
      if (modeInput === null) return null;
      if (["1", "2", "3", "4"].includes(modeInput)) break;
      alert(chatlogsParserMessages.invalidSelection[lang]);
    }
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
        rangeInput = prompt(chatlogsParserMessages.enterDateRange[lang], '');
        if (rangeInput === null) return null;
        if (!rangeInput.trim()) continue;
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
        alert(chatlogsParserMessages.invalidRange[lang]);
      }
    } else if (modeInput === '2') {
      // Prompt for FROM date, TO is today
      let fromInput, fromDate;
      while (true) {
        fromInput = prompt(chatlogsParserMessages.enterFromDate[lang], '');
        if (fromInput === null) return null;
        if (!fromInput.trim()) continue;
        fromDate = normalizeDate(fromInput.trim());
        if (fromDate) {
          opts.from = fromDate;
          opts.to = new Date().toISOString().slice(0, 10);
          opts.mode = 'fromdate';
          return opts;
        }
        alert(chatlogsParserMessages.invalidFromDate[lang]);
      }
    } else if (modeInput === '1') {
      // Prompt for single date
      let dateInput, dateVal;
      while (true) {
        dateInput = prompt(chatlogsParserMessages.enterSingleDate[lang], '');
        if (dateInput === null) return null;
        if (!dateInput.trim()) continue;
        dateVal = normalizeDate(dateInput.trim());
        if (dateVal) {
          opts.from = dateVal;
          opts.to = dateVal;
          opts.mode = 'single';
          return opts;
        }
        alert(chatlogsParserMessages.invalidDate[lang]);
      }
    }
  }

  // Helper to prompt for usernames and validate them using getExactUserIdByName
  async function promptUsernames() {
    let usernamesInput = "";
    while (true) {
      usernamesInput = prompt(chatlogsParserMessages.enterUsernames[lang], usernamesInput || "");
      if (usernamesInput === null) return null;
      if (!usernamesInput || !usernamesInput.trim()) return [];
      let usernames = usernamesInput.split(',').map(u => u.trim()).filter(Boolean);
      if (usernames.length === 0) return [];
      const invalidUsernames = [];
      for (const username of usernames) {
        const userId = await getExactUserIdByName(username);
        if (!userId) invalidUsernames.push(username);
      }
      if (invalidUsernames.length > 0) {
        alert(
          invalidUsernames.length === 1
            ? chatlogsParserMessages.userNotFound[lang](invalidUsernames[0])
            : chatlogsParserMessages.usersNotFound[lang](invalidUsernames)
        );
        continue;
      }
      if (usernames.length === 1) {
        const answer = prompt(chatlogsParserMessages.retrieveHistoryPrompt[lang], '2');
        if (answer === '1') {
          if (typeof getHistoryUsernamesByName === 'function') {
            const historyUsernames = await getHistoryUsernamesByName(usernames[0]);
            if (Array.isArray(historyUsernames) && historyUsernames.length > 0) {
              const allUsernames = [usernames[0], ...historyUsernames.filter(u => u !== usernames[0])];
              const confirmed = prompt(chatlogsParserMessages.confirmUsernames[lang], allUsernames.join(', '));
              if (!confirmed) return null;
              return confirmed.split(',').map(u => u.trim()).filter(Boolean);
            }
          }
        }
      }
      return usernames;
    }
  }

  // Helper to prompt for search terms
  function promptSearchTerms(searchAllUsers = false) {
    let searchInput;
    while (true) {
      searchInput = prompt(chatlogsParserMessages.enterSearchTerms[lang](searchAllUsers), '');
      if (searchInput === null) return null;
      if (!searchInput.trim()) {
        if (searchAllUsers) {
          alert(chatlogsParserMessages.searchAllUsersRequired[lang]);
          continue;
        }
        return [];
      }
      return searchInput.split(',').map(term => term.trim().toLowerCase()).filter(Boolean);
    }
  }

  // Helper to check if message contains any of the search terms
  function messageContainsSearchTerms(message, searchTerms) {
    if (!searchTerms || searchTerms.length === 0) return true; // No search terms means show all
    if (!message) return false;

    const lowerMessage = message.toLowerCase();
    return searchTerms.some(term => lowerMessage.includes(term));
  }

  // Main parse logic
  async function startParsing() {
    // Expose parser state and stop function globally only when parsing starts, and only if not already set
    if (!window.chatlogsParserState) {
      window.chatlogsParserState = {
        isRunning: () => isParsing,
        stop: stopParsing
      };
    }
    if (!window.stopChatlogsParser) {
      window.stopChatlogsParser = stopParsing;
    }

    isParsing = true;
    stopRequested = false;
    abortController = new AbortController();
    parseButton.innerHTML = pauseSVG;
    const randomButton = chatLogsPanelOrContainer.querySelector('.panel-header-shuffle-button');
    if (randomButton) {
      randomButton.dataset.mode = '';
      randomButton.innerHTML = shuffleSVG;
      createCustomTooltip(randomButton, {
        en: 'Random Date',
        ru: 'Случайная дата'
      });
    }

    const opts = await promptOptions();
    if (!opts) {
      resetButton();
      return;
    }

    // Prompt for usernames
    const usernames = await promptUsernames();
    if (usernames === null) {
      resetButton();
      return;
    }

    const searchAllUsers = usernames.length === 0;

    // Prompt for message search terms
    const searchTerms = promptSearchTerms(searchAllUsers);
    if (searchTerms === null) {
      resetButton();
      return;
    }

    // If searching all users, search terms are required
    if (searchAllUsers && searchTerms.length === 0) {
      alert(chatlogsParserMessages.searchAllUsersRequired[lang]);
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

    // Show search info
    if (messagesContainer) {
      const searchInfo = document.createElement('div');
      searchInfo.className = 'search-messages-info';
      if (searchAllUsers) {
        searchInfo.textContent = lang === 'ru'
          ? `Поиск по всем пользователям по словам: ${searchTerms.join(', ')}`
          : `Searching all users for messages containing: ${searchTerms.join(', ')}`;
      } else if (searchTerms.length > 0) {
        searchInfo.textContent = lang === 'ru'
          ? `Поиск сообщений от: ${usernames.join(', ')}, содержащих: ${searchTerms.join(', ')}`
          : `Searching for messages from: ${usernames.join(', ')}, containing: ${searchTerms.join(', ')}`;
      } else {
        searchInfo.textContent = lang === 'ru'
          ? `Показаны все сообщения от: ${usernames.join(', ')}`
          : `Showing all messages from: ${usernames.join(', ')}`;
      }
      messagesContainer.appendChild(searchInfo);
    }

    // Fetch and filter chat logs for each date in the range, render in real time
    const startDate = new Date(from);
    const endDate = new Date(to);
    let currentDate = new Date(startDate);
    while (currentDate <= endDate && !stopRequested) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      try {
        const { chatlogs } = await fetchChatLogs(dateStr, null, abortController.signal);
        if (stopRequested) break;

        // Filter messages based on whether we're searching all users or specific users
        let filtered;
        if (searchAllUsers) {
          // Search all users, but only keep messages with valid content that match search terms
          filtered = chatlogs.filter(log =>
            log &&
            log.message &&
            messageContainsSearchTerms(log.message, searchTerms)
          );
        } else {
          // Filter by username(s) first, then apply search terms if provided
          filtered = chatlogs.filter(log =>
            log &&
            log.message &&
            usernames.includes(log.username)
          );

          // Apply search term filtering if search terms are provided
          if (searchTerms.length > 0) {
            filtered = filtered.filter(log => messageContainsSearchTerms(log.message, searchTerms));
          }
        }

        if (stopRequested) break;
        allFiltered = allFiltered.concat(filtered);
        // Update message count map
        filtered.forEach(({ username }) => {
          usernameMessageCountMap.set(username, (usernameMessageCountMap.get(username) || 0) + 1);
        });
        if (stopRequested) break;
        // Render incrementally
        if (messagesContainer && filtered.length > 0) {
          renderChatMessages(
            filtered,
            messagesContainer,
            usernameHueMap,
            true,
            dateStr,
            searchTerms,
            searchTerms && searchTerms.length > 0 // highlightSearch true if search terms present
          );
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
      let noMessagesText;
      if (searchAllUsers) {
        noMessagesText = chatlogsParserMessages.noMessagesFoundAll[lang](searchTerms);
      } else if (searchTerms.length > 0) {
        noMessagesText = chatlogsParserMessages.noMessagesFoundSome[lang](searchTerms);
      } else {
        noMessagesText = chatlogsParserMessages.noMessagesFound[lang];
      }
      messagesContainer.innerHTML = `<div class="no-messages-info">${noMessagesText}</div>`;
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
    const randomButton = chatLogsPanelOrContainer.querySelector('.panel-header-shuffle-button');
    if (randomButton) {
      randomButton.dataset.mode = 'loadToday';
      randomButton.classList.add('today');
      randomButton.innerHTML = sunSVG;
      createCustomTooltip(randomButton, {
        en: 'Load Today\'s Chat Logs',
        ru: 'Загрузить сегодняшние логи чата'
      });
    }
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
