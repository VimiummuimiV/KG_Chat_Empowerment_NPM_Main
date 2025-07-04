import "./messages.scss"

import { convertImageLinksToImage } from "../../converters/imageConverter.js";
import { convertVideoLinksToPlayer } from "../../converters/videoConverter.js";

// icons
import {
  personalMessagesSVG,
  saveSVG,
  importSVG,
  exportSVG,
  clipboardSVG,
  trashSVG,
  closeSVG,
  playSVG
} from "../../icons.js";

// helpers && helpers definitions
import { removePreviousPanel } from '../../helpers/helpers.js';
import { filterMessages } from '../../helpers/messagesSearch.js';

import {
  findGeneralChatMessage,
  updateMessageCount,
  getMessages
} from "./messagesHelpers.js";

import { processEncodedLinks } from "../../helpers/urlUtils.js";
import { handleExportClick } from "../../helpers/messagesFormatter.js";

import {
  triggerTargetElement,
  triggerDimmingElement
} from "../../helpers/elementVisibility.js";

import { addJumpEffect, addPulseEffect } from "../../animations.js";
import { localizedMessage, normalizeDate } from "../../helpers/helpers.js";
import { parsePersonalMessages } from "./messagesParser.js";

import { createCustomTooltip } from "../../components/tooltip.js";
import { createScrollButtons } from "../../helpers/scrollButtons.js";
import { highlightMentionWords } from "../../helpers/getLatestMessageData.js";
import { setupMessagesTooltips } from "./messagesDelegatedTooltips.js";
import { setupMessagesEvents } from "./messagesDelegatedEvents.js";

// definitions
import {
  today,
  state,
  timeColors,
  messageColors
} from '../../definitions.js';

// Define dynamic variables
let {
  panelsEvents
} = state;

// Define the localStorage keys in one place
export const PERSONAL_MESSAGES_KEY = 'personalMessages';
const NEW_MESSAGES_COUNT_KEY = 'newMessagesCount';
const PERSONAL_MESSAGES_BACKUP_KEY = 'personalMessagesBackup';
export const ABSENT_MENTIONS_CACHE_KEY = 'absentMentionsLastFetch';

// Function to create the button for opening personal messages
export function createMessagesButton(panel) {
  const showPersonalMessagesButton = document.createElement('div');
  showPersonalMessagesButton.classList.add("empowerment-button", "personal-messages-button");
  showPersonalMessagesButton.innerHTML = personalMessagesSVG;

  // Create the small indicator for all message count
  const allMessageIndicator = document.createElement('div');
  allMessageIndicator.classList.add("message-count", "total-message-count");
  const personalMessages = JSON.parse(localStorage.getItem(PERSONAL_MESSAGES_KEY)) || {};
  allMessageIndicator.textContent = Object.keys(personalMessages).length;
  showPersonalMessagesButton.appendChild(allMessageIndicator);

  // Create the small indicator for new message count
  const newMessageIndicator = document.createElement('div');
  newMessageIndicator.classList.add("message-count", "new-message-count");

  // Get the new messages count from localStorage or set to 0 if not present
  let newMessagesCount = Number(localStorage.getItem(NEW_MESSAGES_COUNT_KEY)) || (localStorage.setItem(NEW_MESSAGES_COUNT_KEY, '0'), 0);

  newMessageIndicator.textContent = newMessagesCount;
  newMessageIndicator.style.visibility = newMessagesCount > 0 ? 'visible' : 'hidden';
  showPersonalMessagesButton.appendChild(newMessageIndicator);

  createCustomTooltip(showPersonalMessagesButton, {
    en: 'Open Messages',
    ru: 'Открыть сообщения'
  });

  showPersonalMessagesButton.addEventListener('click', function () {
    addPulseEffect(showPersonalMessagesButton);
    showMessagesPanel();
    const personalMessagesCount = Object.keys(JSON.parse(localStorage.getItem(PERSONAL_MESSAGES_KEY)) || {}).length;
    if (personalMessagesCount > 0) {
      localStorage.setItem(NEW_MESSAGES_COUNT_KEY, '0');
      newMessagesCount = 0;
      newMessageIndicator.textContent = newMessagesCount;
    }
  });

  panel.appendChild(showPersonalMessagesButton);
} // createMessagesButton END

// Function to display the personal messages panel
export async function showMessagesPanel() {
  const existingPanel = document.querySelector('.cached-messages-panel');
  if (existingPanel) {
    existingPanel.remove();
    triggerDimmingElement('hide');
    return;
  }

  // Flag to track if this is the first time the panel is being run
  let isFirstPanelRun = true;
  // Flag to track if messages are being imported
  let isMessagesImport = false;
  let isConvertingContent = false;

  // Update the message count after panel load to reset the value if messages were not saved
  updateMessageCount();
  // Remove 'personalMessagesBackup' from localStorage if it exists
  if (localStorage.getItem(PERSONAL_MESSAGES_BACKUP_KEY)) localStorage.removeItem(PERSONAL_MESSAGES_BACKUP_KEY);
  // Remove any previous panel before creating a new one
  removePreviousPanel();

  // Reset the new messages indicator to 0
  const newMessagesCountElement = document.querySelector('.personal-messages-button .new-message-count');
  if (newMessagesCountElement) newMessagesCountElement.textContent = '0';
  newMessagesCountElement.style.visibility = 'hidden';
  // Remove the localStorage key for new personal messages after opening the messages panel (always)
  localStorage.removeItem(NEW_MESSAGES_COUNT_KEY);

  let messages = getMessages();

  // Create a container div with class 'cached-messages-panel'
  const cachedMessagesPanel = document.createElement('div');
  cachedMessagesPanel.className = 'cached-messages-panel popup-panel';

  // Create a container div for the panel header
  const panelHeaderContainer = document.createElement('div');
  panelHeaderContainer.className = 'panel-header';

  // Create the search input container and append it to the panel header
  const messagesSearchContainer = document.createElement('div');
  messagesSearchContainer.className = 'search-for-personal-messages';

  // Create the input field for searching personal messages
  const messagesSearchInput = document.createElement('input');
  messagesSearchInput.className = 'personal-messages-search-input';
  messagesSearchInput.type = 'search';
  createCustomTooltip(messagesSearchInput, {
    en: `
      [Ctrl + Click] to clear search input and display all personal messages
      [Search by name]: name(, name2…); prefix: name (partial) or prefix:: name (exact), e.g. name: iv / name:: Ivan. Prefixes: user, username, nick, name, nickname.
      [Search by word]: word(, or(\\/|) word2…); prefix: word (partial) or prefix:: word (exact), e.g. word: priv / word:: privet. Prefixes: msg, message, text, word, content.
    `,
    ru: `
      [Ctrl + Click] чтобы очистить поиск и показать все личные сообщения
      [Поиск по имени]: имя(, имя2…); приставка: имя (неполное) или приставка:: имя (точное), напр. имя: ив / имя:: Иван. Приставки: пользователь, ник, имя, никнейм.
      [Поиск по слову]: слово(. или(\\/|) слово2…); приставка: слово (неполное) или приставка:: слово (точное), напр. слово: прив / слово:: привет. Приставки: сообщение, текст, слово, контент. 
    `
  });

  messagesSearchContainer.appendChild(messagesSearchInput);

  const panelControlButtons = document.createElement('div');
  panelControlButtons.className = 'panel-control-buttons';

  const saveMessagesButton = document.createElement('div');
  saveMessagesButton.className = 'large-button panel-header-save-button';
  saveMessagesButton.innerHTML = saveSVG;
  createCustomTooltip(saveMessagesButton, {
    en: 'Save messages',
    ru: 'Сохранить сообщения'
  });
  saveMessagesButton.style.opacity = "0";

  saveMessagesButton.addEventListener('click', () => {
    const backupData = localStorage.getItem(PERSONAL_MESSAGES_BACKUP_KEY);
    const originalData = localStorage.getItem(PERSONAL_MESSAGES_KEY);

    const bothDataExist = backupData && originalData;
    const hasDataChanged = bothDataExist && originalData !== backupData;

    if (!bothDataExist) return;

    if (hasDataChanged && !isFirstPanelRun) {
      const userConfirmed = localizedMessage({
        en: "Do you want to apply changes?",
        ru: "Вы хотите применить изменения?"
      }, 'confirm');
      if (userConfirmed) {
        localStorage.setItem(PERSONAL_MESSAGES_KEY, backupData);
        localStorage.removeItem(PERSONAL_MESSAGES_BACKUP_KEY);
        saveMessagesButton.style.setProperty('display', 'none', 'important');
        saveMessagesButton.style.opacity = '0'; // Hide the save button after saving
        // Wait for the opacity transition to finish before hiding the element
        saveMessagesButton.addEventListener('transitionend', function () {
          saveMessagesButton.style.display = 'none';
        });
      }
    }
  });

  const parseButton = document.createElement('div');
  parseButton.className = 'large-button panel-header-parse-button';
  parseButton.innerHTML = playSVG;
  createCustomTooltip(parseButton, {
    en: `[Click] to start parsing mentions`,
    ru: `[Клик] начать парсинг упоминаний`
  });

  parseButton.addEventListener('click', () => {
    const promptMsg = {
      en: 'Enter a date for parsing start (formats: yyyy-mm-dd, yyyy:mm:dd, yyyymmdd, yymmdd, yy-mm-dd, yy:mm:dd):',
      ru: 'Введите дату начала парсинга (форматы: гггг-мм-дд, гггг:мм:дд, ггггммдд, ггммдд, гг-мм-дд, гг:мм:дд):'
    };

    let normalized = null;
    while (true) {
      let input = localizedMessage(promptMsg, 'prompt', '');
      if (!input) return;
      normalized = normalizeDate(input.trim());
      if (normalized) break;
      localizedMessage({
        en: 'Invalid date format or value. Please try again.',
        ru: 'Некорректный формат или значение даты. Попробуйте еще раз.'
      }, 'alert');
    }
    // Set the lastParseDate in localStorage
    localStorage.setItem('lastParseDate', normalized);
    localizedMessage({
      en: `Start date for parsing set to: ${normalized}`,
      ru: `Дата начала парсинга установлена: ${normalized}`
    }, 'alert');
    // Start parsing mentions from the selected date up to today
    parsePersonalMessages(today);
    removePreviousPanel(true); // Remove the panel after parsing with dimming element
  });

  const importMessagesButton = document.createElement('div');
  importMessagesButton.className = "large-button panel-header-import-button";
  importMessagesButton.innerHTML = importSVG;
  createCustomTooltip(importMessagesButton, {
    en: 'Import messages',
    ru: 'Импортировать сообщения'
  });

  importMessagesButton.addEventListener('click', () => {
    isMessagesImport = true;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const importedMessages = JSON.parse(reader.result);
            const existingMessages = JSON.parse(localStorage.getItem(PERSONAL_MESSAGES_KEY) || '{}');

            const mergedMessages = { ...existingMessages, ...importedMessages };
            const cleanedMergedMessages = Object.fromEntries(
              Object.entries(mergedMessages)
                .sort(([, valueA], [, valueB]) => {
                  // Temporarily clean the time for sorting purposes (no change to original time)
                  const cleanedTimeA = valueA.time.replace(/[[\]]/g, '');
                  const cleanedTimeB = valueB.time.replace(/[[\]]/g, '');

                  // Combine date and cleaned time for comparison
                  const dateTimeA = `${valueA.date} ${cleanedTimeA}`;
                  const dateTimeB = `${valueB.date} ${cleanedTimeB}`;

                  // Convert to Date objects for sorting
                  return new Date(dateTimeA) - new Date(dateTimeB);
                })
            );

            // Store the merged messages back in localStorage (time remains unchanged with square brackets)
            localStorage.setItem(PERSONAL_MESSAGES_KEY, JSON.stringify(cleanedMergedMessages));

            updateMessageCount(); // Update the message count after import

            // Load imported messages
            const messages = getMessages();
            await loadMessages(messages);
          } catch (error) {
            localizedMessage({
              en: 'Failed to import messages. The file may be corrupted.',
              ru: 'Не удалось импортировать сообщения. Возможно, файл поврежден.'
            }, 'alert');
          }
        };
        reader.readAsText(file);
      }
    });

    input.click();
  });

  const exportMessagesButton = document.createElement('div');
  exportMessagesButton.className = "large-button panel-header-export-button";
  exportMessagesButton.innerHTML = exportSVG;
  createCustomTooltip(exportMessagesButton, {
    en: 'Export messages',
    ru: 'Экспортировать сообщения'
  });

  exportMessagesButton.addEventListener('click', () => {
    const messages = localStorage.getItem(PERSONAL_MESSAGES_KEY);
    if (messages && messages !== '{}') {
      const currentDate = new Intl.DateTimeFormat('en-CA').format(new Date());
      const messagesObject = JSON.parse(messages);
      const formattedMessages = JSON.stringify(messagesObject, null, 2);
      const blob = new Blob([formattedMessages], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Personal_Messages_${currentDate}.json`;
      link.click();
    } else {
      localizedMessage({
        en: 'No messages to export.',
        ru: 'Нет сообщений для экспорта.'
      }, 'alert');
    }
  });

  const copyPersonalMessagesButton = document.createElement('div');
  copyPersonalMessagesButton.className = "large-button panel-header-copy-button";
  copyPersonalMessagesButton.innerHTML = clipboardSVG;
  createCustomTooltip(copyPersonalMessagesButton, {
    en: `
      [Click] copy messages in BBCode, Markdown, or Plain format
      [Shift + Click] save messages in BBCode, Markdown, or Plain format
    `,
    ru: `
      [Клик] скопировать сообщения в BBCode, Markdown или Plain формате
      [Shift + Клик] сохранить сообщения в BBCode, Markdown или Plain формате
    `
  });

  // Event listener to handle copy actions
  copyPersonalMessagesButton.addEventListener('click', (event) => {
    // Prevent copy/save if there are no messages
    const messagesData = localStorage.getItem(PERSONAL_MESSAGES_KEY);
    if (!messagesData || messagesData === '{}' || Object.keys(JSON.parse(messagesData)).length === 0) {
      localizedMessage({
        en: 'No messages to copy or save.',
        ru: 'Нет сообщений для копирования или сохранения.'
      }, 'alert');
      return;
    }
    // Create a new event object to simulate the desired behavior
    const modifiedEvent = new MouseEvent('click', {
      altKey: true, // Always set altKey to true to trigger format prompt
      shiftKey: event.shiftKey, // Preserve Shift key state (true for Shift+Click, false otherwise)
      bubbles: true,
      cancelable: true
    });

    // Handle export with the modified event
    handleExportClick(modifiedEvent, messagesContainer, {
      date: today,
      isMessagesPanel: true,
      includeDateHeaders: true,
      includeMessageLinks: true,
      prefix: 'messages',
      messages
    });
    addJumpEffect(copyPersonalMessagesButton);
  });

  const clearCacheButton = document.createElement('div');
  clearCacheButton.className = "large-button panel-header-clear-button";
  createCustomTooltip(clearCacheButton, {
    en: 'Clear personal messages',
    ru: 'Очистить личные сообщения'
  });
  clearCacheButton.innerHTML = trashSVG;

  clearCacheButton.addEventListener('click', () => {
    // Set the flag to true when clear messages is initiated
    isMessagesImport = true;
    // Check if there are any messages before attempting to clear
    const messages = JSON.parse(localStorage.getItem(PERSONAL_MESSAGES_KEY) || '{}');
    if (Object.keys(messages).length === 0) {
      localizedMessage({
        en: 'No messages to delete.',
        ru: 'Нет сообщений для удаления.'
      }, 'alert');
      // Reset lastParseDate to today
      localStorage.setItem('lastParseDate', today);
      return;
    }
    // Clear the messages container
    messagesContainer.innerHTML = null;

    // Set the 'personalMessages' key in localStorage to an empty object
    localStorage.setItem(PERSONAL_MESSAGES_KEY, JSON.stringify({}));
    // Reset lastParseDate to today
    localStorage.setItem('lastParseDate', today);

    // Fade out the cached messages panel when the clear cache button is clicked
    triggerTargetElement(cachedMessagesPanel, 'hide');
    triggerDimmingElement('hide');

    // Update the message count displayed in the personal messages button
    const messagesCountElement = document.querySelector('.personal-messages-button .total-message-count');
    if (messagesCountElement) messagesCountElement.textContent = '0';
  });

  const closePanelButton = document.createElement('div');
  closePanelButton.className = "large-button panel-header-close-button";
  createCustomTooltip(closePanelButton, {
    en: 'Close panel',
    ru: 'Закрыть панель'
  });
  closePanelButton.innerHTML = closeSVG;

  closePanelButton.addEventListener('click', () => {
    triggerTargetElement(cachedMessagesPanel, 'hide');
    triggerDimmingElement('hide');
  });

  panelHeaderContainer.appendChild(messagesSearchContainer);

  panelControlButtons.append(
    saveMessagesButton,
    parseButton,
    importMessagesButton,
    exportMessagesButton,
    copyPersonalMessagesButton,
    clearCacheButton,
    closePanelButton
  )

  panelHeaderContainer.appendChild(panelControlButtons);

  cachedMessagesPanel.appendChild(panelHeaderContainer);

  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'messages-container messages-search-container';

  // Add scroll event listener to save scroll position only if mouse is over the container

  cachedMessagesPanel.appendChild(messagesContainer);

  function attachMutationObserver() {
    // Set up MutationObserver to monitor removal of child elements
    const observer = new MutationObserver(mutationsList => {
      // Skip the observer actions if messages are being imported
      if (isMessagesImport) return;

      // Check if any node was removed from the messages container
      const removedNode = mutationsList.find(mutation => mutation.type === 'childList' && mutation.removedNodes.length > 0);

      if (removedNode && saveMessagesButton.style.opacity === '0') {
        isFirstPanelRun = false;

        // Ensure button is visible and part of the layout before applying opacity
        saveMessagesButton.style.visibility = 'visible'; // Make the button interactable
        saveMessagesButton.style.display = 'flex'; // Set display to flex to reveal it
        saveMessagesButton.offsetHeight; // Ensure styles are applied before transition starts

        // Apply opacity to fade the button in
        saveMessagesButton.style.opacity = '1';
        saveMessagesButton.style.transition = 'opacity 0.5s ease';
      }
    });
    observer.observe(messagesContainer, { childList: true, subtree: true });
  }

  let lastDate = null; // Store the last processed date
  let lastUsername = null; // Store the last username processed
  let pingCheckCounter = 0; // Initialize a counter
  let maxPingChecks = 100; // Set the limit to 100

  // Create an array to store message elements for later appending
  const messageElements = [];

  // Load messages on initial panel open
  async function loadMessages(messages) {
    messagesContainer.children.length && messagesContainer.replaceChildren();

    // Use a DocumentFragment to batch DOM updates
    const fragment = document.createDocumentFragment();

    Object.entries(messages).forEach(([, { time, date, username, usernameColor, message, type, userId }]) => {
      // If the current date is different from the last processed one, create a new date-item
      if (lastDate !== date) {
        const dateItem = document.createElement('div');
        dateItem.className = 'date-item';

        // Create main date text
        const dateTextSpan = document.createElement('span');
        dateTextSpan.className = 'date-text';
        dateTextSpan.textContent = date === today ? 'Today' : date;

        // Create emoji icon separately
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'date-emoji';
        emojiSpan.textContent = date === today ? ' ⏳' : ' 📅';

        // Append both to date item
        dateItem.appendChild(dateTextSpan);
        dateItem.appendChild(emojiSpan);

        dateItem.dataset.date = date;
        fragment.appendChild(dateItem);
        lastDate = date;
      }

      const messageElement = document.createElement('div');
      messageElement.className = 'message-item';
      messageElement.dataset.type = type;

      // Use a simple key for last clicked message
      const messageKey = `${date}|${time}|${username}`;
      messageElement.setAttribute('data-message-key', messageKey);

      // Add margin-top if this is the first message of a new username group
      if (username !== lastUsername) {
        messageElement.style.marginTop = '0.6em';
        lastUsername = username;
      }

      // Remove square brackets from the time string
      const formattedTime = time.replace(/[\[\]]/g, '').trim();

      const timeElement = document.createElement('span');
      timeElement.className = 'message-time';
      timeElement.textContent = formattedTime;
      timeElement.style.color = timeColors[type] || 'slategray';

      const usernameElement = document.createElement('span');
      usernameElement.className = 'message-username';
      usernameElement.textContent = username;
      usernameElement.style.color = usernameColor;
      usernameElement.dataset.userId = userId;

      const messageTextElement = document.createElement('span');
      messageTextElement.className = 'message-text';

      // Replace smiley codes with <img> tags, and then wrap links with <a> tags
      messageTextElement.innerHTML = message
        // Replace smiley codes like :word: with <img> tags
        .replace(/:(?=\w*[a-zA-Z])(\w+):/g,
          (_, word) => `<img src="/img/smilies/${word}.gif" alt=":${word}:" title=":${word}:" class="smile">`
        )
        // Wrap http and https links with <a> tags
        .replace(/(https?:\/\/[^\s]+)/gi,
          (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        );

      // Store elements for (pingable messages) colorization after all processing
      const messageData = {
        messageTextElement,
        time,
        username,
        type
      };

      // Add messageData to the array for later processing
      messageElements.push(messageData);

      // Append time, username, and message to the message element
      messageElement.appendChild(timeElement);
      messageElement.appendChild(usernameElement);
      messageElement.appendChild(messageTextElement);

      // Append the message element to the fragment

      // Add click handler to save last clicked message
      messageElement.addEventListener('click', function (e) {
        localStorage.setItem('lastClickedMessage', messageKey);
      });

      fragment.appendChild(messageElement);
    });

    // After all elements are created, append the fragment to the container
    messagesContainer.appendChild(fragment);

    requestAnimationFrame(() => {
      // Set flag before conversions
      isConvertingContent = true;

      convertImageLinksToImage('personalMessages');
      convertVideoLinksToPlayer('personalMessages');
      processEncodedLinks('personalMessages');
      highlightMentionWords('personalMessages');

      // Reset flags and attach observer after a reasonable delay
      setTimeout(() => {
        isConvertingContent = false;
        isMessagesImport = false;
        attachMutationObserver();

        // Highlight the last clicked message if present in localStorage
        const lastClickedKey = localStorage.getItem('lastClickedMessage');
        if (lastClickedKey) {
          const lastMessage = messagesContainer.querySelector(`[data-message-key="${lastClickedKey}"]`);
          if (lastMessage) {
            lastMessage.classList.add('previous-message');
            lastMessage.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }, 500);
    });

    // Process the colorization logic in reverse order
    messageElements.reverse().forEach(async ({ messageTextElement, username, type }) => {
      let isPingableMessage = false;

      // Only check for pingable messages if we haven't exceeded the limit
      if (pingCheckCounter < maxPingChecks) {
        // Use the actual message text content for searching
        const messageText = messageTextElement.textContent;

        try {
          // Check if this message exists in general chat
          const foundMessage = await findGeneralChatMessage(messageText, username, false);
          isPingableMessage = Boolean(foundMessage);
          pingCheckCounter++;
          if (pingCheckCounter >= maxPingChecks) {
            console.log("Reached maximum ping checks limit.");
          }
        } catch (error) {
          console.error("Error checking for pingable message:", error);
          isPingableMessage = false;
        }
      }

      // Colorize the messageTextElement accordingly (Pingable messages)
      messageTextElement.style.color =
        isPingableMessage && type === 'mention' ? 'lightgreen' :
          isPingableMessage && type === 'private' ? 'lemonchiffon' :
            messageColors[type] || messageColors.default;
    });
  }

  await loadMessages(messages);

  document.body.appendChild(cachedMessagesPanel);

  // Create and append scroll buttons
  const { scrollButtonsContainer } = createScrollButtons(messagesContainer);
  cachedMessagesPanel.appendChild(scrollButtonsContainer);

  triggerTargetElement(cachedMessagesPanel, 'show');
  triggerDimmingElement('show');

  // Add click event listener to clear the search input by LMB click with Ctrl key pressed
  messagesSearchInput.addEventListener('click', (event) => {
    if (event.ctrlKey) {
      messagesSearchInput.value = '';
      messagesSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // Event listener to handle input search for matching personal messages
  // It searches through messages grouped by date and displays the corresponding date
  // Only if there are matching messages in that group.
  messagesSearchInput.addEventListener('input', () => {
    // Use the unified filterMessages for personal messages
    filterMessages(messagesSearchInput.value);
  });

  // Focus on the search input using requestAnimationFrame
  function focusOnSearchField() { requestAnimationFrame(function () { messagesSearchInput.focus(); }); } focusOnSearchField();

  panelsEvents.handlePersonalMessagesKeydown = (event) => {
    if (event.key === 'Escape') {
      triggerTargetElement(cachedMessagesPanel, 'hide');
      triggerDimmingElement('hide');
      document.removeEventListener('keydown', panelsEvents.handlePersonalMessagesKeydown);
    }
  };
  document.addEventListener('keydown', panelsEvents.handlePersonalMessagesKeydown);

  // Setup delegated tooltips and events
  setupMessagesTooltips(cachedMessagesPanel);
  setupMessagesEvents(messagesContainer, showMessagesPanel);
}
