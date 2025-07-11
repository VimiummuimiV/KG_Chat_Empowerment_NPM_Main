import {
  emojiFaces,
  trustedDomains,
  state
} from "../definitions.js";

import { normalizeUsernameColor } from "./colorUtils.js";
import { addPulseEffect, addShakeEffect, addJumpEffect } from "../animations.js";

let { panelsEvents, bigImageEvents, fetchedUsers } = state;

export const locationHas = part => window.location.href.includes(part);

// Function to remove all event listeners from the panel
export function removeAllPanelEventListeners() {
  Object.values(panelsEvents).forEach((handler) => {
    document.removeEventListener('keydown', handler);
  });

  // Remove all keys without reassigning the object
  Object.keys(panelsEvents).forEach((key) => delete panelsEvents[key]);
}

export function addBigImageEventListeners() {
  Object.entries(bigImageEvents).forEach(([event, handler]) => {
    document.addEventListener(event, handler);
  })
}

export function removeBigImageEventListeners() {
  Object.entries(bigImageEvents).forEach(([event, handler]) => {
    document.removeEventListener(event, handler);
  })
}

// Function to remove the previous panel if it exists
export function removePreviousPanel(removeDimming = false) {
  removeAllPanelEventListeners();
  const existingPanel = document.querySelector('.popup-panel');
  if (existingPanel) existingPanel.remove();
  if (removeDimming) {
    const dimming = document.querySelector('.dimming-background');
    if (dimming) dimming.remove();
  }
}

export const debounce = (func, delay = 300) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

export function stopParserIfRunning() {
  // --- STOP CHATLOGS PARSER IF RUNNING ---
  if (window.chatlogsParserState && typeof window.chatlogsParserState.isRunning === 'function' && window.chatlogsParserState.isRunning()) {
    if (typeof window.stopChatlogsParser === 'function') {
      window.stopChatlogsParser();
    }
    // Clean up global references after stopping
    delete window.chatlogsParserState;
    delete window.stopChatlogsParser;
  }
}

// Variable to store the last selected emoji
let lastEmojiAvatar = null;

// Helper function to get a random emoji avatar
export function getRandomEmojiAvatar() {
  let newEmoji;
  do {
    newEmoji = emojiFaces[Math.floor(Math.random() * emojiFaces.length)];
  } while (newEmoji === lastEmojiAvatar);

  lastEmojiAvatar = newEmoji;
  return newEmoji;
}

// Helper function to convert time string to single hours
export function convertToSingleHours(timeString) {
  const [hours, minutes = 0, seconds = 0] = timeString.split(':').map(Number);
  return hours + minutes / 60 + seconds / 3600;
}

export function shouldEnable(targetCategory, targetType) {
  // Get stored toggle settings or default to empty array
  const storedSettings = JSON.parse(localStorage.getItem('toggle')) || [];

  // Find matching setting in localStorage
  const storedSetting = storedSettings.find(s =>
    s.category === targetCategory && s.type === targetType
  );

  // Return true if option is explicitly 'yes', false otherwise
  return storedSetting ? storedSetting.option === 'yes' : true;
}

// ---- User actions logger (enter && leave) ----
// Helper function to get current time formatted as [HH:MM:SS]
export function getCurrentTimeString() {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function logUserAction(userId, actionType) {
  if (userId && actionType) {
    // Initialize user object and ensure actionLog is an array
    fetchedUsers[userId] = fetchedUsers[userId] || {};
    fetchedUsers[userId].actionLog = fetchedUsers[userId].actionLog || [];

    // Log the action
    fetchedUsers[userId].actionLog.push({
      type: actionType,
      timestamp: getCurrentTimeString()
    });
  } else {
    console.error('Missing userId or actionType');
  }
}

export const isTrustedDomain = url => {
  try {
    const { hostname } = new URL(url);
    const domain = hostname.toLowerCase().split('.').slice(-2).join('.');
    return { isTrusted: trustedDomains.includes(domain), domain };
  } catch (err) {
    console.error("Error in isTrustedDomain:", err.message);
    return { isTrusted: false, domain: url };
  }
};

/**
 * Updates total and new personal message counts near the personal messages button.
 * - Increments new message count only when total message count increases.
 * - Manages visibility and pulse effects for the new message indicator.
 */
export function updatePersonalMessageCounts() {
  const totalCountElement = document.querySelector('.personal-messages-button .total-message-count');
  const newCountElement = document.querySelector('.personal-messages-button .new-message-count');
  if (!totalCountElement || !newCountElement) return; // Exit if elements are missing

  const personalMessages = JSON.parse(localStorage.getItem('personalMessages')) || {};
  const totalCount = Object.keys(personalMessages).length;

  // Static variable to track previous count across function calls
  if (!updatePersonalMessageCounts.previousTotalCount) {
    updatePersonalMessageCounts.previousTotalCount = totalCount;
  }

  let newCount = Number(localStorage.getItem('newMessagesCount')) || 0;
  if (totalCount > updatePersonalMessageCounts.previousTotalCount) {
    newCount++;
    localStorage.setItem('newMessagesCount', newCount);
    addPulseEffect(newCountElement); // Apply pulse effect for new messages
    addJumpEffect(newCountElement, 50, 50); // Apply jump effect for new messages
  }

  // Update counts in the UI
  totalCountElement.textContent = totalCount;
  newCountElement.textContent = newCount;

  // Manage visibility of the new message indicator
  newCountElement.style.visibility = newCount > 0 ? 'visible' : 'hidden';

  // Apply pulse effect if total count changes
  if (totalCount !== updatePersonalMessageCounts.previousTotalCount) {
    addPulseEffect(totalCountElement);
  }

  // Update previous count for next call
  updatePersonalMessageCounts.previousTotalCount = totalCount;
}

// Function to play sound as a notification for system message banned
export function playSound() {
  const marioGameOver = 'https://github.com/VimiummuimiV/Sounds/raw/refs/heads/main/Mario_Game_Over.mp3';
  const audio = new Audio(marioGameOver);
  audio.play();
}

// Function to detect a ban message based on the message text content
export function isBanMessage(messageText) {
  if (!messageText) return false; // Return false if messageText is null, undefined, or an empty string
  return ['Клавобот', 'Пользователь', 'заблокирован'].every(word => messageText.includes(word));
}

/**
 * Normalizes the color of usernames and resets their filter based on the specified mode.
 *
 * @param {NodeList|Element} usernameElements - A NodeList of username elements or a single username element.
 * @param {string} mode - The mode of operation; either 'one' to process a single username or 'all' to process multiple.
 */
export function normalizeAndResetUsernames(usernameElements, mode) {
  if (!usernameElements) return; // Skip processing if undefined or null

  if (mode === 'one') {
    // Process a single username element.
    const userSpan = usernameElements.querySelector('span[data-user]');
    if (!userSpan) return; // Skip processing if child span is missing
    const computedColor = getComputedStyle(usernameElements).color;
    const normalizedColor = normalizeUsernameColor(computedColor, "rgb");
    usernameElements.style.setProperty('color', normalizedColor, 'important');
    userSpan.style.setProperty('filter', 'invert(0)', 'important');
  } else if (mode === 'all') {
    // Process all username elements using forEach with return (which acts like continue)
    Array.from(usernameElements).forEach(usernameElement => {
      if (!usernameElement) return; // Skip this iteration if the element is falsy
      const userSpan = usernameElement.querySelector('span[data-user]');
      if (!userSpan) return; // Skip if child span is missing
      const computedColor = getComputedStyle(usernameElement).color;
      const normalizedColor = normalizeUsernameColor(computedColor, "rgb");
      usernameElement.style.setProperty('color', normalizedColor, 'important');
      userSpan.style.setProperty('filter', 'invert(0)', 'important');
    });
  } else {
    console.error("Invalid mode. Use 'one' or 'all'.");
  }
}

/**
 * Copy a chatlogs URL to the clipboard and shake the time element.
 * @param {string} date - The date string (YYYY-MM-DD).
 * @param {string} time - The time string (HH:MM:SS or similar).
 * @param {HTMLElement} timeElement - The time element to shake.
 */
export function copyChatlogsUrlToClipboard(date, time, timeElement) {
  const url = `https://klavogonki.ru/chatlogs/${date}.html#${time}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      addShakeEffect(timeElement); // Add shake effect to the time element
      clearSelection(); // Clear any text selection
    });
  }
}

// Clears any text selection in the document (cross-browser).
export function clearSelection() {
  if (window.getSelection) {
    const selection = window.getSelection();
    if (selection && selection.removeAllRanges) {
      selection.removeAllRanges();
    }
  }
}

// Function to check if any text is selected in the document
export function isTextSelected() {
  return window.getSelection().toString().length > 0;
}

// Function to get full message content, including image titles (for emoticons/images)
export function getFullMessageContent(element) {
  let result = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip video-wrapper and its children except for .media anchors
      if (node.classList && node.classList.contains('video-wrapper')) {
        // Only extract href from <a class="media"> inside video-wrapper
        const mediaLinks = node.querySelectorAll('a.media');
        mediaLinks.forEach(link => {
          if (link.href) result += link.href + ' ';
        });
        continue;
      }
      if (node.tagName === 'IMG') {
        result += node.title || node.alt || '';
      } else if (node.tagName === 'A') {
        // For <a> tags, use href if present, otherwise fallback to text
        result += node.href ? node.href : node.textContent;
      } else {
        result += getFullMessageContent(node);
      }
    }
  }
  return result.trim();
}

// Export helper: preserves highlights and smileys for all formats
export function getExportMessageContent(element, format) {
  if (!element) return '';
  // 1. Replace <img ... title=":smile:"> with the title text (e.g. :smile:)
  let html = element.innerHTML.replace(/<img[^>]*title=["']([^"']+)["'][^>]*>/gi, '$1');
  // 2. Replace highlight spans with color markup
  html = html
    .replace(/<span class=["']parse-match-message["']>([\s\S]*?)<\/span>/gi, (m, text) => {
      if (format === 'bbcode') return `[color=#32cd32]${text}[/color]`;
      if (format === 'markdown') return `*${text}*`;
      return text;
    })
    .replace(/<span class=["']search-match-message["']>([\s\S]*?)<\/span>/gi, (m, text) => {
      if (format === 'bbcode') return `[color=#ffa500]${text}[/color]`;
      if (format === 'markdown') return `*${text}*`;
      return text;
    });
  // 3. Remove any other HTML tags
  html = html.replace(/<[^>]+>/g, '');
  // 4. For plain, just return textContent
  if (format === 'plain') return element.textContent;
  return html;
}

// Utility to get current language from settings (toggle section)
export function getCurrentLanguage() {
  try {
    const toggle = JSON.parse(localStorage.getItem('toggle')) || [];
    const langSetting = toggle.find(s => s.category === 'ui' && s.type === 'language');
    return langSetting?.option || 'en';
  } catch {
    return 'en';
  }
}

// Optimized helper for localized dialogs (alert, prompt, confirm) (en/ru)
export function localizedMessage(msgs, type = 'alert', ...args) {
  const lang = getCurrentLanguage();
  const message = msgs[lang] || msgs.en;
  if (type === 'alert') return alert(message);
  if (type === 'confirm') return confirm(message);
  if (type === 'prompt') return prompt(message, ...args);
  return alert(message);
}

// Function to validate date parts (year, month, day)
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

// Function to normalize date strings into YYYY-MM-DD format
export function normalizeDate(str) {
  let y, m, d;
  if (/^\d{4}[:\-]\d{2}[:\-]\d{2}$/.test(str)) {
    [y, m, d] = str.replace(/:/g, '-').split('-');
  } else if (/^\d{8}$/.test(str)) {
    y = str.slice(0, 4); m = str.slice(4, 6); d = str.slice(6, 8);
  } else if (/^\d{6}$/.test(str)) {
    y = '20' + str.slice(0, 2); m = str.slice(2, 4); d = str.slice(4, 6);
  } else if (/^\d{2}-\d{2}-\d{2}$/.test(str)) {
    y = '20' + str.slice(0, 2); m = str.slice(3, 5); d = str.slice(6, 8);
  } else {
    return null;
  }
  if (!isValidDateParts(y, m, d)) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}