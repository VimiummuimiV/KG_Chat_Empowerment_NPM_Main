import { USERNAME_COLOR_CACHE_KEY } from "../messages/messages.js";

/**
 * Render chat messages into a container.
 * @param {Array} chatlogs - Array of { time, username, message }
 * @param {HTMLElement} messagesContainer - The container to append messages to
 * @param {boolean} [preserveMessages] - If true, do not clear container (for incremental rendering)
 * @param {string} [addDateHeader] - Optional date header to display before messages
 * @param {Array<string>} [searchTerms] - Array of search terms to highlight (optional)
 * @param {boolean} [highlightSearch] - Whether to highlight search terms (default: false)
 * @returns {Map} usernameMessageCountMap - Map of username to message count
 */
export function renderChatMessages(chatlogs, messagesContainer, preserveMessages, addDateHeader, searchTerms = [], highlightSearch = false) {
  // Parse color cache once per render
  const colorCache = JSON.parse(localStorage.getItem(USERNAME_COLOR_CACHE_KEY) || '{}');
  let lastDisplayedUsername = null;
  const usernameMessageCountMap = new Map();
  if (!preserveMessages) messagesContainer.innerHTML = '';

  // Optionally render a date header
  if (addDateHeader) {
    const header = document.createElement('div');
    header.className = 'date-item';

    // Create text span for copy operations
    const dateTextSpan = document.createElement('span');
    dateTextSpan.className = 'date-text';
    dateTextSpan.textContent = addDateHeader;

    // Create emoji span for visual decoration only
    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'date-emoji';
    emojiSpan.textContent = ' 📅';  // Note: space before emoji for proper spacing

    header.appendChild(dateTextSpan);
    header.appendChild(emojiSpan);
    messagesContainer.appendChild(header);
  }

  // Helper to highlight search terms in a message
  function highlightTerms(message, terms) {
    if (!highlightSearch || !terms || !terms.length || !message) return message;
    // Escape regex special chars in each term
    const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    return message.replace(regex, '<span class="parse-match">$1</span>');
  }

  // Batch DOM updates using a DocumentFragment
  const fragment = document.createDocumentFragment();
  chatlogs.forEach(({ time, username, message }) => {
    usernameMessageCountMap.set(username, (usernameMessageCountMap.get(username) || 0) + 1);

    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-item');

    const timeElement = document.createElement('span');
    timeElement.className = 'message-time';
    timeElement.textContent = time;

    const usernameElement = document.createElement('span');
    usernameElement.className = 'message-username';
    usernameElement.textContent = username;
    usernameElement.style.color = colorCache[username] || '#808080';

    const messageTextElement = document.createElement('span');
    messageTextElement.className = 'message-text';
    let html = '';
    if (typeof message === 'string' && message.length > 0) {
      html = message
        .replace(/:(?=\w*[a-zA-Z])(\w+):/g,
          (_, word) => `<img src="/img/smilies/${word}.gif" alt=":${word}:" title=":${word}:" class="smile">`
        )
        .replace(/(https?:\/\/[^\s]+)/gi,
          (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        );
      if (highlightSearch && searchTerms && searchTerms.length > 0) {
        html = highlightTerms(html, searchTerms);
      }
    }
    messageTextElement.innerHTML = html;

    messageContainer.style.marginTop = lastDisplayedUsername !== username ? '0.6em' : '';
    lastDisplayedUsername = username;

    messageContainer.appendChild(timeElement);
    messageContainer.appendChild(usernameElement);
    messageContainer.appendChild(messageTextElement);

    fragment.appendChild(messageContainer);
  });
  messagesContainer.appendChild(fragment);

  return usernameMessageCountMap;
}
