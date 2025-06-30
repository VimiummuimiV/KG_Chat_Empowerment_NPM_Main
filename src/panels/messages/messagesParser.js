import { fetchChatLogs } from "../chatlogs/chatlogs.js";
import { isMentionForMe } from "../../helpers/getLatestMessageData.js";
import { ensureUsernameColorsAndIds } from "../../helpers/colorUtils.js";

import {
  PERSONAL_MESSAGES_KEY,
  USERNAME_COLOR_CACHE_KEY,
  USERNAME_ID_CACHE_KEY,
  ABSENT_MENTIONS_CACHE_KEY
} from "./messages.js";

import { today } from "../../definitions.js";
import { addJumpEffect } from "../../animations.js";

// Function to parse personal messages from chat logs and update localStorage
export async function parsePersonalMessages(date) {
  // Caching logic: only fetch if last fetch was more than 1 minute ago
  const now = Date.now();
  const lastFetch = Number(localStorage.getItem(ABSENT_MENTIONS_CACHE_KEY)) || 0;
  if (now - lastFetch < 60 * 1000) {
    // Less than 1 minute since last fetch, update timestamp and skip
    localStorage.setItem(ABSENT_MENTIONS_CACHE_KEY, String(now));
    return;
  }
  localStorage.setItem(ABSENT_MENTIONS_CACHE_KEY, String(now));

  const personalMessages = JSON.parse(localStorage.getItem(PERSONAL_MESSAGES_KEY)) || {};

  const result = await fetchChatLogs(date);
  if (!result?.chatlogs?.length) return;

  const chatlogEntries = result.chatlogs;

  // Build a set of keys for messages already stored, to avoid duplicates
  const existingKeys = new Set(Object.values(personalMessages).map(m => `${m.date}|${m.time}|${m.message}`));

  // Load or initialize caches
  let usernameColorCache = JSON.parse(localStorage.getItem(USERNAME_COLOR_CACHE_KEY) || '{}');
  let usernameIdCache = JSON.parse(localStorage.getItem(USERNAME_ID_CACHE_KEY) || '{}');

  // Get all unique, non-SYSTEM usernames from today's chatlog
  const allUsernames = [...new Set(
    chatlogEntries.reduce((acc, e) => {
      if (e.username && e.username.trim() !== 'SYSTEM') acc.push(e.username);
      return acc;
    }, [])
  )];

  // Load and cache username colors and ids
  const { colorCache, idCache } = await ensureUsernameColorsAndIds(
    allUsernames,
    USERNAME_COLOR_CACHE_KEY,
    USERNAME_ID_CACHE_KEY
  );
  usernameColorCache = colorCache;
  usernameIdCache = idCache;

  // Process chatlog entries and add new mentions
  let newMentions = 0;
  for (const entry of chatlogEntries) {
    if (
      entry.username &&
      entry.username !== 'SYSTEM' &&
      entry.message &&
      isMentionForMe(entry.message)
    ) {
      const key = `${today}|[${entry.time}]|${entry.message}`;
      if (!existingKeys.has(key)) {
        const newId = `[${entry.time}]_${entry.username}`;
        personalMessages[newId] = {
          time: `[${entry.time}]`,
          date: today,
          username: entry.username,
          usernameColor: usernameColorCache[entry.username] || '#808080',
          message: entry.message,
          type: 'mention',
          userId: usernameIdCache[entry.username] || ''
        };
        newMentions++;
      }
    }
  }

  // Update localStorage and UI if new mentions were added
  if (newMentions > 0) {
    localStorage.setItem(PERSONAL_MESSAGES_KEY, JSON.stringify(personalMessages));
    let newMessagesCount = Number(localStorage.getItem('newMessagesCount')) || 0;
    newMessagesCount += newMentions;
    localStorage.setItem('newMessagesCount', String(newMessagesCount));

    const newMessageIndicator = document.querySelector('.personal-messages-button .new-message-count');
    if (newMessageIndicator) {
      newMessageIndicator.textContent = newMessagesCount;
      newMessageIndicator.style.visibility = newMessagesCount > 0 ? 'visible' : 'hidden';
      addJumpEffect(newMessageIndicator, 50, 50);
    }
  }
}