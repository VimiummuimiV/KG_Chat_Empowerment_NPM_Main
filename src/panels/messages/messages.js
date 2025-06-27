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
  closeSVG
} from "../../icons.js";

// helpers && helpers definitions
import {
  // helpers
  removePreviousPanel,
  copyChatlogsUrlToClipboard,
  getMessageTextWithImgTitles
} from '../../helpers/helpers.js';

import {
  findChatLogsMessage,
  findGeneralChatMessage,
  calibrateToMoscowTime,
  removeMessage,
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
import { showChatLogsPanel } from "../chatlogs/chatlogs.js";
import { createCustomTooltip } from "../../components/tooltip.js";
import { createScrollButtons } from "../../helpers/scrollButtons.js";
import { highlightMentionWords } from "../../helpers/getLatestMessageData.js";

// definitions
import {
  today,
  state
} from '../../definitions.js';

// Define dynamic variables
let {
  panelsEvents
} = state;

// Function to create the button for opening personal messages
export function createMessagesButton(panel) {
  // Create a new element with class 'personal-messages-button'
  const showPersonalMessagesButton = document.createElement('div');
  showPersonalMessagesButton.classList.add("empowerment-button", "personal-messages-button");
  showPersonalMessagesButton.innerHTML = personalMessagesSVG; // Add icon

  // Create the small indicator for all message count
  const allMessageIndicator = document.createElement('div');
  allMessageIndicator.classList.add("message-count", "total-message-count");
  const personalMessages = JSON.parse(localStorage.getItem('personalMessages')) || {};
  allMessageIndicator.textContent = Object.keys(personalMessages).length;
  showPersonalMessagesButton.appendChild(allMessageIndicator);

  // Create the small indicator for new message count
  const newMessageIndicator = document.createElement('div');
  newMessageIndicator.classList.add("message-count", "new-message-count");

  // Get the new messages count from localStorage or set to 0 if not present
  let newMessagesCount = Number(localStorage.getItem('newMessagesCount')) || (localStorage.setItem('newMessagesCount', '0'), 0);

  newMessageIndicator.textContent = newMessagesCount;

  // Check the newMessagesCount value and set visibility
  newMessageIndicator.style.visibility = newMessagesCount > 0 ? 'visible' : 'hidden'; // Set visibility based on count

  showPersonalMessagesButton.appendChild(newMessageIndicator);

  createCustomTooltip(showPersonalMessagesButton, {
    en: 'Open Messages',
    ru: 'Открыть сообщения'
  });

  // Add a click event listener to the button
  showPersonalMessagesButton.addEventListener('click', function () {
    addPulseEffect(showPersonalMessagesButton); // Add pulse effect
    showMessagesPanel(); // Show the personal messages panel
    const personalMessagesCount = Object.keys(JSON.parse(localStorage.getItem('personalMessages')) || {}).length;
    // Open the personal messages panel only when there are messages present.
    if (personalMessagesCount > 0) {
      // Reset newMessagesCount in localStorage to 0 when opening the panel
      localStorage.setItem('newMessagesCount', '0');
      newMessagesCount = 0; // Reset the local variable
      newMessageIndicator.textContent = newMessagesCount; // Update the displayed count
    }
  });

  // Append the button to the existing panel
  panel.appendChild(showPersonalMessagesButton);
} // createMessagesButton END

// Function to display the personal messages panel
async function showMessagesPanel() {
  // Check if the panel already exists
  const existingPanel = document.querySelector('.cached-messages-panel');
  if (existingPanel) {
    existingPanel.remove(); // Remove the settings panel
    triggerDimmingElement('hide');
    return; // Return immediately to prevent further execution
  }

  // Flag to track if this is the first time the panel is being run
  let isFirstPanelRun = true;
  // Flag to track if messages are being imported
  let isMessagesImport = false;
  // Update the message count after panel load to reset the value if messages were not saved
  updateMessageCount();
  // Remove 'personalMessagesBackup' from localStorage if it exists
  if (localStorage.getItem('personalMessagesBackup')) localStorage.removeItem('personalMessagesBackup');
  // Remove any previous panel before creating a new one
  removePreviousPanel();

  // Reset the new messages indicator to 0
  const newMessagesCountElement = document.querySelector('.personal-messages-button .new-message-count');
  if (newMessagesCountElement) newMessagesCountElement.textContent = '0';
  newMessagesCountElement.style.visibility = 'hidden';
  // Remove the localStorage key for new personal messages after opening the messages panel (always)
  localStorage.removeItem('newMessagesCount');

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
    en: '[Ctrl + Click] to clear search input and display all personal messages',
    ru: '[Ctrl + Click] чтобы очистить поиск и показать все личные сообщения'
  });

  // Append the search input to the search container
  messagesSearchContainer.appendChild(messagesSearchInput);

  // Create a container div with class 'panel-control-buttons'
  const panelControlButtons = document.createElement('div');
  panelControlButtons.className = 'panel-control-buttons';

  // Create a save button with the provided SVG icon
  const saveMessagesButton = document.createElement('div');
  saveMessagesButton.className = 'large-button panel-header-save-button';
  saveMessagesButton.innerHTML = saveSVG;
  createCustomTooltip(saveMessagesButton, {
    en: 'Save messages',
    ru: 'Сохранить сообщения'
  });
  saveMessagesButton.style.opacity = "0";

  // Handle the save button click to restore the backup
  saveMessagesButton.addEventListener('click', () => {
    // Retrieve the backup and original data from localStorage
    const backupData = localStorage.getItem('personalMessagesBackup');
    const originalData = localStorage.getItem('personalMessages');

    // Check if both backup and original data exist and if they are different
    const bothDataExist = backupData && originalData;
    const hasDataChanged = bothDataExist && originalData !== backupData;

    // If no backup or original data exists, do nothing
    if (!bothDataExist) return;

    // Ask user for confirmation if data has changed and it's not the first run
    if (hasDataChanged && !isFirstPanelRun) {
      const userConfirmed = window.confirm("Do you want to apply changes?");

      // If user confirms, restore the backup data
      if (userConfirmed) {
        localStorage.setItem('personalMessages', backupData);
        localStorage.removeItem('personalMessagesBackup');
        saveMessagesButton.style.setProperty('display', 'none', 'important');
        saveMessagesButton.style.opacity = '0'; // Hide the save button after saving
        // Wait for the opacity transition to finish before hiding the element
        saveMessagesButton.addEventListener('transitionend', function () {
          // After the transition, hide the button by setting display to 'none'
          saveMessagesButton.style.display = 'none'; // Now you can safely hide the element
        });
      }
    }
  });

  // Create an import button for messages with the provided SVG icon
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
            const existingMessages = JSON.parse(localStorage.getItem('personalMessages') || '{}');

            // Merge existing and imported messages, ensuring no duplicates by date key
            const mergedMessages = {
              ...existingMessages,
              ...importedMessages
            };

            // Sort the merged messages with cleaned time for sorting but without modifying the original time
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
            localStorage.setItem('personalMessages', JSON.stringify(cleanedMergedMessages));

            updateMessageCount(); // Update the message count after import

            // Load imported messages
            const messages = getMessages();
            await loadMessages(messages);
          } catch (error) {
            alert('Failed to import messages. The file may be corrupted.');
          }
        };
        reader.readAsText(file);
      }
    });

    input.click();
  });

  // Create an export button for messages with the provided SVG icon
  const exportMessagesButton = document.createElement('div');
  exportMessagesButton.className = "large-button panel-header-export-button";
  exportMessagesButton.innerHTML = exportSVG;
  createCustomTooltip(exportMessagesButton, {
    en: 'Export messages',
    ru: 'Экспортировать сообщения'
  });

  // Add event listener for exporting messages
  exportMessagesButton.addEventListener('click', () => {
    const messages = localStorage.getItem('personalMessages');
    if (messages && messages !== '{}') {
      const currentDate = new Intl.DateTimeFormat('en-CA').format(new Date()); // Get the current date in YYYY-MM-DD format

      // Parse the JSON string to an object for formatting
      const messagesObject = JSON.parse(messages);

      // Convert the object back to a formatted JSON string with indentation
      const formattedMessages = JSON.stringify(messagesObject, null, 2); // Indented JSON

      const blob = new Blob([formattedMessages], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Personal_Messages_${currentDate}.json`; // Use currentDate for file name
      link.click();
    } else {
      alert('No messages to export.');
    }
  });

  // Create a copy personal messages button element
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
      hueStep: 15,
      prefix: 'messages',
      messages
    });

    addJumpEffect(copyPersonalMessagesButton); // Add jump effect on click
  });

  // Create a clear cache button with the provided SVG icon
  const clearCacheButton = document.createElement('div');
  clearCacheButton.className = "large-button panel-header-clear-button";
  createCustomTooltip(clearCacheButton, {
    en: 'Clear personal messages',
    ru: 'Очистить личные сообщения'
  });
  clearCacheButton.innerHTML = trashSVG;

  // Add a click event listener to the clear cache button
  clearCacheButton.addEventListener('click', () => {
    // Set the flag to true when clear messages is initiated
    isMessagesImport = true;
    // Check if there are any messages before attempting to clear
    const messages = JSON.parse(localStorage.getItem('personalMessages') || '{}');
    if (Object.keys(messages).length === 0) {
      alert('No messages to delete.');
      return; // Exit the function if no messages exist
    }
    // Clear the messages container
    messagesContainer.innerHTML = null;

    // Set the 'personalMessages' key in localStorage to an empty object
    localStorage.setItem('personalMessages', JSON.stringify({}));

    // Fade out the cached messages panel when the clear cache button is clicked
    triggerTargetElement(cachedMessagesPanel, 'hide');
    triggerDimmingElement('hide');

    // Update the message count displayed in the personal messages button
    const messagesCountElement = document.querySelector('.personal-messages-button .total-message-count');
    if (messagesCountElement) messagesCountElement.textContent = '0';
  });

  // Create a close button with the provided SVG icon
  const closePanelButton = document.createElement('div');
  closePanelButton.className = "large-button panel-header-close-button";
  createCustomTooltip(closePanelButton, {
    en: 'Close panel',
    ru: 'Закрыть панель'
  });
  closePanelButton.innerHTML = closeSVG;

  // Add a click event listener to the close panel button
  closePanelButton.addEventListener('click', () => {
    // Fade out the cached messages panel when the close button is clicked
    triggerTargetElement(cachedMessagesPanel, 'hide');
    triggerDimmingElement('hide');
  });

  // Append the search container to the panel header container
  panelHeaderContainer.appendChild(messagesSearchContainer);

  // Append buttons to the panel header container
  panelControlButtons.appendChild(saveMessagesButton);
  panelControlButtons.appendChild(importMessagesButton);
  panelControlButtons.appendChild(exportMessagesButton);
  panelControlButtons.appendChild(copyPersonalMessagesButton);
  panelControlButtons.appendChild(clearCacheButton);
  panelControlButtons.appendChild(closePanelButton);

  // Append the panel control buttons element inside the panel header container
  panelHeaderContainer.appendChild(panelControlButtons);

  // Append the header to the cached messages panel
  cachedMessagesPanel.appendChild(panelHeaderContainer);

  // Create a container for the messages
  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'messages-container';

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
        saveMessagesButton.style.transition = 'opacity 0.5s ease'; // Apply smooth fade-in transition
      }
    });

    // Configure the observer to watch for child node removals
    observer.observe(messagesContainer, {
      childList: true, // Watch for changes to the children
      subtree: true // Also monitor all descendants of the messagesContainer
    });
  }

  let lastDate = null; // Store the last processed date
  let lastUsername = null; // Store the last username processed
  let pingCheckCounter = 0; // Initialize a counter
  let maxPingChecks = 100; // Set the limit to 100

  // Create an array to store message elements for later appending
  const messageElements = [];

  // Define messageColors and timeColors inside the loop
  const timeColors = {
    private: 'coral',
    mention: 'darkseagreen'
  };

  const messageColors = {
    private: 'coral',
    mention: 'lightsteelblue',
    default: 'slategray' // Default color if type is not private or mention
  };

  // Load messages on initial panel open
  async function loadMessages(messages) {
    messagesContainer.children.length && messagesContainer.replaceChildren();

    // Loop through the messages and create elements
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
        messagesContainer.appendChild(dateItem);
        lastDate = date;
      }

      // Create a message-item for the current message
      const messageElement = document.createElement('div');
      messageElement.className = 'message-item';

      // Add margin-top if this is the first message of a new username group
      if (username !== lastUsername) {
        messageElement.style.marginTop = '0.6em';
        lastUsername = username; // Update the lastUsername
      }

      // Remove square brackets from the time string
      const formattedTime = time.replace(/[\[\]]/g, '').trim();

      // Create time, username, and message elements
      const timeElement = document.createElement('span');
      timeElement.className = 'message-time';
      timeElement.textContent = formattedTime;
      timeElement.style.color = timeColors[type] || 'slategray';

      const usernameElement = document.createElement('span');
      usernameElement.className = 'message-username';
      usernameElement.textContent = username;
      usernameElement.style.color = usernameColor;

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

      // Append the message element to the messages container
      messagesContainer.appendChild(messageElement);
    });

    requestAnimationFrame(() => {
      convertImageLinksToImage('personalMessages');
      convertVideoLinksToPlayer('personalMessages');
      processEncodedLinks('personalMessages'); // Decodes links within the personal messages section.
      highlightMentionWords('personalMessages');
      messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll after next repaint
      attachMutationObserver();
      setTimeout(() => { isMessagesImport = false; }, 500);
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
          isPingableMessage = Boolean(foundMessage); // Convert to boolean

          pingCheckCounter++; // Increment the counter

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

  // Assuming this code is within an async function
  await loadMessages(messages);

  // Append the messages container to the cached messages panel
  cachedMessagesPanel.appendChild(messagesContainer);

  // Append the cached messages panel to the body
  document.body.appendChild(cachedMessagesPanel);

  // Create and append scroll buttons
  const { scrollButtonsContainer } = createScrollButtons(messagesContainer);
  cachedMessagesPanel.appendChild(scrollButtonsContainer);

  // Fade in the cached messages panel
  triggerTargetElement(cachedMessagesPanel, 'show');
  // Show the dimming background
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
    const query = messagesSearchInput.value.toLowerCase().replace(/_/g, ' ');

    messagesContainer.querySelectorAll('.date-item').forEach(dateEl => {
      let showDateForGroup = false;
      let nextEl = dateEl.nextElementSibling;

      // Iterate through messages in the current group (until the next date item)
      while (nextEl && !nextEl.classList.contains('date-item')) {
        const time = nextEl.querySelector('.message-time')?.textContent.toLowerCase().replace(/_/g, ' ') || '';
        const username = nextEl.querySelector('.message-username')?.textContent.toLowerCase().replace(/_/g, ' ') || '';
        const messageTextElement = nextEl.querySelector('.message-text');
        const message = messageTextElement ? getMessageTextWithImgTitles(messageTextElement).toLowerCase().replace(/_/g, ' ') : '';
        const match = (time + ' ' + username + ' ' + message).includes(query);

        // Toggle visibility based on match using content visibility and font size
        nextEl.style.contentVisibility = match ? 'visible' : 'hidden';
        // Set font size to 0 for hidden messages to maintain layout or remove the font size property
        nextEl.style.fontSize = match ? '' : '0';

        showDateForGroup = showDateForGroup || match; // Show date if any match found in the group

        nextEl = nextEl.nextElementSibling;
      }

      dateEl.style.display = showDateForGroup ? '' : 'none'; // Show or hide the date based on the match results in the group
    });
  });

  // Focus on the search input using requestAnimationFrame
  function focusOnSearchField() { requestAnimationFrame(function () { messagesSearchInput.focus(); }); } focusOnSearchField();

  // Define the event handler function for personal messages panel
  panelsEvents.handlePersonalMessagesKeydown = (event) => { // Assign the function to the object
    if (event.key === 'Escape') {
      triggerTargetElement(cachedMessagesPanel, 'hide');
      triggerDimmingElement('hide');
      document.removeEventListener('keydown', panelsEvents.handlePersonalMessagesKeydown); // Remove the event listener
    }
  };

  // Attach the event listener
  document.addEventListener('keydown', panelsEvents.handlePersonalMessagesKeydown);

  // Create custom tooltips for various message elements (time, username, text)
  createCustomTooltip('.message-time', cachedMessagesPanel, (el) => ({
    en: `
      [Click] Open chatlog at ${calibrateToMoscowTime(el.textContent)}
      [Shift + Click] Copy chatlogs URL to clipboard
      [Ctrl + Click] Remove all messages starting from ${calibrateToMoscowTime(el.textContent)}
    `,
    ru: `
      [Клик] Открыть чатлог в ${calibrateToMoscowTime(el.textContent)}
      [Shift + Клик] Скопировать ссылку на чатлог
      [Ctrl + Клик] Удалить все сообщения начиная с ${calibrateToMoscowTime(el.textContent)}
    `
  }), true);

  createCustomTooltip('.message-username', cachedMessagesPanel, (el) => ({
    en: `
      [Click] Open ${el.textContent} profile
      [Ctrl + Click] Remove all messages from ${el.textContent} user
    `,
    ru: `
      [Клик] Открыть профиль ${el.textContent}
      [Ctrl + Клик] Удалить все сообщения пользователя ${el.textContent}
    `
  }), true);

  createCustomTooltip('.message-text', cachedMessagesPanel, (el) => ({
    en: `
      [Click] Search for this message
      [Ctrl + Click] Remove only this message
    `,
    ru: `
      [Клик] Найти это сообщение
      [Ctrl + Клик] Удалить только это сообщение
    `
  }), true);

  // Delegated events for hover and click on message-time, message-username, message-text
  messagesContainer.addEventListener('mouseover', function (event) {
    const timeEl = event.target.closest('.message-time');
    if (timeEl && messagesContainer.contains(timeEl)) {
      const messageItem = timeEl.closest('.message-item');
      if (!messageItem) return;
      const username = messageItem.querySelector('.message-username')?.textContent;
      const type = Object.values(messages).find(m => m.username === username && m.time.replace(/[\[\]]/g, '').trim() === timeEl.textContent.trim())?.type;
      if (type === 'mention' || type === 'private') {
        timeEl.style.color = type === 'mention' ? 'lightgreen' : 'peachpuff';
      }
    }
  });
  messagesContainer.addEventListener('mouseout', function (event) {
    const timeEl = event.target.closest('.message-time');
    if (timeEl && messagesContainer.contains(timeEl)) {
      const messageItem = timeEl.closest('.message-item');
      if (!messageItem) return;
      const username = messageItem.querySelector('.message-username')?.textContent;
      const type = Object.values(messages).find(m => m.username === username && m.time.replace(/[\[\]]/g, '').trim() === timeEl.textContent.trim())?.type;
      if (type === 'mention' || type === 'private') {
        timeEl.style.color = timeColors[type] || 'slategray';
      }
    }
  });
  messagesContainer.addEventListener('click', async function (event) {
    const timeEl = event.target.closest('.message-time');
    const usernameEl = event.target.closest('.message-username');
    const messageTextEl = event.target.closest('.message-text');
    const messageItem = event.target.closest('.message-item');
    if (!messageItem) return;
    // Time element click
    if (timeEl && messageItem.contains(timeEl)) {
      const username = messageItem.querySelector('.message-username')?.textContent;
      const type = Object.values(messages).find(m => m.username === username && m.time.replace(/\[|\]/g, '').trim() === timeEl.textContent.trim())?.type;
      // Find the closest previous .date-item
      let date;
      let prev = messageItem.previousElementSibling;
      while (prev && !prev.classList.contains('date-item')) {
        prev = prev.previousElementSibling;
      }
      if (prev) date = prev.dataset.date;
      if (type === 'mention' || type === 'private') {
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          copyChatlogsUrlToClipboard(date, calibrateToMoscowTime(timeEl.textContent), timeEl);
          return;
        }
        if (event.ctrlKey) {
          removeMessage(messageItem, 'from');
          return;
        }
        if (type === 'mention') {
          const url = `https://klavogonki.ru/chatlogs/${date}.html#${calibrateToMoscowTime(timeEl.textContent)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }
    }
    // Username element click
    if (usernameEl && messageItem.contains(usernameEl)) {
      if (event.ctrlKey) {
        removeMessage(messageItem, 'all');
        return;
      }
      const userId = Object.values(messages).find(m => m.username === usernameEl.textContent)?.userId;
      if (userId) {
        const url = `https://klavogonki.ru/u/#/${userId}/`;
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        addShakeEffect(usernameEl);
      }
    }
    // Message text click
    if (messageTextEl && messageItem.contains(messageTextEl)) {
      if (event.ctrlKey) {
        removeMessage(messageItem, 'single');
        return;
      }
      const username = messageItem.querySelector('.message-username')?.textContent;
      const time = messageItem.querySelector('.message-time')?.textContent;

      // Find the specific message by matching both username and time
      const specificMessage = Object.values(messages).find(m =>
        m.username === username &&
        m.time.replace(/[\[\]]/g, '').trim() === time.trim()
      );
      const type = specificMessage?.type;

      if (type === 'private') {
        requestAnimationFrame(() => {
          findGeneralChatMessage(
            messageTextEl.textContent, // message text
            username, // username
            true // allowScroll
          );
        });
        return;
      }
      const foundGeneralChatMessage = await findGeneralChatMessage(messageTextEl.textContent, username, true);
      if (foundGeneralChatMessage) {
        triggerTargetElement(cachedMessagesPanel, 'hide');
        triggerDimmingElement('hide');
      } else {
        let previousElement = messageTextEl.parentElement.previousElementSibling;
        while (previousElement && !previousElement.classList.contains('date-item')) {
          previousElement = previousElement.previousElementSibling;
        }
        if (previousElement) {
          await showChatLogsPanel(previousElement.dataset.date);
          const messageTextForSearch = messageTextEl.textContent;
          requestAnimationFrame(() => {
            let tries = 0;
            const maxTries = 10;
            const interval = setInterval(async () => {
              const foundChatLogsMessage = await findChatLogsMessage(messageTextForSearch, username, true);
              if (foundChatLogsMessage) {
                clearInterval(interval);
              } else if (++tries >= maxTries) {
                clearInterval(interval);
                const chatLogsPanel = document.querySelector('.chat-logs-panel');
                triggerTargetElement(chatLogsPanel, 'hide');
                showMessagesPanel();
              }
            }, 200);
          });
        }
      }
    }
  });
} // showMessagesPanel END
