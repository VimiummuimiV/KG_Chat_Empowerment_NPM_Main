import {
  PERSONAL_MESSAGES_KEY,
  USERNAME_COLOR_CACHE_KEY,
  USERNAME_ID_CACHE_KEY
} from '../messages/messages.js';

import { addJumpEffect } from '../../animations.js';
import { today } from '../../definitions.js';
import { getMessageTextWithImgTitles } from '../../helpers/helpers.js';

/**
 * Adds a message from chatlogs to personal messages localStorage and triggers UI effect.
 * @param {HTMLElement} messageItem - The .message-item element from chatlogs
 * @param {HTMLInputElement} dateInput - The date input element (for fallback date)
 */
export function addChatlogsMessageToPersonal(messageItem, dateInput) {
  const username = messageItem.querySelector('.message-username')?.textContent?.trim();
  const messageTextElement = messageItem.querySelector('.message-text');
  const message = messageTextElement ? getMessageTextWithImgTitles(messageTextElement) : '';
  const time = messageItem.querySelector('.message-time')?.textContent?.trim();
  // Find the date for this message
  let date = dateInput.value;
  let prev = messageItem.previousElementSibling;
  while (prev && !prev.classList.contains('date-item')) {
    prev = prev.previousElementSibling;
  }
  if (prev && prev.classList.contains('date-item')) {
    const dateText = prev.querySelector('.date-text');
    if (dateText) {
      date = dateText.textContent.trim();
    } else {
      date = prev.textContent.trim();
    }
  }
  // Add to personal messages localStorage
  const personalMessages = JSON.parse(localStorage.getItem(PERSONAL_MESSAGES_KEY)) || {};
  const usernameColorCache = JSON.parse(localStorage.getItem(USERNAME_COLOR_CACHE_KEY) || '{}');
  const usernameIdCache = JSON.parse(localStorage.getItem(USERNAME_ID_CACHE_KEY) || '{}');
  const key = `[${time}]_${username}`;
  personalMessages[key] = {
    time: `[${time}]`,
    date: date || today,
    username,
    usernameColor: usernameColorCache[username] || '#808080',
    message,
    type: 'mention',
    userId: usernameIdCache[username] || ''
  };
  // Save the updated personal messages back to localStorage
  const keys = Object.keys(personalMessages);
  keys.sort((a, b) => {
    const getDateTime = (key) => {
      const obj = personalMessages[key];
      const dateStr = obj.date || '';
      const timeStr = (obj.time || '').replace(/\[|\]/g, '');
      // Fallback to 00:00:00 if time missing
      return new Date(`${dateStr}T${timeStr || '00:00:00'}`);
    };
    return getDateTime(a) - getDateTime(b);
  });
  const orderedPersonalMessages = {};
  for (const k of keys) {
    orderedPersonalMessages[k] = personalMessages[k];
  }
  localStorage.setItem(PERSONAL_MESSAGES_KEY, JSON.stringify(orderedPersonalMessages));
  addJumpEffect(messageItem, 0, 0);
}
