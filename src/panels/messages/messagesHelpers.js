import { scrollToMiddle } from "../../helpers/scrollTo.js";

// Extracts the text content from a <p> element, excluding .time and .username elements
export function extractMessageText(pElem) {
  // Clone the element to safely remove unwanted nodes
  const clone = pElem.cloneNode(true);
  // Remove .time, .username, and .room.private elements
  clone.querySelectorAll('.time, .username, .room.private').forEach(el => el.remove());
  // Now get all text, including .private
  return clone.textContent.trim();
}

// Find chat message by username and message text (backup)
export async function findGeneralChatMessage(targetMessageText, targetUsername, allowScroll) {
  const parent = document.querySelector('.messages-content'); // Chat container
  if (!parent) return null;

  // Normalize function for comparison
  const normalize = str => String(str || '').replace(/\s+/g, '').trim().toLowerCase();
  const normalizedTargetUsername = normalize(targetUsername);
  const normalizedTargetText = normalize(targetMessageText);

  // Helper to find <p> elements by matching username and exact message text
  const findMatchingElement = () =>
    Array.from(parent.querySelectorAll('p')).find((p) => {
      const usernameElement = p.querySelector('.username span[data-user]');
      if (usernameElement) {
        const usernameText = normalize(usernameElement.textContent);
        const messageText = normalize(extractMessageText(p));
        // Match by normalized username and message
        if (usernameText === normalizedTargetUsername && messageText === normalizedTargetText) {
          return true;
        }
      }
      return false;
    });

  const foundElement = findMatchingElement();

  if (foundElement && allowScroll) {
    await scrollToMiddle(parent, foundElement);
  }

  return foundElement || false;
}

// Find chat logs message by message text and matching username
export async function findChatLogsMessage(targetMessageText, targetUsername, allowScroll) {
  const parent = document.querySelector('.chat-logs-container'); // Logs container
  if (!parent) return null; // Return null if the container isn't found

  // Normalize function for comparison
  const normalize = str => String(str || '').replace(/\s+/g, '').trim().toLowerCase();
  const normalizedTargetUsername = normalize(targetUsername);
  const normalizedTargetText = normalize(targetMessageText);

  // Helper to find .message-item elements by matching username and exact message text
  const findMatchingElement = () =>
    Array.from(parent.querySelectorAll('.message-item')).find((messageItem) => {
      const usernameElement = messageItem.querySelector('.message-username');
      const messageTextElement = messageItem.querySelector('.message-text');
      if (usernameElement && messageTextElement) {
        const usernameText = normalize(usernameElement.textContent);
        const messageText = normalize(messageTextElement.textContent);

        if (usernameText === normalizedTargetUsername && messageText === normalizedTargetText) {
          return true;
        }
      }
      return false;
    });

  const foundElement = findMatchingElement();

  if (foundElement && allowScroll) {
    await scrollToMiddle(parent, foundElement);
  }

  return foundElement || false;
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
export function calibrateToMoscowTime(time) {
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
export function removeMessage(messageElement, removalType = 'single') {
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
      delete modifiedBackupData[messageKey];
      // Remove the message and its date header if it's the last for that date
      let dateHeader = messageElement.previousElementSibling;
      while (dateHeader && !dateHeader.classList.contains('date-item')) dateHeader = dateHeader.previousElementSibling;
      messageElement.remove();
      if (dateHeader && dateHeader.classList.contains('date-item') &&
        (!dateHeader.nextElementSibling || dateHeader.nextElementSibling.classList.contains('date-item'))) {
        dateHeader.remove();
      }
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
export function updateMessageCount() {
  const personalMessagesCount = Object.keys(JSON.parse(localStorage.getItem('personalMessages') || '{}')).length;
  const messagesCountElement = document.querySelector('.personal-messages-button .total-message-count');
  messagesCountElement.textContent = personalMessagesCount;
}

// Function to get messages from localStorage
export function getMessages() {
  const cachedMessagesData = localStorage.getItem('personalMessages');
  // Initialize messages by parsing fetched data or setting as empty object
  return JSON.parse(cachedMessagesData) || {};
}