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
export function removePreviousPanel() {
  removeAllPanelEventListeners();
  const existingPanel = document.querySelector('.popup-panel');
  if (existingPanel) existingPanel.remove();
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

// Initialize previousTotalCount with the current personal messages count from localStorage
let previousTotalCount =
  (localStorage.personalMessages && Object.keys(JSON.parse(localStorage.personalMessages)).length) || 0;
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

  let newCount = Number(localStorage.getItem('newMessagesCount')) || 0;
  if (totalCount > previousTotalCount) {
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
  if (totalCount !== previousTotalCount) addPulseEffect(totalCountElement);

  previousTotalCount = totalCount; // Update previous count
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
    const normalizedColor = normalizeUsernameColor(computedColor);
    usernameElements.style.setProperty('color', normalizedColor, 'important');
    userSpan.style.setProperty('filter', 'invert(0)', 'important');
  } else if (mode === 'all') {
    // Process all username elements using forEach with return (which acts like continue)
    Array.from(usernameElements).forEach(usernameElement => {
      if (!usernameElement) return; // Skip this iteration if the element is falsy
      const userSpan = usernameElement.querySelector('span[data-user]');
      if (!userSpan) return; // Skip if child span is missing
      const computedColor = getComputedStyle(usernameElement).color;
      const normalizedColor = normalizeUsernameColor(computedColor);
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

// Function to get message text with image titles
export function getMessageTextWithImgTitles(element) {
  let result = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'IMG') {
        result += node.title || node.alt || '';
      } else {
        result += getMessageTextWithImgTitles(node);
      }
    }
  }
  return result.trim();
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