import { playSVG, pauseSVG, shuffleSVG, sunSVG } from "../../icons.js";
import { minimalChatlogsDate, myNickname } from "../../definitions.js";
import { fetchChatLogs } from "./chatlogsLoader.js";
import { renderChatMessages } from "./chatlogsMessages.js";
import { renderActiveUsers } from "./chatlogsUserlist.js";
import { getCurrentLanguage, normalizeDate } from "../../helpers/helpers.js";

import {
  getExactUserIdByName,
  getDataByName
} from "../../helpers/apiData.js";

import { chatlogsParserMessages } from "./chatlogsParserMessages.js";
import { createCustomTooltip } from "../../components/tooltip.js";
import { deleteAllChatlogsFromIndexedDB } from "./chatlogsStorage.js";

/**
 * Helper function to calculate date range for latest N days
 * @param {number} days - Number of days to go back from today
 * @returns {object} - Object with 'from' and 'to' dates in YYYY-MM-DD format
 */
function getLatestNDaysRange(days) {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - days + 1); // +1 to include today

  return {
    from: fromDate.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10)
  };
}

/**
 * Helper function to get all mention terms including myNickname, its history, and mention keywords from localStorage
 * Order: myNickname first, then usernamesHistory, then mentionKeywords
 * @returns {Promise<Array>} - Array of unique mention terms in proper order
 */
async function getAllMentionTerms() {
  let allMentionTerms = [];

  // 1. Add myNickname first (if it exists)
  if (myNickname) {
    allMentionTerms.push(myNickname);
  }

  // 2. Add username history (excluding myNickname to avoid duplicates)
  if (myNickname) {
    try {
      const usernamesHistory = await getDataByName(myNickname, 'usernamesHistory');
      if (Array.isArray(usernamesHistory) && usernamesHistory.length > 0) {
        usernamesHistory.forEach(username => {
          if (username && !allMentionTerms.includes(username)) {
            allMentionTerms.push(username);
          }
        });
      }
    } catch (error) {
      console.warn('Could not fetch username history for', myNickname, ':', error);
    }
  }

  // 3. Get mention keywords from localStorage and add them last (excluding any that are already in the list)
  let mentionKeywords = [];
  try {
    const storedKeywords = localStorage.getItem('mentionKeywords');
    if (storedKeywords) {
      mentionKeywords = JSON.parse(storedKeywords);
    }
  } catch (error) {
    console.warn('Could not parse mention keywords from localStorage:', error);
  }
  if (!Array.isArray(mentionKeywords)) mentionKeywords = [];

  mentionKeywords.forEach(keyword => {
    if (keyword && !allMentionTerms.includes(keyword)) {
      allMentionTerms.push(keyword);
    }
  });

  return allMentionTerms;
}

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
      if (["1", "2", "3", "4", "5", "6"].includes(modeInput)) break;
      alert(chatlogsParserMessages.invalidSelection[lang]);
    }
    const opts = {};

    // Helper for date range prompts (to avoid code repetition)
    async function promptDateRange(mode) {
      if (mode === '4') {
        opts.from = minimalChatlogsDate;
        opts.to = new Date().toISOString().slice(0, 10);
      } else if (mode === '3') {
        let rangeInput, fromDate, toDate;
        while (true) {
          rangeInput = prompt(chatlogsParserMessages.enterDateRange[lang], '');
          if (rangeInput === null) return null;
          if (!rangeInput.trim()) continue;
          const match = rangeInput.match(/([\d:\-]{6,10})\s*-\s*([\d:\-]{6,10})/);
          if (match) {
            fromDate = normalizeDate(match[1]);
            toDate = normalizeDate(match[2]);
            if (fromDate && toDate) {
              opts.from = fromDate;
              opts.to = toDate;
              break;
            }
          }
          alert(chatlogsParserMessages.invalidRange[lang]);
        }
      } else if (mode === '2') {
        let fromInput, fromDate;
        while (true) {
          fromInput = prompt(chatlogsParserMessages.enterFromDate[lang], '');
          if (fromInput === null) return null;
          if (!fromInput.trim()) continue;
          fromDate = normalizeDate(fromInput.trim());
          if (fromDate) {
            opts.from = fromDate;
            opts.to = new Date().toISOString().slice(0, 10);
            break;
          }
          alert(chatlogsParserMessages.invalidFromDate[lang]);
        }
      } else if (mode === '1') {
        let dateInput, dateVal;
        while (true) {
          dateInput = prompt(chatlogsParserMessages.enterSingleDate[lang], '');
          if (dateInput === null) return null;
          if (!dateInput.trim()) continue;
          dateVal = normalizeDate(dateInput.trim());
          if (dateVal) {
            opts.from = dateVal;
            opts.to = dateVal;
            break;
          }
          alert(chatlogsParserMessages.invalidDate[lang]);
        }
      }
    } // promptDateRange END

    if (modeInput === '6') {
      // Personal mentions mode: prompt for date mode, then handle latest N days option
      let dateMode;
      while (true) {
        dateMode = prompt(chatlogsParserMessages.selectPersonalMentionsDateMode[lang], '1');
        if (dateMode === null) return null;
        if (["1", "2", "3", "4", "5"].includes(dateMode)) break;
        alert(chatlogsParserMessages.invalidSelection[lang]);
      }

      // Handle the new option 5 (Latest N days)
      if (dateMode === '5') {
        let daysInput;
        while (true) {
          daysInput = prompt(chatlogsParserMessages.enterLatestDays[lang], '7');
          if (daysInput === null) return null;

          const days = parseInt(daysInput.trim());
          if (isNaN(days) || days <= 0 || days > 365) {
            alert(chatlogsParserMessages.invalidDaysNumber[lang]);
            continue;
          }

          const dateRange = getLatestNDaysRange(days);
          opts.from = dateRange.from;
          opts.to = dateRange.to;
          break;
        }
      } else {
        // Use existing date range logic for modes 1-4
        const dateResult = await promptDateRange(dateMode);
        if (dateResult === null) return null;
      }

      // Get all mention terms including myNickname, usernamesHistory, and mentionKeywords
      const allMentionTerms = await getAllMentionTerms();

      // Prompt user to edit the combined list
      let mentionInput = prompt(
        chatlogsParserMessages.enterMentionKeywords[lang],
        allMentionTerms.join(', ')
      );
      if (mentionInput === null) return null;

      // Parse and clean the input - Fixed the undefined array issue
      let finalMentionKeywords = [];
      if (mentionInput && mentionInput.trim()) {
        const splitKeywords = mentionInput.split(',');
        if (Array.isArray(splitKeywords)) {
          finalMentionKeywords = splitKeywords
            .map(s => s ? s.trim() : '')
            .filter(Boolean);

          // Remove duplicates safely
          const uniqueKeywords = [];
          finalMentionKeywords.forEach(keyword => {
            if (keyword && !uniqueKeywords.includes(keyword)) {
              uniqueKeywords.push(keyword);
            }
          });
          finalMentionKeywords = uniqueKeywords;
        }
      }

      if (finalMentionKeywords.length === 0) {
        alert(chatlogsParserMessages.noMentionKeywords[lang]);
        return null;
      }

      opts.mode = 'personalmentions';
      opts.mentionKeywords = finalMentionKeywords;
      return opts;
    } else if (modeInput === '5') {
      opts.mode = 'fromregistered';
      // We'll fetch the date after prompting for usernames in startParsing
      return opts;
    } else if (["4", "3", "2", "1"].includes(modeInput)) {
      const dateResult = await promptDateRange(modeInput);
      if (dateResult === null) return null;
      opts.mode =
        modeInput === '1' ? 'single' :
          modeInput === '2' ? 'fromdate' :
            modeInput === '3' ? 'range' :
              'fromstart';
      return opts;
    }
  }

  // Helper to prompt for usernames and validate them using getExactUserIdByName
  async function promptUsernames() {
    let usernamesInput = "";
    while (true) {
      usernamesInput = prompt(chatlogsParserMessages.enterUsernames[lang], usernamesInput || "");
      if (usernamesInput === null) return null;
      if (!usernamesInput || !usernamesInput.trim()) return [];

      let usernames = [];
      if (usernamesInput && usernamesInput.trim()) {
        const splitUsernames = usernamesInput.split(',');
        if (Array.isArray(splitUsernames)) {
          usernames = splitUsernames
            .map(u => u ? u.trim() : '')
            .filter(Boolean);
        }
      }

      if (usernames.length === 0) return [];

      const validUsernames = [];
      for (const username of usernames) {
        const userId = await getExactUserIdByName(username);
        if (!userId) {
          // Ask user if they want to proceed (possibly banned)
          if (confirm(chatlogsParserMessages.userPossiblyBanned[lang](username))) {
            validUsernames.push(username);
          }
        } else {
          validUsernames.push(username);
        }
      }
      if (validUsernames.length === 0) {
        // If all were skipped or not found, just continue the prompt loop (no alert)
        continue;
      }
      if (validUsernames.length === 1) {
        const answer = prompt(chatlogsParserMessages.retrieveHistoryPrompt[lang], '2');
        if (answer === '1') {
          if (typeof getDataByName === 'function') {
            const historyUsernames = await getDataByName(validUsernames[0], 'usernamesHistory');
            if (Array.isArray(historyUsernames) && historyUsernames.length > 0) {
              const allUsernames = [validUsernames[0], ...historyUsernames.filter(u => u !== validUsernames[0])];
              const confirmed = prompt(chatlogsParserMessages.confirmUsernames[lang], allUsernames.join(', '));
              if (!confirmed) return null;

              let confirmedUsernames = [];
              if (confirmed && confirmed.trim()) {
                const splitConfirmed = confirmed.split(',');
                if (Array.isArray(splitConfirmed)) {
                  confirmedUsernames = splitConfirmed
                    .map(u => u ? u.trim() : '')
                    .filter(Boolean);
                }
              }
              return confirmedUsernames;
            }
          }
        }
      }
      return validUsernames;
    }
  }

  // Helper to prompt for search terms
  function promptSearchTerms(searchAllUsers = false) {
    let searchInput;
    while (true) {
      searchInput = prompt(chatlogsParserMessages.enterSearchTerms[lang](searchAllUsers), '');
      if (searchInput === null) return null;
      if (!searchInput || !searchInput.trim()) {
        if (searchAllUsers) {
          alert(chatlogsParserMessages.searchAllUsersRequired[lang]);
          continue;
        }
        return [];
      }

      let searchTerms = [];
      if (searchInput && searchInput.trim()) {
        const splitTerms = searchInput.split(',');
        if (Array.isArray(splitTerms)) {
          searchTerms = splitTerms
            .map(term => term ? term.trim().toLowerCase() : '')
            .filter(Boolean);
        }
      }
      return searchTerms;
    }
  }

  // Helper to check if message contains any of the search terms
  function messageContainsSearchTerms(message, searchTerms) {
    if (!searchTerms || searchTerms.length === 0) return true; // No search terms means show all
    if (!message) return false;

    const lowerMessage = message.toLowerCase();
    return searchTerms.some(term => lowerMessage.includes(term));
  }

  // Helper to set the random button to 'today' mode
  function setRandomButtonToTodayMode() {
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

  // Helper to set the random button to default (random) mode
  function setRandomButtonToDefault() {
    const randomButton = chatLogsPanelOrContainer.querySelector('.panel-header-shuffle-button');
    if (randomButton) {
      randomButton.dataset.mode = '';
      randomButton.classList.remove('today');
      randomButton.innerHTML = shuffleSVG;
      createCustomTooltip(randomButton, {
        en: 'Random Date',
        ru: 'Случайная дата'
      });
    }
  }

  // Helper to calculate percent complete
  function getPercentComplete(currentDate, startDate, endDate) {
    const total = endDate - startDate;
    const done = currentDate - startDate;
    if (total <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
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
    setRandomButtonToDefault();

    const opts = await promptOptions();
    if (!opts) {
      resetButton();
      return;
    }

    let usernames;
    let searchTerms;
    if (opts.mode === 'personalmentions') {
      // Use mention keywords from opts (do not update localStorage)
      let mentionKeywords = opts.mentionKeywords || [];
      if (!Array.isArray(mentionKeywords) || mentionKeywords.length === 0) {
        alert('No mention keywords provided. Please enter at least one keyword.');
        resetButton();
        return;
      }
      searchTerms = mentionKeywords.map(s => s ? s.toLowerCase() : '').filter(Boolean);
      usernames = [];
    } else if (opts.mode === 'fromregistered') {
      // Prompt for usernames and fetch registration dates
      let usernamesInput = await promptUsernames();
      if (usernamesInput === null || usernamesInput.length === 0) {
        alert(chatlogsParserMessages.noUsersSelected[lang]);
        resetButton();
        return;
      }
      // Fetch registration dates for all usernames
      let regDates = [];
      for (const username of usernamesInput) {
        let reg = await getDataByName(username, 'registered');
        let regDate = null;
        if (typeof reg === 'string') {
          regDate = reg;
        } else if (typeof reg === 'number') {
          regDate = new Date(reg * 1000).toISOString().slice(0, 10);
        }
        if (regDate) regDates.push(regDate);
      }
      if (!regDates.length) {
        alert(chatlogsParserMessages.unableToGetRegDate[lang]);
        resetButton();
        return;
      }
      // Use the earliest registration date
      let minDate = regDates.sort()[0];
      // Prompt user to edit or confirm the start date
      let editedDate = prompt(chatlogsParserMessages.editStartDate[lang](minDate), minDate);
      if (!editedDate) {
        resetButton();
        return;
      }
      // Normalize and validate the edited date using normalizeDate and isValidDateParts
      editedDate = normalizeDate(editedDate.trim());
      if (!editedDate) {
        alert(chatlogsParserMessages.invalidEditedDate[lang]);
        resetButton();
        return;
      }
      // Clamp to minimalChatlogsDate if needed
      let minAllowed = minimalChatlogsDate;
      if (editedDate < minAllowed) {
        alert(chatlogsParserMessages.dateBeforeMinimal[lang](minAllowed));
        editedDate = minAllowed;
      }
      opts.from = editedDate;
      opts.to = new Date().toISOString().slice(0, 10);
      usernames = usernamesInput;
    } else {
      usernames = await promptUsernames();
      if (usernames === null) {
        resetButton();
        return;
      }
    }
    const searchAllUsers = usernames.length === 0;
    if (opts.mode !== 'personalmentions') {
      // Prompt for message search terms
      searchTerms = promptSearchTerms(searchAllUsers);
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
    }

    // Use opts.from and opts.to directly for all modes
    let from = opts.from;
    let to = opts.to;

    // Prepare for rendering
    let allFiltered = [];
    const usernameMessageCountMap = new Map();
    // Clear the messages container before starting
    const messagesContainer = getMessagesContainer(chatLogsPanelOrContainer);
    if (messagesContainer) messagesContainer.innerHTML = '';

    // Show search info
    let searchDateInfo = null;
    if (messagesContainer) {
      const searchInfo = document.createElement('div');
      searchInfo.className = 'search-messages-info';
      if (searchAllUsers) {
        searchInfo.textContent = chatlogsParserMessages.searchInfoAllUsers[lang](searchTerms);
      } else if (searchTerms.length > 0) {
        searchInfo.textContent = chatlogsParserMessages.searchInfoSomeUsers[lang](usernames, searchTerms);
      } else {
        searchInfo.textContent = chatlogsParserMessages.searchInfoAllFromUsers[lang](usernames);
      }
      messagesContainer.appendChild(searchInfo);

      // Add date info element next to search info
      searchDateInfo = document.createElement('div');
      searchDateInfo.className = 'search-messages-date';
      searchDateInfo.textContent = '';
      searchInfo.insertAdjacentElement('afterend', searchDateInfo);
    }

    // Fetch and filter chat logs for each date in the range, render in real time
    const startDate = new Date(from);
    const endDate = new Date(to);
    let currentDate = new Date(startDate);
    while (currentDate <= endDate && !stopRequested) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      if (searchDateInfo) {
        const percent = getPercentComplete(currentDate, startDate, endDate);
        searchDateInfo.textContent = chatlogsParserMessages.dateProgressInfo[lang](from, dateStr, percent);
      }
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
            true,
            dateStr,
            searchTerms,
            searchTerms && searchTerms.length > 0 // highlightSearch true if search terms present
          );
          if (stopRequested) break;
          renderActiveUsers(usernameMessageCountMap, messagesContainer.closest('.chat-logs-panel'));
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
      renderActiveUsers(usernameMessageCountMap, messagesContainer.closest('.chat-logs-panel'));
    }
    // If parsing stopped automatically, update random button to today mode
    setRandomButtonToTodayMode();
  }

  function stopParsing() {
    stopRequested = true;
    if (abortController) {
      abortController.abort();
    }
    isParsing = false;
    resetButton();
    setRandomButtonToTodayMode();
  }

  function resetButton() {
    parseButton.innerHTML = playSVG;
    isParsing = false;
    stopRequested = false;
    abortController = null;
  }

  parseButton.addEventListener('click', async (event) => {
    if (event.ctrlKey) {
      if (confirm(chatlogsParserMessages.deleteConfirm[lang])) {
        await deleteAllChatlogsFromIndexedDB();
        alert(chatlogsParserMessages.deleteSuccess[lang]);
      }
      return;
    } else {
      if (!isParsing) {
        await startParsing();
      } else {
        stopParsing();
      }
    }
  });
}