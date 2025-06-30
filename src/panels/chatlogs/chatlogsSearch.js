// Checks if `needle` is a subsequence of `haystack` (letters in order, possibly skipping some)
function isSubsequence(needle, haystack) {
  let i = 0, j = 0;
  while (i < needle.length && j < haystack.length) {
    if (needle[i] === haystack[j]) i++;
    j++;
  }
  return i === needle.length;
}

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
import { getFullMessageContent } from "../../helpers/helpers.js";

// Unified normalize function: removes _, -, spaces (does NOT remove commas or dots)
function normalize(text) {
  return text.replace(/[_\-\s]/g, '').toLowerCase();
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

  // Split query by commas for multi-username or multi-word search (do NOT normalize commas)
  const queryParts = query.split(',').map(part => normalize(part.trim())).filter(Boolean);

  // Retrieve message and date items within the filterMessages function
  const allElements = Array.from(
    document.querySelectorAll(
      '.chat-logs-container > .date-item, ' +
      '.chat-logs-container > .message-item'
    )
  );
  const messageItems = allElements.filter(el => el.classList.contains('message-item'));

  const messageDetails = getMessageDetails(messageItems); // Get the message details
  // Use the normalized query for empty check (matches previous logic)
  const isEmptyQuery = !queryParts.length;

  // Username search: partial and fuzzy match
  // Username/text search: partial, fuzzy, and subsequence match
  function normalizedMatch(normalizedValue, part) {
    // Ignore too-short search parts (avoid matching single letters)
    if (part.length < 2) return false;
    // Partial match: search part is contained anywhere in the value
    if (normalizedValue.includes(part)) return true;
    // Fuzzy match: search part is one typo away from the value
    if (part.length >= 3 && levenshtein(normalizedValue, part) === 1) return true;
    // Subsequence match: search part letters appear in order in the value, possibly skipping some
    if (part.length >= 3 && isSubsequence(part, normalizedValue)) return true;
    // No match
    return false;
  }

  // If any part of the query matches a username (using normalizedMatch), treat as username search
  const isUserMode = queryParts.some(part =>
    messageDetails.some(detail => normalizedMatch(normalize(detail.username), part))
  );

  messageItems.forEach((item, index) => {
    const messageContainer = item.closest('.message-item');
    const messageDetailsItem = messageDetails[index];
    let shouldDisplay = false;

    const normalizedUsername = normalize(messageDetailsItem.username);
    const normalizedMessageText = normalize(messageDetailsItem.messageText);

    if (isEmptyQuery) {
      shouldDisplay = true;
    } else if (isUserMode) {
      // Username search: match if any query part matches normalized username (partial/fuzzy/subsequence)
      shouldDisplay = queryParts.some(part => normalizedMatch(normalizedUsername, part));
    } else if (queryParts.length > 0) {
      // Word search: all query parts must be present in username or message (AND logic, both fuzzy)
      shouldDisplay = queryParts.every(word =>
        normalizedMatch(normalizedUsername, word) || normalizedMatch(normalizedMessageText, word)
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
