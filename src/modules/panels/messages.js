import { convertImageLinksToImage } from "../converters/image-converter.js"; // image converter
import { convertVideoLinksToPlayer } from "../converters/video-converter.js"; // video converter

// icons
import {
  personalMessagesSVG,
  saveSVG,
  importSVG,
  exportSVG,
  clipboardSVG,
  trashSVG,
  closeSVG
} from "../icons";

// helpers && helpers definitions
import {
  // helpers
  removePreviousPanel,
  createScrollButtons,
  triggerDimmingElement,
  triggerTargetElement,
  processEncodedLinks,
  highlightMentionWords,
  scrollMessagesToMiddle,
  // helpers definitions
  isCtrlKeyPressed
} from '../helpers.js';

import { addJumpEffect, addPulseEffect } from "../animations.js"; // animations
import { showChatLogsPanel } from "./chatlogs/chatlogs.js"; // chatlogs

// definitions
import {
  today,
  state
} from '../definitions.js';

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

  // Assign a title to the button
  showPersonalMessagesButton.title = 'Show Personal Messages';

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
}

// Find chat message by time in range and matching username
async function findGeneralChatMessage(targetTime, targetUsername, allowScroll) {
  const parent = document.querySelector('.messages-content'); // Chat container
  if (!parent) return null; // Return null if the container isn't found

  // Convert time string "[HH:MM:SS]" to total seconds
  const timeStringToSeconds = (str) =>
    str.replace(/[\[\]]/g, '').split(':').reduce((acc, time, i) =>
      acc + Number(time) * (60 ** (2 - i)), 0
    );

  const initialTimeValue = timeStringToSeconds(targetTime); // Target time in seconds

  // Helper to find <p> elements by matching time and username
  const findMatchingElement = (condition) =>
    Array.from(parent.querySelectorAll('p')).find((p) => {
      const timeElement = p.querySelector('.time'); // Get the child element with class 'time'
      const usernameElement = p.querySelector('.username span[data-user]'); // Get the username element

      if (timeElement && usernameElement) {
        const currentTimeValue = timeStringToSeconds(timeElement.textContent.trim());
        const usernameText = usernameElement.textContent.trim(); // Extract the text content of the username

        // Check if the time and username match the conditions
        return condition(currentTimeValue) && usernameText === targetUsername;
      }
      return false;
    });

  // 1. Try to find an exact match first
  let foundElement = findMatchingElement(
    (currentTimeValue) => currentTimeValue === initialTimeValue
  );

  // 2. If no exact match, search within ±10 seconds
  if (!foundElement) {
    foundElement = findMatchingElement(
      (currentTimeValue) => Math.abs(currentTimeValue - initialTimeValue) <= 2
    );
  }

  if (foundElement && allowScroll) {
    await scrollMessagesToMiddle(parent, foundElement); // Call the extracted scrolling function
  }

  return foundElement || false; // Return found element or false if not found
}

// Find chat logs message by time in range and matching username
async function findChatLogsMessage(targetTime, targetUsername, allowScroll) {
  const parent = document.querySelector('.chat-logs-container'); // Logs container
  if (!parent) return null; // Return null if the container isn't found

  // Convert time string "[HH:MM:SS]" to total seconds
  const timeStringToSeconds = (str) =>
    str.replace(/[\[\]]/g, '').split(':').reduce((acc, time, i) =>
      acc + Number(time) * (60 ** (2 - i)), 0
    );

  const initialTimeValue = timeStringToSeconds(targetTime); // Target time in seconds

  // Helper to find .message-item elements by matching time and username
  const findMatchingElement = (condition) =>
    Array.from(parent.querySelectorAll('.message-item')).find((messageItem) => {
      const timeElement = messageItem.querySelector('.message-time'); // Get the child element with class 'message-time'
      const usernameElement = messageItem.querySelector('.message-username'); // Get the username element

      if (timeElement && usernameElement) {
        const currentTimeValue = timeStringToSeconds(timeElement.textContent.trim());
        const usernameText = usernameElement.textContent.trim(); // Extract the text content of the username

        // Check if the time and username match the conditions
        return condition(currentTimeValue) && usernameText === targetUsername;
      }
      return false;
    });

  // 1. Try to find an exact match first
  let foundElement = findMatchingElement(
    (currentTimeValue) => currentTimeValue === initialTimeValue
  );

  // 2. If no exact match, search within ±10 seconds
  if (!foundElement) {
    foundElement = findMatchingElement(
      (currentTimeValue) => Math.abs(currentTimeValue - initialTimeValue) <= 2
    );
  }

  if (foundElement && allowScroll) {
    await scrollMessagesToMiddle(parent, foundElement); // Call the extracted scrolling function
  }

  return foundElement || false; // Return found element or false if not found
}

/**
 * Converts a given local time to Moscow time (UTC+3) based on the system's timezone.
 *
 * How it works:
 * 1. Gets the system's local timezone offset in minutes (positive if behind UTC).
 * 2. Converts the local offset to total minutes from UTC.
 * 3. Defines Moscow's fixed offset as UTC+3 (180 minutes).
 * 4. Calculates the difference between Moscow's offset and the local offset.
 * 5. Parses the input time and converts it into total minutes since midnight.
 * 6. Adjusts the time by the calculated difference.
 * 7. Ensures the result stays within the 24-hour format (wrap-around handling).
 * 8. Converts the result back to HH:MM:SS format and returns it.
 *
 * @param {string} time - The local time in "HH:MM:SS" format.
 * @returns {string} - The converted time in Moscow time (HH:MM:SS).
 */
function calibrateToMoscowTime(time) {
  // Get local timezone offset in minutes (positive if local is behind UTC)
  const localOffsetMinutes = new Date().getTimezoneOffset();

  // Convert local offset to total minutes from UTC (local time = UTC + localTotalOffset)
  const localTotalOffset = -localOffsetMinutes;

  // Moscow is UTC+3 (180 minutes)
  const moscowOffset = 3 * 60; // 180 minutes

  // Calculate the adjustment needed: Moscow offset - local offset
  const diffMinutes = moscowOffset - localTotalOffset;

  // Parse input time
  const [hours, minutes, seconds] = time.split(':').map(Number);

  // Convert input time to total minutes since 00:00
  const totalInputMinutes = hours * 60 + minutes;

  // Adjust by diff and wrap within a single day (1440 minutes)
  let adjustedMinutes = totalInputMinutes + diffMinutes;
  adjustedMinutes = ((adjustedMinutes % 1440) + 1440) % 1440; // Ensure positive

  // Convert back to hours and minutes
  const adjustedHours = Math.floor(adjustedMinutes / 60);
  const adjustedMins = adjustedMinutes % 60;

  // Format the result with original seconds
  return `${adjustedHours.toString().padStart(2, '0')}:` +
    `${adjustedMins.toString().padStart(2, '0')}:` +
    `${seconds.toString().padStart(2, '0')}`;
}

/**
 * Removes messages from the DOM and updates localStorage based on the removal type.
 * @param {HTMLElement} messageElement - The message element to remove.
 * @param {string} removalType - The type of removal: 'single', 'all', or 'from'.
 */
function removeMessage(messageElement, removalType = 'single') {
  // Extract time and username from the message element
  const time = messageElement.querySelector('.message-time').textContent;
  const username = messageElement.querySelector('.message-username').textContent;

  // Retrieve localStorage personalMessagesBackup data
  let backupData = JSON.parse(localStorage.getItem('personalMessagesBackup')) || {};

  // If backup data does not exist, create it by copying original data from personalMessages
  if (Object.keys(backupData).length === 0) {
    const originalData = JSON.parse(localStorage.getItem('personalMessages')) || {};
    backupData = { ...originalData }; // Make a copy of the original data
    localStorage.setItem('personalMessagesBackup', JSON.stringify(backupData)); // Save backupData to localStorage
  }

  // Work with backupData (make a copy to modify)
  let modifiedBackupData = { ...backupData };

  if (removalType === 'all') {
    // Remove all messages from the same user
    document.querySelectorAll('.message-item').forEach((element) => {
      const elementUsername = element.querySelector('.message-username').textContent;
      if (elementUsername === username) {
        element.remove(); // Remove the DOM element

        // Remove the corresponding entry from backupData
        const elementTime = element.querySelector('.message-time').textContent;
        const messageKey = `[${elementTime}]_${elementUsername}`;
        delete modifiedBackupData[messageKey];
      }
    });
  } else if (removalType === 'from') {
    // Get all message elements
    const messageElements = Array.from(document.querySelectorAll('.message-item'));

    // Find the index of the current message element
    const currentIndex = messageElements.indexOf(messageElement);

    // Iterate through messages starting from the current message till the end
    for (let i = currentIndex; i < messageElements.length; i++) {
      const element = messageElements[i];
      const elementUsername = element.querySelector('.message-username').textContent;

      if (elementUsername === username) {
        // Remove the DOM element
        element.remove();

        // Remove the corresponding entry from backupData
        const elementTime = element.querySelector('.message-time').textContent;
        const messageKey = `[${elementTime}]_${elementUsername}`;
        delete modifiedBackupData[messageKey];
      }
    }
  } else {
    // Default: Remove only the specific message (single)
    const messageKey = `[${time}]_${username}`;
    if (modifiedBackupData[messageKey]) {
      delete modifiedBackupData[messageKey]; // Remove from backupData
      messageElement.remove(); // Remove the DOM element
    }
  }

  // Update localStorage with the modified backupData
  localStorage.setItem('personalMessagesBackup', JSON.stringify(modifiedBackupData));

  // Update the total message count displayed in the personal messages button
  const messagesCountElement = document.querySelector('.personal-messages-button .total-message-count');
  if (messagesCountElement) {
    messagesCountElement.textContent = Object.keys(modifiedBackupData).length;
  }
}

// Update the message count displayed in the personal messages button
function updateMessageCount() {
  const personalMessagesCount = Object.keys(JSON.parse(localStorage.getItem('personalMessages') || '{}')).length;
  const messagesCountElement = document.querySelector('.personal-messages-button .total-message-count');
  messagesCountElement.textContent = personalMessagesCount;
}

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

  // Function to get messages from localStorage
  function getMessages() {
    const cachedMessagesData = localStorage.getItem('personalMessages');
    // Initialize messages by parsing fetched data or setting as empty object
    return JSON.parse(cachedMessagesData) || {};
  }

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

  // Append the search input to the search container
  messagesSearchContainer.appendChild(messagesSearchInput);

  // Create a container div with class 'panel-control-buttons'
  const panelControlButtons = document.createElement('div');
  panelControlButtons.className = 'panel-control-buttons';

  // Create a save button with the provided SVG icon
  const saveMessagesButton = document.createElement('div');
  saveMessagesButton.className = 'large-button panel-header-save-button';
  saveMessagesButton.innerHTML = saveSVG;
  saveMessagesButton.title = 'Save messages';
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
  importMessagesButton.title = 'Import messages';

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
  exportMessagesButton.title = 'Export messages';

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
  // Set the inner HTML of the copy personal messages button element with the clipboard SVG
  copyPersonalMessagesButton.innerHTML = clipboardSVG;
  copyPersonalMessagesButton.title = 'Copy Personal Messages';

  // Event listener to copy the text content of the messages container
  copyPersonalMessagesButton.addEventListener('click', () => {
    const textContent = Array.from(document.querySelector('.messages-container').children)
      .filter(node => {
        const style = window.getComputedStyle(node);
        // Ignore hidden messages with contentVisibility 'hidden' or display 'none'
        return style.contentVisibility !== 'hidden' && style.display !== 'none';
      })
      .map(node => node.classList.contains('date-item') ? node.textContent.trim() :
        [node.querySelector('.message-time'), node.querySelector('.message-username'), node.querySelector('.message-text')]
          .map(el => el?.textContent.trim()).filter(Boolean).join(' '))
      .filter(Boolean).join(' \n');

    // Check if there's content to copy
    if (textContent.trim()) {
      // Only add the jump effect if there is content to copy
      addJumpEffect(copyPersonalMessagesButton, 0, 0);
      navigator.clipboard.writeText(textContent)
        .catch(console.error);
    } else {
      alert('No messages to copy.');
    }
  });

  // Create a clear cache button with the provided SVG icon
  const clearCacheButton = document.createElement('div');
  clearCacheButton.className = "large-button panel-header-clear-button";
  clearCacheButton.title = 'Clear personal messages';
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
  closePanelButton.title = 'Close panel';
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

  let lastUsername = null; // Store the last username processed
  let pingCheckCounter = 0; // Initialize a counter
  let maxPingChecks = 100; // Set the limit to 100
  let pingMessages = false; // Initialize pingMessages as false
  let lastDate = null; // Store the last processed date

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
        // show "Today" if date matches
        dateItem.textContent = date === today ? 'Today ⏳' : `${date} 📅`;
        dateItem.dataset.date = date; // Store the date in a data attribute
        messagesContainer.appendChild(dateItem); // Append the date-item to the container
        lastDate = date; // Update the last processed date
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
      timeElement.title = `Moscow Time: ${calibrateToMoscowTime(formattedTime)}`;
      timeElement.style.color = timeColors[type] || 'slategray';

      // Add click event listener for "mention" and "private" types
      if (type === 'mention' || type === 'private') {
        const hoverColor = type === 'mention' ? 'lightgreen' : 'peachpuff';
        timeElement.addEventListener('mouseover', () => { timeElement.style.color = hoverColor; });
        timeElement.addEventListener('mouseout', () => { timeElement.style.color = timeColors[type]; });
        timeElement.addEventListener('click', (event) => {
          if (event.ctrlKey) {
            removeMessage(messageElement, 'from');
            return; // Exit the function to prevent opening the chatlog
          }
          if (type === 'mention') {
            const url = `https://klavogonki.ru/chatlogs/${date}.html#${calibrateToMoscowTime(formattedTime)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        });
      }

      const usernameElement = document.createElement('span');
      usernameElement.className = 'message-username';
      usernameElement.textContent = username;
      usernameElement.style.color = usernameColor;

      // Add click event only if userId is defined
      usernameElement.addEventListener('click', (event) => {
        // Remove all messages on Ctrl + LMB click for the same username
        if (event.ctrlKey) {
          removeMessage(messageElement, 'all');
          return;
        }
        if (userId) { // Check if userId is defined
          const url = `https://klavogonki.ru/u/#/${userId}/`; // Construct the user profile URL
          window.open(url, '_blank', 'noopener,noreferrer'); // Open in a new tab
        } else {
          addShakeEffect(usernameElement); // Call the shake effect if userId is not defined
        }
      });

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

      // Add click event listener for the messageTextElement
      messageTextElement.addEventListener('click', async function (event) {
        // Remove single message on Ctrl + LMB click for the same username
        if (event.ctrlKey) {
          removeMessage(messageElement, 'single');
          return;
        }

        // Call the findGeneralChatMessage function to search for the general chat message by time in range and username
        const foundGeneralChatMessage = await findGeneralChatMessage(time, username, true);
        if (foundGeneralChatMessage) {
          triggerTargetElement(cachedMessagesPanel, 'hide');
          triggerDimmingElement('hide');
        } else {
          let previousElement = messageTextElement.parentElement.previousElementSibling;
          while (previousElement && !previousElement.classList.contains('date-item')) {
            previousElement = previousElement.previousElementSibling;
          }
          if (previousElement) {
            await showChatLogsPanel(previousElement.dataset.date);
            const calibratedMoscowTime = calibrateToMoscowTime(formattedTime);
            // Call the findChatLogsMessage function to search for the chat logs message by time in range and username
            requestAnimationFrame(async () => {
              setTimeout(async () => {
                // find chat messge if not found close the panel
                const foundChatLogsMessage = await findChatLogsMessage(calibratedMoscowTime, username, true);
                if (!foundChatLogsMessage) {
                  const chatLogsPanel = document.querySelector('.chat-logs-panel'); // Get the chat logs panel
                  triggerTargetElement(chatLogsPanel, 'hide'); // Hide the chat logs panel
                  showMessagesPanel(); // Show the personal messages panel again
                }
              }, 500); // Adjust the delay as needed
            });
          }
        }
      });

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
    messageElements.reverse().forEach(async ({ messageTextElement, time, username, type }) => {
      if (pingCheckCounter < maxPingChecks) {
        pingMessages = await findGeneralChatMessage(time, username, false);
        pingCheckCounter++; // Increment the counter

        if (pingCheckCounter >= maxPingChecks) {
          pingMessages = false;
          console.log("Reached maximum ping checks, resetting pingMessages.");
        }
      }

      // Colorize the messageTextElement accordingly (Pingable messages)
      messageTextElement.style.color =
        pingMessages && type === 'mention' ? 'lightgreen' :
          pingMessages && type === 'private' ? 'lemonchiffon' :
            messageColors[type] || 'slategray';
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
  messagesSearchInput.addEventListener('click', () => isCtrlKeyPressed && (messagesSearchInput.value = ''));

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
        const match = (nextEl.querySelector('.message-time')?.textContent.toLowerCase().replace(/_/g, ' ') + ' ' +
          nextEl.querySelector('.message-username')?.textContent.toLowerCase().replace(/_/g, ' ') + ' ' +
          nextEl.querySelector('.message-text')?.textContent.toLowerCase().replace(/_/g, ' ')).includes(query);

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
}


