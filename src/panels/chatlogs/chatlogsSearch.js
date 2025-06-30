import { getFullMessageContent } from "../../helpers/helpers.js";

// Helper function to normalize for username search: remove _ and - and spaces entirely, lowercase
function normalizeUsername(text) {
  return text.replace(/[_\-\s]/g, '').toLowerCase();
}
// Helper function to normalize for word search: replace _ and - with space, lowercase
function normalizeText(text) {
  return text.replace(/[_-]/g, ' ').toLowerCase();
}

/**
 * Retrieves details from message items including usernames and message text.
 * @param {Element[]} messageItems - Array of message item DOM elements
 * @returns {Array<{username: string, messageText: string}>}
 */
export function getMessageDetails(messageItems) {
  return messageItems.map(item => {
    const usernameElement = item.querySelector('.message-username');
    const username = usernameElement ? usernameElement.textContent.toLowerCase().trim() : '';
    const messageTextElement = item.querySelector('.message-text');
    const messageText = messageTextElement ? getFullMessageContent(messageTextElement).toLowerCase().trim() : '';
    return { username, messageText };
  });
}

/**
 * Filters message items based on the provided query and displays matching messages.
 * @param {string} query - The search query
 */
export function filterMessages(query) {
  // If the query contains only digits, hyphens, or colons, do nothing
  if (/^[\d-:]+$/.test(query.trim())) return;

  // Normalize query for username search (removes _ and - and spaces entirely)
  const queryNormalizedForUser = normalizeUsername(query).trim();
  // Normalize query for word search (replaces _ and - with space)
  const queryNormalizedForWord = normalizeText(query).trim();

  // Retrieve message and date items within the filterItems function
  const allElements = Array.from(
    document.querySelectorAll(
      '.chat-logs-container > .date-item, ' +
      '.chat-logs-container > .message-item'
    )
  );
  const messageItems = allElements.filter(el => el.classList.contains('message-item'));

  const messageDetails = getMessageDetails(messageItems); // Get the message details
  // Use the word-normalized query for empty check (matches previous logic)
  const isEmptyQuery = !queryNormalizedForWord;

  // Split query by commas for multi-username or multi-word search
  const queryPartsUser = queryNormalizedForUser.split(',').map(part => part.trim()).filter(Boolean);
  const queryPartsWord = queryNormalizedForWord.split(',').map(part => part.trim()).filter(Boolean);

  // If any part of the query matches a username (normalized), treat as username search
  const isUserMode = queryPartsUser.some(part =>
    messageDetails.some(detail => normalizeUsername(detail.username) === part)
  );

  messageItems.forEach((item, index) => {
    const messageContainer = item.closest('.message-item');
    const messageDetailsItem = messageDetails[index];
    let shouldDisplay = false;

    const normalizedUsername = normalizeUsername(messageDetailsItem.username);
    const normalizedMessageText = normalizeText(messageDetailsItem.messageText);

    if (isEmptyQuery) {
      shouldDisplay = true;
    } else if (isUserMode) {
      // Username search: match if any username part matches normalized username
      shouldDisplay = queryPartsUser.some(part => normalizedUsername === part);
    } else if (queryPartsWord.length > 0) {
      // Word search: all words must be present in username or message (AND logic)
      shouldDisplay = queryPartsWord.every(word =>
        normalizedUsername.includes(word) || normalizedMessageText.includes(word)
      );
    }

    messageContainer.classList.toggle('hidden-message', !shouldDisplay);
  });

  // --- Hide date headers with no visible messages (class-based) ---
  // Find all date-item elements
  const dateItems = allElements.filter(el => el.classList.contains('date-item'));
  for (let i = 0; i < dateItems.length; i++) {
    const dateItem = dateItems[i];
    // Find all message-items between this dateItem and the next dateItem
    let nextDateIndex = allElements.indexOf(dateItem) + 1;
    let hasVisibleMessage = false;
    while (nextDateIndex < allElements.length && !allElements[nextDateIndex].classList.contains('date-item')) {
      const el = allElements[nextDateIndex];
      if (el.classList.contains('message-item') && !el.classList.contains('hidden-message')) {
        hasVisibleMessage = true;
        break;
      }
      nextDateIndex++;
    }
    // Show or hide the date header using a class
    dateItem.classList.toggle('hidden-date', !hasVisibleMessage);
  }
}
