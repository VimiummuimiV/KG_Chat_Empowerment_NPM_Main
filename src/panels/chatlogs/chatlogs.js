import "./chatlogs.scss"

import { convertImageLinksToImage } from "../../converters/imageConverter.js";
import { convertVideoLinksToPlayer } from "../../converters/videoConverter.js";

// icons
import {
  closeSVG,
  chatLogsSVG,
  calendarSVG,
  personalMessagesSVG,
  mediaMessagesSVG,
  clipboardSVG,
  toggleLeftSVG,
  toggleRightSVG,
  chevronLeftSVG,
  chevronRightSVG,
  shuffleSVG,
  playSVG
} from "../../icons.js";

import { handleExportClick } from "../../helpers/messagesFormatter.js";
import { localizedMessage } from "../../helpers/helpers.js";

// helpers
import {
  removePreviousPanel,
  copyChatlogsUrlToClipboard,
  getCurrentLanguage
} from '../../helpers/helpers.js';

import { processEncodedLinks } from "../../helpers/urlUtils.js";

import {
  triggerTargetElement,
  triggerDimmingElement
} from "../../helpers/elementVisibility.js";

import { getExactUserIdByName } from "../../helpers/apiData.js";
import { scrollToMiddle } from "../../helpers/scrollTo.js";
import { createScrollButtons } from "../../helpers/scrollButtons.js";
import { highlightMentionWords } from "../../helpers/getLatestMessageData.js";

import {
  saveChatlogToIndexedDB,
  readChatlogFromIndexedDB,
  getTotalChatlogsSizeCached
} from './chatlogsStorage.js';

// definitions
import {
  today,
  minimalChatlogsDate,
  state
} from '../../definitions.js';

import { addJumpEffect, addPulseEffect, addShakeEffect } from "../../animations.js";
import { settingsState } from "../../panels/settings/settings.js";
import { createCustomTooltip } from "../../components/tooltip.js";
import { setupChatLogsParser } from './chatlogsParser.js';

import { addChatlogsMessageToPersonal } from './chatlogsToMessages.js';

import { renderChatMessages } from './chatlogsMessages.js';
import { renderActiveUsers } from './chatlogsUserlist.js';
import { ensureUsernameColorsAndIds } from '../../helpers/colorUtils.js';
import { filterMessages } from '../../helpers/messagesSearch.js';

const { ignored } = settingsState;

const lang = getCurrentLanguage();

// Generate a random 20-digit number
const randomParam = Math.floor(Math.random() * 10 ** 20);

// --- Chatlog HTML size limit (shared constant) ---
const CHATLOG_SIZE_LIMIT_KB = 1000;
const CHATLOG_SIZE_LIMIT_BYTES = CHATLOG_SIZE_LIMIT_KB * 1024;

// Define dynamic variables
let {
  panelsEvents
} = state;

// Function to create the button for opening chat logs
export function createChatLogsButton(panel) {
  const showChatLogsButton = document.createElement('div');
  showChatLogsButton.classList.add("empowerment-button", "chat-logs-button");

  showChatLogsButton.style.position = 'relative';
  showChatLogsButton.style.zIndex = '1';
  showChatLogsButton.innerHTML = chatLogsSVG; // Add icon
  createCustomTooltip(showChatLogsButton, {
    en: 'Open Chat Logs',
    ru: 'Открыть логи чата'
  });

  showChatLogsButton.addEventListener('click', async function () {
    addPulseEffect(showChatLogsButton); // Add pulse effect
    await showChatLogsPanel();
  });

  panel.appendChild(showChatLogsButton);
}

// Function to fetch chat logs from the specified URL for a given date
export const fetchChatLogs = async (date, messagesContainer) => {
  // Clear the messagesContainer if it exists
  messagesContainer && (messagesContainer.innerHTML = '');

  const url = `https://klavogonki.ru/chatlogs/${date}.html`;

  const skippedResult = {
    chatlogs: [],
    url: url,
    size: 0,
    error: null,
    info: lang === 'ru' ? 'Пропущено: слишком большой лог.' : 'Skipped: chatlog too large.',
    placeholder: lang === 'ru' ? 'Пропущено: слишком большой лог.' : 'Skipped: chatlog too large.'
  };

  const fetchUrl = `${url}?rand=${randomParam}`;

  // Try to use IndexedDB if available
  let html;
  let loadedFromIndexedDB = false;
  const entry = await readChatlogFromIndexedDB(date);
  if (entry) {
    if (entry.skipped) {
      return skippedResult;
    } else if (entry.html) {
      html = entry.html;
      loadedFromIndexedDB = true;
    }
  }

  if (!html) {
    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const reader = response.body.getReader();
      let receivedLength = 0;
      let chunks = [];
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (value) {
          receivedLength += value.length;
          if (receivedLength > CHATLOG_SIZE_LIMIT_BYTES) {
            reader.cancel();
            if (date !== today) {
              await saveChatlogToIndexedDB({ date, skipped: true, reason: 'too large' });
            }
            return skippedResult;
          }
          chunks.push(value);
        }
        done = streamDone;
      }
      let htmlUint8 = new Uint8Array(receivedLength);
      let position = 0;
      for (let chunk of chunks) {
        htmlUint8.set(chunk, position);
        position += chunk.length;
      }
      html = new TextDecoder('utf-8').decode(htmlUint8);
      if (date !== today) {
        await saveChatlogToIndexedDB({ date, html });
      }
    } catch (error) {
      return {
        chatlogs: [],
        url: fetchUrl,
        size: 0,
        error: error.message,
        info: null,
        placeholder: lang === 'ru' ? 'Ошибка при обработке логов.' : 'Error processing logs.'
      };
    }
  }

  // Function to parse the HTML and extract chat log entries
  const parseChatLog = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    return [...doc.querySelectorAll('.ts')].map((timeElement) => {
      const usernameElement = timeElement.nextElementSibling;
      const messageNode = usernameElement?.nextSibling;

      const extractMessageText = (node) => {
        if (!node) return '';
        return [...node.childNodes].reduce((acc, child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            acc += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.tagName === 'A') {
              acc += child.getAttribute('href');
            } else if (child.tagName === 'BR') {
              return acc;
            }
          }
          return acc;
        }, '').trim();
      };

      if (usernameElement?.classList.contains('mn') && messageNode) {
        let messageText = '';

        if (messageNode.nodeType === Node.ELEMENT_NODE) {
          messageText = extractMessageText(messageNode);
        } else if (messageNode.nodeType === Node.TEXT_NODE) {
          const nextSibling = usernameElement.nextElementSibling;
          if (nextSibling && nextSibling.tagName === 'A') {
            messageText = `${messageNode.textContent.trim()} ${nextSibling.getAttribute('href')}`;
          } else {
            messageText = messageNode.textContent.trim();
          }
        }

        if (!messageText) {
          const combinedText = extractMessageText(usernameElement.nextSibling);
          messageText = combinedText;
        }

        return {
          time: timeElement.textContent.trim().replace(/[\[\]]/g, ''),
          username: usernameElement.textContent.trim().replace(/<|>/g, ''),
          message: messageText || null,
        };
      }

      const systemMessageElement = timeElement.nextElementSibling;
      if (systemMessageElement && systemMessageElement.classList.contains('mne')) {
        const messageText = systemMessageElement.textContent.trim();
        return {
          time: timeElement.textContent.trim().replace(/[\[\]]/g, ''),
          username: 'SYSTEM',
          message: messageText || null,
        };
      }

      return null;
    }).filter(Boolean);
  };

  const htmlContent = html.length > CHATLOG_SIZE_LIMIT_BYTES ? html.slice(0, CHATLOG_SIZE_LIMIT_BYTES) : html;
  const chatlogs = parseChatLog(htmlContent);
  const limitReached = html.length > CHATLOG_SIZE_LIMIT_BYTES;

  // Step 1: Remove consecutive duplicate messages
  const noSpamMessages = [];
  let lastMessage = null;
  for (const log of chatlogs) {
    const isDifferentMessage = log.message !== lastMessage?.message;
    const isDifferentUser = log.username !== lastMessage?.username;
    if (isDifferentMessage || isDifferentUser) {
      noSpamMessages.push(log);
      lastMessage = log;
    }
  }
  // Step 2: Filter out messages from ignored users
  const finalChatlogs = noSpamMessages.filter((log) => !ignored.includes(log.username));

  // Return the filtered chat logs, size of HTML, URL, and info
  const sizeInKB = (htmlContent.length / 1024).toFixed(2);

  // --- Calculate total size of all chatlogs in IndexedDB ---
  const totalIndexedDBSizeKB = getTotalChatlogsSizeCached();

  // Format cache size for display (GB if >= 1024 MB, MB if >= 1024 KB, else KB)
  function formatCacheSize(sizeKB) {
    const num = parseFloat(sizeKB);
    if (isNaN(num)) return sizeKB;
    if (num >= 1024 * 1024) return (num / (1024 * 1024)).toFixed(2) + (lang === 'ru' ? ' ГБ' : ' GB');
    if (num >= 1024) return (num / 1024).toFixed(2) + (lang === 'ru' ? ' МБ' : ' MB');
    return num.toFixed(2) + (lang === 'ru' ? ' КБ' : ' KB');
  }

  let placeholder = lang === 'ru' ? `Размер: ${sizeInKB} КБ` : `Size: ${sizeInKB} KB`;
  if (limitReached) {
    placeholder += lang === 'ru' ? ' (Достигнут лимит файла)' : ' (File limit reached)';
  } else {
    placeholder += loadedFromIndexedDB ? (lang === 'ru' ? ' (Кэш)' : ' (Cache)') : '';
  }
  if (totalIndexedDBSizeKB !== null && !isNaN(totalIndexedDBSizeKB)) {
    const formattedCacheSize = formatCacheSize(totalIndexedDBSizeKB);
    placeholder += lang === 'ru' ? ` | Кэш: ${formattedCacheSize}` : ` | Cache: ${formattedCacheSize}`;
  }

  return {
    chatlogs: finalChatlogs,
    url: url,
    size: htmlContent.length,
    info: limitReached
      ? (lang === 'ru' ? 'Достигнут лимит размера файла.' : 'File size limit reached.')
      : (loadedFromIndexedDB ? (lang === 'ru' ? 'Загружено из кэша.' : 'Loaded from cache.') : null),
    error: null,
    placeholder
  }
}

function getRandomDateInRange() {
  const startDate = new Date(minimalChatlogsDate); // Start date
  const endDate = new Date(); // Current date

  // Calculate the difference in milliseconds
  const dateDifference = endDate - startDate;

  // Generate a random number of milliseconds between 0 and dateDifference
  const randomMilliseconds = Math.floor(Math.random() * dateDifference);

  // Create a random date by adding the random milliseconds to the start date
  const randomDate = new Date(startDate.getTime() + randomMilliseconds);

  // Format the date to 'YYYY-MM-DD' using Intl.DateTimeFormat
  const formattedDate = new Intl.DateTimeFormat('en-CA').format(randomDate);

  return formattedDate;
}

// Function to get user ID by username (with caching in localStorage)
async function getUserId(username) {
  const userIdsCache = JSON.parse(localStorage.getItem('userIdsCache') || '{}');

  // If the user ID is cached, return it
  if (userIdsCache[username]) return userIdsCache[username];

  try {
    // Fetch the user ID
    const userId = await getExactUserIdByName(username);
    if (userId) {
      userIdsCache[username] = userId;
      localStorage.setItem('userIdsCache', JSON.stringify(userIdsCache));
      return userId;
    }
  } catch (error) {
    console.error(`Error fetching user ID for ${username}:`, error);
  }

  return null; // Return null if no user found
}

//   Function to display the chat logs panel
// Load initially with default date or date given by personal messages panel with parameter date
export async function showChatLogsPanel(personalMessagesDate) {
  // Check if the panel already exists
  const existingPanel = document.querySelector('.chat-logs-panel');
  if (existingPanel) {
    existingPanel.remove(); // Remove the settings panel
    triggerDimmingElement('hide');
    return; // Return immediately to prevent further execution
  }

  // Remove any previous panel before creating a new one
  removePreviousPanel();

  // Create a container div with class 'chat-logs-panel'
  const chatLogsPanel = document.createElement('div');
  chatLogsPanel.className = 'chat-logs-panel popup-panel';

  // Create a container div for the panel header
  const panelHeaderContainer = document.createElement('div');
  panelHeaderContainer.className = 'panel-header';

  // Create a container div with class 'panel-control-buttons'
  const panelControlButtons = document.createElement('div');
  panelControlButtons.className = 'panel-control-buttons';

  // Create a container div for the search input
  const chatlogsSearchContainer = document.createElement('div');
  chatlogsSearchContainer.className = 'search-for-chatlogs-messages';

  // Create the input field for searching users
  const chatlogsSearchInput = document.createElement('input');
  chatlogsSearchInput.className = 'chatlogs-search-input';
  chatlogsSearchInput.type = 'text';
  createCustomTooltip(chatlogsSearchInput, {
    en: ` 
      [Ctrl + Click] clear input and reset filtered items
      [Valid date + Enter] load chat logs for the date in input field (e.g. 2023-10-01, 2023:10:01, 231001, 2310, 2310:01)
    `,
    ru: ` 
      [Ctrl + Click] очистить поле и сбросить фильтр
      [Корректная дата + Enter] загрузить чат-логи за выбранную дату (например, 2023-10-01, 2023:10:01, 231001, 2310, 2310:01)
    `
  });

  // Append search input to the search container
  chatlogsSearchContainer.appendChild(chatlogsSearchInput);
  // Append the search container to the panel header container
  panelHeaderContainer.appendChild(chatlogsSearchContainer);

  // Add input event listener to filter items as the user types
  chatlogsSearchInput.addEventListener('input', () => filterMessages(chatlogsSearchInput.value));

  // Clears the input when the left mouse button (LMB) is clicked while holding the Ctrl key
  // Also updates the filtered items accordingly
  chatlogsSearchInput.addEventListener('click', (event) => {
    if (event.ctrlKey) {
      chatlogsSearchInput.value = '';
      // Call the function to update the filtered items based on the cleared input
      filterMessages(chatlogsSearchInput.value);
    }
  });

  // Add keydown event listener to handle date format and validity check
  chatlogsSearchInput.addEventListener('keydown', async (event) => {
    const inputValue = chatlogsSearchInput.value;

    if (event.key === 'Enter') {
      let normalizedDate = inputValue;

      // Handle 8-digit and 6-digit date formats
      if (/^\d{8}$/.test(inputValue)) {
        normalizedDate = inputValue.length === 6 ? '20' + inputValue : inputValue;
        normalizedDate = normalizedDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      } else if (/^\d{6}$/.test(inputValue)) {
        normalizedDate = '20' + inputValue.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3');
      }

      // Check if the normalized input matches either 'yyyy:mm:dd' or 'yyyy-mm-dd' format
      const isValidFormat = /^\d{2,4}[:\-]\d{2}[:\-]\d{2}$/.test(normalizedDate.replace(/:/g, '-'));

      // Check if the normalized date is a valid date
      const isValidDate = isValidFormat && !isNaN(new Date(normalizedDate.replace(/:/g, '-')).getTime());

      if (isValidDate) {
        await loadChatLogs(normalizedDate); // Load chat logs for the determined date
        showDateInput(dateInput);
      } else {
        const lang = getCurrentLanguage();
        const alertMsg = lang === 'ru'
          ? [
            'Пожалуйста, введите корректную дату.',
            '',
            'Допустимые форматы:',
            '1. гггг-мм-дд',
            '2. гггг:мм:дд',
            '3. гг-мм-дд',
            '4. гг:мм:дд',
            '5. ггггммдд',
            '6. ггммдд',
            ''
          ].join('\n')
          : [
            'Please enter a valid date.',
            '',
            'Valid formats include:',
            '1. yyyy-mm-dd',
            '2. yyyy:mm:dd',
            '3. yy-mm-dd',
            '4. yy:mm:dd',
            '5. yyyymmdd',
            '6. yymmdd',
            ''
          ].join('\n');
        alert(alertMsg);
      }

      // Clear the input value after processing the "Enter" key
      chatlogsSearchInput.value = '';
    }
  });

  // Focus on the search input using requestAnimationFrame
  function focusOnSearchField() { requestAnimationFrame(function () { chatlogsSearchInput.focus(); }); } focusOnSearchField();

  // Create a parse button in the panel header
  const parseButton = document.createElement('div');
  parseButton.className = 'large-button panel-header-parse-button';
  parseButton.innerHTML = playSVG;
  createCustomTooltip(parseButton, {
    en: `
      [Click] to parse Chat Logs
      [Ctrl + Click] to delete stored Chat Logs from IndexedDB
    `,
    ru: `
      [Клик] спарсить логи чата
      [Ctrl + Клик] удалить сохранённые логи из IndexedDB
    `
  });
  setupChatLogsParser(parseButton, chatLogsPanel);

  panelControlButtons.appendChild(parseButton);

  // Create a date input toggle with similar styles as the close button
  const dateInputToggle = document.createElement('div');
  dateInputToggle.className = "large-button panel-header-date-button";
  dateInputToggle.innerHTML = calendarSVG;

  // Function to toggle visibility of an element
  function toggleDateInputVisibility(element) {
    element.style.display = element.style.display === 'none' ? 'flex' : 'none';
  }

  // Function to show the date input if it is currently hidden
  function showDateInput(element) {
    if (element.style.display === 'none') element.style.display = 'flex';
  }

  // Toggle the visibility of the date input when the toggle is clicked
  dateInputToggle.addEventListener('click', () => {
    toggleDateInputVisibility(dateInput);
  });

  // Create the date input field
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'chatlogs-date-input';
  dateInput.style.display = "none";

  // Append the date button and input field to the control buttons container
  panelControlButtons.appendChild(dateInputToggle);
  panelControlButtons.appendChild(dateInput);

  // Create a toggle mention messages component
  const toggleMentionMessages = document.createElement('div');
  toggleMentionMessages.className = "large-button panel-header-toggle-mention-messages-button";
  // Set the inner HTML of the toggle component with a suitable SVG or text
  toggleMentionMessages.innerHTML = personalMessagesSVG;
  createCustomTooltip(toggleMentionMessages, {
    en: 'Toggle Mention Messages',
    ru: 'Показать только упоминания'
  });

  // Add a click event listener to toggle the visibility of messages without mentions
  toggleMentionMessages.addEventListener('click', async () => {
    toggleMessagesVisibility('mention');
  });

  // Create a new div element for the toggle mention messages counter
  const toggleMentionMessagesCounter = document.createElement('div');
  // Assign a class name to the element
  toggleMentionMessagesCounter.className = 'toggle-mention-messages-counter';
  toggleMentionMessagesCounter.textContent = '0'; // Set as default value before assign

  // Append the counter inside the toggleMentionMessages component
  toggleMentionMessages.appendChild(toggleMentionMessagesCounter);
  // Append the toggle mention messages component to the control panel
  panelControlButtons.appendChild(toggleMentionMessages);

  // Create a toggle media messages component
  const toggleMediaMessages = document.createElement('div');
  toggleMediaMessages.className = "large-button panel-header-toggle-media-messages-button";
  // Set the inner HTML of the toggle component with a suitable SVG or text
  toggleMediaMessages.innerHTML = mediaMessagesSVG;
  createCustomTooltip(toggleMediaMessages, {
    en: 'Toggle Media Messages',
    ru: 'Показать только медиа контент'
  });
  // Apply common styles to the component
  // applyHeaderButtonStyles(toggleMediaMessages, 'darkslategray');

  // Add a click event listener to toggle the visibility of media messages
  toggleMediaMessages.addEventListener('click', async () => {
    toggleMessagesVisibility('media');
  });

  // Create a new div element for the toggle media messages counter
  const toggleMediaMessagesCounter = document.createElement('div');
  // Assign a class name to the element
  toggleMediaMessagesCounter.className = 'toggle-media-messages-counter';
  toggleMediaMessagesCounter.textContent = '0'; // Set as default value before assign

  // Append the counter inside the toggleMediaMessages component
  toggleMediaMessages.appendChild(toggleMediaMessagesCounter);

  // Append the toggle media messages component to the control panel
  panelControlButtons.appendChild(toggleMediaMessages);

  // Function to update the media and mention counters
  function updateMediaAndMentionCounters() {
    // Update the media counter
    toggleMediaMessagesCounter.textContent = document.querySelectorAll('.chat-logs-container .media').length;
    // Update the mention counter
    toggleMentionMessagesCounter.textContent = document.querySelectorAll('.chat-logs-container .mention').length;
  }

  // Create a copy chatlogs button element
  const copyChatLogsUrl = document.createElement('div');
  copyChatLogsUrl.className = "large-button panel-header-copy-button";
  copyChatLogsUrl.innerHTML = clipboardSVG;
  createCustomTooltip(copyChatLogsUrl, {
    en: ` 
      [Click] to copy Chat Logs Url
      [Ctrl + Click] to save Chat Logs with title
      [Shift + Click] to show/hide saved Chat Logs
      [Alt + Click] to copy Chat Logs in BBCode, Markdown, or Plain format
      [Alt + Shift + Click] to save Chat Logs in BBCode, Markdown, or Plain format
    `,
    ru: ` 
      [Клик] скопировать ссылку на чат-логи
      [Ctrl + Клик] сохранить чат-логи с заголовком
      [Shift + Клик] показать/скрыть сохранённые чат-логи
      [Alt + Клик] скопировать чат-логи в BBCode, Markdown или Plain
      [Alt + Shift + Клик] сохранить чат-логи в BBCode, Markdown или Plain
    `
  });

  // Helper function to extract date from the URL
  const extractDateFromUrl = (url) => {
    const chatlogsDateRegex = /(\d{4}-\d{2}-\d{2})/;
    const match = url.match(chatlogsDateRegex);
    return match ? match[1] : null; // Return the date if match is found, else return null
  };

  // Function to create and populate chat log links
  function createChatLogLinks(savedChatlogs, chatLogsLinksContainer) {
    // Check if the container exists and return if not
    if (!chatLogsLinksContainer) return;
    // Clear the container before repopulating it
    chatLogsLinksContainer.replaceChildren();

    savedChatlogs.forEach(({ url, title }) => {
      const date = extractDateFromUrl(url); // Extract date from URL

      // Create the wrapper container for each link
      const logWrapper = document.createElement('div');
      logWrapper.classList.add('saved-chatlog-url-wrapper');

      // Create the log link element
      const logLink = document.createElement('a');
      logLink.classList.add('saved-chatlog-url');
      logLink.textContent = date; // Display the date
      logLink.href = url; // Store the URL in the href attribute

      // Create the title element
      const logTitle = document.createElement('span');
      logTitle.classList.add('saved-chatlog-url-title');
      logTitle.textContent = title || '➕'; // Display the title (or an empty string if none provided)

      // Append the elements to the wrapper
      logWrapper.appendChild(logLink);
      logWrapper.appendChild(logTitle);

      // Append the wrapper to the container
      chatLogsLinksContainer.appendChild(logWrapper);
    });
  }

  // Add a click event listener to copy chatLogsUrlForCopy to the clipboard
  copyChatLogsUrl.addEventListener('click', (event) => {
    let chatLogsLinksContainer = document.querySelector('.saved-chatlog-container');

    !chatLogsLinksContainer && !event.shiftKey && addJumpEffect(copyChatLogsUrl, 0, 0);

    if (chatLogsLinksContainer && !event.ctrlKey && !chatLogsLinksContainer.contains(event.target)) {
      chatLogsLinksContainer.remove();
    }

    let savedChatlogs = JSON.parse(localStorage.getItem('savedChatlogs')) || [];

    // Prevent copy/save if there are no chatlogs loaded
    const chatlogItems = document.querySelectorAll('.chat-logs-container .message-item');
    if ((event.altKey || (event.altKey && event.shiftKey)) && chatlogItems.length === 0) {
      localizedMessage({
        en: 'No chat logs to copy or save.',
        ru: 'Нет чатлогов для копирования или сохранения.'
      }, 'alert');
      return;
    }

    // Handle export with Alt and Alt+Shift to copy or save chat logs
    if (event.altKey) {
      handleExportClick(event, chatLogsContainer, {
        date: dateInput.value || today,
        isMessagesPanel: false,
        includeDateHeaders: true,
        includeMessageLinks: true,
        prefix: 'chatlogs',
      });
      return;
    }

    if (event.ctrlKey && !event.target.closest('.saved-chatlog-url')) {
      const currentUrlDate = extractDateFromUrl(chatLogsUrlForCopy);
      if (!currentUrlDate) return;

      // Ask for title input
      const title = prompt('Enter a title for this chat log:', '➕');

      // Check if the URL with the same date already exists
      const urlExists = savedChatlogs.some(log => extractDateFromUrl(log.url) === currentUrlDate);

      if (!urlExists) {
        // Add the new URL and title if no match was found for the date
        savedChatlogs.push({ url: chatLogsUrlForCopy, title: title || '➕' });

        // Sort the saved URLs based on the date extracted from the URL
        savedChatlogs.sort((a, b) => {
          const dateA = extractDateFromUrl(a.url);
          const dateB = extractDateFromUrl(b.url);
          return new Date(dateA) - new Date(dateB);
        });

        // Store the updated list back in localStorage
        localStorage.setItem('savedChatlogs', JSON.stringify(savedChatlogs));
      }
      createChatLogLinks(savedChatlogs, chatLogsLinksContainer);
    } else if (event.shiftKey) {
      if (savedChatlogs.length > 0 && !chatLogsLinksContainer) {
        chatLogsLinksContainer = document.createElement('div');
        chatLogsLinksContainer.classList.add('saved-chatlog-container');
        createChatLogLinks(savedChatlogs, chatLogsLinksContainer);

        copyChatLogsUrl.appendChild(chatLogsLinksContainer);
      }
    } else {
      navigator.clipboard.writeText(chatLogsUrlForCopy)
        .catch(err => console.error('Failed to copy: ', err));
    }
  });

  panelControlButtons.appendChild(copyChatLogsUrl);

  // Retrieve `shouldShowActiveUsers` from localStorage or set it to 'shown' if it doesn't exist
  const shouldShowActiveUsers = localStorage.getItem('shouldShowActiveUsers') || (localStorage.setItem('shouldShowActiveUsers', 'shown'), 'shown');

  // Create a toggle active users button
  const toggleActiveUsers = document.createElement('div');
  toggleActiveUsers.className = "large-button panel-header-toggle-button";
  updateActiveUsersToggle(shouldShowActiveUsers); // Set initial SVG based on stored state

  // Function to update the toggle button's SVG and title based on current state
  function updateActiveUsersToggle(state) {
    toggleActiveUsers.innerHTML = state === 'shown' ? toggleLeftSVG : toggleRightSVG; // Toggle between SVGs
    createCustomTooltip(toggleActiveUsers, state === 'shown' ? {
      en: 'Hide User List',
      ru: 'Скрыть список пользователей'
    } : {
      en: 'Show User List',
      ru: 'Показать список пользователей'
    });
  }

  // Function to toggle active users and update localStorage, SVG, and title
  function toggleActiveUsersState() {
    const newState = localStorage.getItem('shouldShowActiveUsers') === 'shown' ? 'hidden' : 'shown'; // Determine new state
    localStorage.setItem('shouldShowActiveUsers', newState); // Update localStorage
    updateActiveUsersToggle(newState); // Update the displayed SVG and title

    if (newState === 'shown') {
      // Call renderActiveUsers to update the display of active users based on their message counts
      renderActiveUsers(usernameMessageCountMap, chatLogsPanel);
    } else {
      // Remove the active users container if the state is hidden
      const activeUsersContainer = chatLogsPanel.querySelector('.active-users');
      if (activeUsersContainer) {
        chatLogsPanel.removeChild(activeUsersContainer);
      }
    }
  }

  // Add click event to toggle active users
  toggleActiveUsers.addEventListener('click', toggleActiveUsersState);

  // Append the toggle active users to the panel control buttons
  panelControlButtons.appendChild(toggleActiveUsers);

  // Create and style the chevron left button
  const oneDayBackward = document.createElement('div');
  oneDayBackward.className = "large-button panel-header-one-day-back-button";
  oneDayBackward.innerHTML = chevronLeftSVG; // Assuming you have chevronLeftSVG defined
  createCustomTooltip(oneDayBackward, {
    en: 'Previous Day',
    ru: 'Предыдущий день'
  });

  // Create and style the chevron right button
  const oneDayForward = document.createElement('div');
  oneDayForward.className = "large-button panel-header-one-day-forward-button";
  oneDayForward.innerHTML = chevronRightSVG; // Assuming you have chevronRightSVG defined
  createCustomTooltip(oneDayForward, {
    en: 'Next Day',
    ru: 'Следующий день'
  });

  // Create and style the shuffle button
  const randomDay = document.createElement('div');
  randomDay.className = "large-button panel-header-shuffle-button";
  randomDay.innerHTML = shuffleSVG; // Assuming you have shuffleSVG defined
  createCustomTooltip(randomDay, {
    en: 'Random Date',
    ru: 'Случайная дата'
  });

  // Function to get current date or fallback to today's date
  function getEffectiveDate() {
    return dateInput.value ? new Date(dateInput.value) : new Date(); // Use dateInput value or today's date
  }

  // Function to update the date input and title
  const updateDateTooltip = (newDate) => {
    dateInput.value = newDate; // Update the date input
    const tooltipContent = {
      en: `Current date: ${newDate}`,
      ru: `Текущая дата: ${newDate}`
    };
    createCustomTooltip(dateInput, tooltipContent);
    createCustomTooltip(dateInputToggle, tooltipContent);
  };

  // Event listener for the chevron left button
  oneDayBackward.addEventListener('click', async () => {
    const currentDate = getEffectiveDate(); // Get the effective date
    currentDate.setDate(currentDate.getDate() - 1); // Go one day back
    await loadChatLogs(currentDate); // Load chat logs for the updated date
    showDateInput(dateInput);
    focusOnSearchField();
  });

  // Event listener for the chevron right button
  oneDayForward.addEventListener('click', async () => {
    const currentDate = getEffectiveDate(); // Get the effective date
    currentDate.setDate(currentDate.getDate() + 1); // Go one day forward
    await loadChatLogs(currentDate); // Load chat logs for the updated date
    showDateInput(dateInput);
    focusOnSearchField();
  });

  // Event listener for the shuffle button (load today's logs after parsing done)
  randomDay.addEventListener('click', async () => {
    if (randomDay.dataset.mode === 'loadToday') {
      await loadChatLogs(today);
      randomDay.dataset.mode = '';
      randomDay.classList.remove('today');
    } else {
      const randomDate = getRandomDateInRange();
      await loadChatLogs(randomDate);
    }
    randomDay.innerHTML = shuffleSVG;
    createCustomTooltip(randomDay, {
      en: 'Random Date',
      ru: 'Случайная дата'
    });
    showDateInput(dateInput);
    focusOnSearchField();
  });

  // Append buttons to the control buttons container
  panelControlButtons.appendChild(oneDayBackward);
  panelControlButtons.appendChild(oneDayForward);
  panelControlButtons.appendChild(randomDay);

  // Create a close button with the provided SVG icon
  const closePanelButton = document.createElement('div');
  closePanelButton.className = "large-button panel-header-close-button";
  closePanelButton.innerHTML = closeSVG;
  createCustomTooltip(closePanelButton, {
    en: 'Close panel',
    ru: 'Закрыть панель'
  });

  // Add a click event listener to the close panel button
  closePanelButton.addEventListener('click', () => {
    // Fade out the chat logs panel when the close button is clicked
    triggerTargetElement(chatLogsPanel, 'hide');
    triggerDimmingElement('hide');
  });

  // Append close button to control buttons, and control buttons to header
  panelControlButtons.appendChild(closePanelButton);
  panelHeaderContainer.appendChild(panelControlButtons);

  // Create a container for the chat logs
  const chatLogsContainer = document.createElement('div');
  chatLogsContainer.className = 'chat-logs-container messages-search-container';

  // Append the header and chat logs container to the chat logs panel
  chatLogsPanel.appendChild(panelHeaderContainer);
  chatLogsPanel.appendChild(chatLogsContainer);

  // Append the chat logs panel to the body
  document.body.appendChild(chatLogsPanel);

  // Create and append scroll buttons
  const { scrollButtonsContainer } = createScrollButtons(chatLogsContainer);
  chatLogsPanel.appendChild(scrollButtonsContainer);

  // Fade in the chat logs panel and dimming background
  triggerTargetElement(chatLogsPanel, 'show');
  triggerDimmingElement('show');

  // Define an object to store the hue for each username
  // Initialize a map to track message counts for unique usernames
  const usernameMessageCountMap = new Map();
  // Store the current chat logs URL for clipboard copy.
  let chatLogsUrlForCopy = ''; // Store the current chat logs URL for copying

  // Function to load the total message count into the placeholder without replacing the existing text
  function loadTotalMessageCount() {
    if (chatLogsContainer.childElementCount > 0) {
      const lang = getCurrentLanguage();
      const totalMsgLabel = lang === 'ru' ? 'Всего сообщений' : 'Total messages';
      chatlogsSearchInput.placeholder += ` | ${totalMsgLabel}: ${chatLogsContainer.childElementCount}`;
    }
  }

  // Function to load and display chat logs into the container
  const loadChatLogs = async (date) => {
    // Normalize date input to 'yyyy-mm-dd' format, supporting 'yyyy:mm:dd' format as well
    const normalizeDate = date => /^\d{4}:\d{2}:\d{2}$/.test(date) ? date.replace(/:/g, '-') : date;
    // Normalize and format the date
    const formattedDate = new Intl.DateTimeFormat('en-CA').format(new Date(normalizeDate(date)));

    // Check if the provided date is out of bounds (less than minimalChatlogsDate or greater than today)
    if (formattedDate < minimalChatlogsDate || formattedDate > today) {
      const lang = getCurrentLanguage();
      const minDateMsg =
        lang === 'ru'
          ? `Выбранная дата не может быть раньше ${minimalChatlogsDate}.`
          : `The selected date cannot be earlier than ${minimalChatlogsDate}.`;
      const futureDateMsg =
        lang === 'ru'
          ? 'Вы не можете загрузить будущую дату.'
          : 'You cannot load a future date.';
      alert(
        formattedDate < minimalChatlogsDate
          ? minDateMsg
          : futureDateMsg
      );
      return; // Exit the function if the date is invalid
    }

    // Call the updateDateTooltip function with the formattedDate
    updateDateTooltip(formattedDate);

    // Fetch chat logs and pass the chatLogsContainer as the parent container
    const { chatlogs, url, placeholder } = await fetchChatLogs(formattedDate, chatLogsContainer);

    // Use the placeholder returned from fetchChatLogs (includes cache size info)
    chatlogsSearchInput.placeholder = placeholder;

    // Assign the fetched URL to the chatLogsUrlForCopy variable
    chatLogsUrlForCopy = `${url}?rand=${randomParam}`

    // Clear previous counts
    usernameMessageCountMap.clear();


    // Ensure username colors/ids are loaded and cached before rendering
    const allUsernames = [...new Set(chatlogs.map(e => e.username).filter(u => u && u !== 'SYSTEM'))];
    await ensureUsernameColorsAndIds(allUsernames);

    // Use the renderer to render all messages and get the updated usernameMessageCountMap
    const updatedMap = renderChatMessages(chatlogs, chatLogsContainer);
    usernameMessageCountMap.clear();
    for (const [k, v] of updatedMap.entries()) usernameMessageCountMap.set(k, v);

    // Call renderActiveUsers to update the display of active users based on their message counts
    renderActiveUsers(usernameMessageCountMap, chatLogsPanel);

    requestAnimationFrame(() => {
      convertImageLinksToImage('chatlogsMessages');
      convertVideoLinksToPlayer('chatlogsMessages');
      processEncodedLinks('chatlogsMessages'); // Decodes links within the chat logs section.
      highlightMentionWords('chatlogsMessages');
      chatLogsContainer.scrollTop = chatLogsContainer.scrollHeight; // Scroll to the very bottom

      // Update the media and mention counters
      updateMediaAndMentionCounters();
      // Call the function to load the total message count once
      loadTotalMessageCount();
      // Call the filter function with the updated input value
      chatlogsSearchInput.value.length > 0 && filterMessages(chatlogsSearchInput.value);

      // Apply current visibility settings without toggling
      toggleMessagesVisibility(null, false);
    });

  };

  // Load chat logs based on the provided date or default to today's date
  const dateToLoad = personalMessagesDate || today; // Use personalMessagesDate if available
  await loadChatLogs(dateToLoad); // Load chat logs for the determined date
  // Check if personalMessagesDate is given as parameter or null to show the date input field
  if (personalMessagesDate) showDateInput(dateInput); // Show the date input field

  // Set the max attribute to today's date
  dateInput.max = today; // Set the maximum value to today's date
  // Set the min attribute to '2012-02-12'
  dateInput.min = minimalChatlogsDate; // Assign the minimum date
  dateInput.value = dateToLoad; // Set the value to the date to load
  createCustomTooltip(dateInputToggle, {
    en: `Current date: ${dateToLoad}`,
    ru: `Текущая дата: ${dateToLoad}`
  }); // Create a tooltip for the date input toggle

  // Add an event listener for the date input change
  dateInput.addEventListener('change', async (event) => {
    const selectedDate = event.target.value; // Get the selected date
    await loadChatLogs(selectedDate); // Load chat logs for the selected date
    createCustomTooltip(dateInputToggle, {
      en: `Current date: ${selectedDate}`,
      ru: `Текущая дата: ${selectedDate}`
    }); // Update the tooltip with the selected date
  });

  // Define the event handler function for chat logs panel
  panelsEvents.handleChatLogsKeydown = (event) => { // Assign the function to the object
    if (event.key === 'Escape') {
      triggerTargetElement(chatLogsPanel, 'hide');
      triggerDimmingElement('hide');
      document.removeEventListener('keydown', panelsEvents.handleChatLogsKeydown); // Remove the event listener
    }
  };

  // Attach the event listener
  document.addEventListener('keydown', panelsEvents.handleChatLogsKeydown);

  // Delegated event listeners for all message actions in chatLogsContainer
  chatLogsPanel.addEventListener('click', async (event) => {
    if (event.target.closest('a')) return;
    const messageItem = event.target.closest('.message-item');
    const timeElement = event.target.closest('.message-time');
    const usernameElement = event.target.closest('.message-username');
    const messageTextElement = event.target.closest('.message-text');
    if (messageItem || messageTextElement) {
      // --- Ctrl+Click: Add to personal messages ---
      if (event.ctrlKey && messageItem) {
        addChatlogsMessageToPersonal(messageItem, dateInput);
        return;
      }
      resetMessagesVisibility();
      if (timeElement) {
        let date = dateInput.value;
        const time = timeElement.textContent;
        // Always try to find the nearest previous .date-item for the correct date
        let dateItem = timeElement.closest('.chat-logs-container');
        if (dateItem) {
          let prev = timeElement.parentElement;
          while (prev && !prev.classList.contains('date-item')) {
            prev = prev.previousElementSibling;
          }
          if (prev && prev.classList.contains('date-item')) {
            // Use only the text content of the .date-text child, not the whole .date-item
            const dateText = prev.querySelector('.date-text');
            if (dateText) {
              date = dateText.textContent.trim();
            } else {
              date = prev.textContent.trim();
            }
          }
        }
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          copyChatlogsUrlToClipboard(date, time, timeElement);
          return;
        }
        const url = `https://klavogonki.ru/chatlogs/${date}.html#${time}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (usernameElement) {
        const username = usernameElement.textContent;
        const userId = await getUserId(username);
        if (userId) {
          const url = `https://klavogonki.ru/u/#/${userId}/`;
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          addShakeEffect(usernameElement);
        }
        return;
      }

      // Default: scroll to middle on message item click
      requestAnimationFrame(async () => {
        await scrollToMiddle(chatLogsContainer, messageItem);
      });
    }
  });

  // Create custom tooltips for message time elements
  createCustomTooltip('.message-time', chatLogsPanel, (el) => ({
    en: ` 
      [Click] Open chatlog at ${el.textContent}
      [Shift + Click] Copy chatlogs URL to clipboard
    `,
    ru: ` 
      [Клик] открыть чатлог на ${el.textContent}
      [Shift + Клик] скопировать ссылку на чатлог
   `
  }), true);

  // Create custom tooltips for username elements
  createCustomTooltip('.message-username', chatLogsPanel, (el) => ({
    en: `[Click] Open ${el.textContent} profile`,
    ru: `[Клик] открыть профиль ${el.textContent}`
  }), true);

  // Create custom tooltips for message text elements
  createCustomTooltip('.message-text', chatLogsPanel, (el) => ({
    en: `
      [Click] Scroll message to the middle of the chat logs
      [Ctrl + Click] add message to the messages panel  
    `,
    ru: `
      [Клик] прокрутить сообщение к центру чатлога
      [Ctrl + Клик] добавить сообщение в панель сообщений
    `
  }), true);

  // Delegated event listeners for active users
  chatLogsPanel.addEventListener('click', (event) => {
    const userElement = event.target.closest('.active-user-item');
    if (userElement) {
      const nicknameElement = userElement.querySelector('.active-user-name');
      const username = nicknameElement?.textContent;
      if (!username) return;
      const currentValue = chatlogsSearchInput.value.trim();
      const usernameEntry = event.ctrlKey ? `, ${username}` : username;
      chatlogsSearchInput.value = (currentValue === username)
        ? ''
        : (event.ctrlKey && !currentValue.includes(username))
          ? currentValue + usernameEntry
          : username;
      filterMessages(chatlogsSearchInput.value);
    }
  });

  // Create custom tooltips for active user names in the active users list
  createCustomTooltip('.active-user-name', chatLogsPanel, (el) => ({
    en: `
      [Click] to filter messages by ${el.textContent}
      [Repeat Click] to clear ${el.textContent} from the search input
      [Ctrl + Click] to add additional username to the search input
    `,
    ru: ` 
      [Клик] фильтровать сообщения по ${el.textContent}
      [Повторный клик] убрать ${el.textContent} из поиска
      [Ctrl + Клик] добавить пользователя к поиску
    `
  }), true);

  // Delegation-based custom tooltip for saved chatlog links
  createCustomTooltip('.saved-chatlog-url', chatLogsPanel, (el) => ({
    en: `
      [Click] Load chat logs for ${el.textContent}
      [Ctrl + Click] Remove this saved chat log
      [Middle Click]Open in new tab
    `,
    ru: `
      [Клик] загрузить чат - логи за ${el.textContent}
      [Ctrl + Клик] удалить сохранённый чатлог
      [Средний клик] открыть в новой вкладке
    `
  }), true);

  // Delegation-based custom tooltip for saved chatlog titles
  createCustomTooltip('.saved-chatlog-url-title', chatLogsPanel, (el) => ({
    en: `[Click] Edit title for this chat log`,
    ru: `[Клик] изменить заголовок для этого чатлога`
  }), true);

  // Delegation-based click event for saved chatlog links and titles
  chatLogsPanel.addEventListener('click', async (event) => {
    // Saved chatlog link (date)
    const savedLink = event.target.closest('.saved-chatlog-url');
    if (savedLink) {
      event.preventDefault();
      let savedChatlogs = JSON.parse(localStorage.getItem('savedChatlogs')) || [];
      if (event.ctrlKey) {
        const urlToRemove = savedLink.href;
        // Remove from savedChatlogs
        const updatedChatlogs = savedChatlogs.filter(log => log.url !== urlToRemove);
        if (updatedChatlogs.length !== savedChatlogs.length) {
          savedChatlogs = updatedChatlogs;
          localStorage.setItem('savedChatlogs', JSON.stringify(savedChatlogs));
          const wrapper = savedLink.closest('.saved-chatlog-url-wrapper');
          if (wrapper) wrapper.remove();
        }
      } else if (event.button === 1) {
        // Middle click: open in new tab
        window.open(savedLink.href, '_blank', 'noopener,noreferrer');
      } else {
        // Normal click: load chat logs for this date
        const date = savedLink.textContent;
        await loadChatLogs(date);
      }
      return;
    }

    // Saved chatlog title
    const savedTitle = event.target.closest('.saved-chatlog-url-title');
    if (savedTitle) {
      let savedChatlogs = JSON.parse(localStorage.getItem('savedChatlogs')) || [];
      const wrapper = savedTitle.closest('.saved-chatlog-url-wrapper');
      const link = wrapper && wrapper.querySelector('.saved-chatlog-url');
      if (!link) return;
      const url = link.href;
      const newTitle = prompt('Enter a new title for this chat log:', savedTitle.textContent);
      if (newTitle !== null && newTitle !== savedTitle.textContent) {
        savedTitle.textContent = newTitle;
        const logIndex = savedChatlogs.findIndex(log => log.url === url);
        if (logIndex !== -1) {
          savedChatlogs[logIndex].title = newTitle;
          localStorage.setItem('savedChatlogs', JSON.stringify(savedChatlogs));
        }
      }
      return;
    }
  });

  // Panel-local state for message visibility
  let visibleMessages = { media: false, mention: false };

  // Toggle or apply visibility of messages using direct references
  function toggleMessagesVisibility(selector, toggle = true) {
    if (toggle && selector) {
      const isMedia = selector === 'media';
      const isMention = selector === 'mention';
      visibleMessages = {
        media: isMedia ? !visibleMessages.media : false,
        mention: isMention ? !visibleMessages.mention : false
      };
    }
    // Apply visibility based on current visibleMessages state
    chatLogsContainer.querySelectorAll('.message-item').forEach(item => {
      const hasMediaClass = item.querySelector('.media');
      const hasMentionClass = item.querySelector('.mention');
      if (visibleMessages.media) {
        item.classList.toggle('hidden-message', !hasMediaClass);
      } else if (visibleMessages.mention) {
        item.classList.toggle('hidden-message', !hasMentionClass);
      } else {
        item.classList.remove('hidden-message');
      }
    });
    // Update toggle button active states using direct references
    toggleMentionMessages.classList.toggle('active', visibleMessages.mention);
    toggleMediaMessages.classList.toggle('active', visibleMessages.media);
  }

  // Reset all filters and reveal all messages using direct references
  function resetMessagesVisibility() {
    visibleMessages = { media: false, mention: false };
    toggleMentionMessages.classList.remove('active');
    toggleMediaMessages.classList.remove('active');
    chatlogsSearchInput.value = '';
    filterMessages('');
  }
}
