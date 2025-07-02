import "./messagesParser.scss";
import { fetchChatLogs } from "../chatlogs/chatlogsLoader.js";
import { isMentionForMe } from "../../helpers/getLatestMessageData.js";
import { cacheUserData } from "../../helpers/colorUtils.js";

import {
  PERSONAL_MESSAGES_KEY,
  ABSENT_MENTIONS_CACHE_KEY
} from "./messages.js";

import { today, USER_DATA_CACHE_KEY } from "../../definitions.js";
import { addJumpEffect } from "../../animations.js";
import { localizedMessage } from "../../helpers/helpers.js";

// New cache key to track the last successful parse date
const LAST_PARSE_DATE_KEY = 'lastParseDate';

// Simple helper for safe JSON parsing from localStorage
function safeParseJSON(item, fallback = {}) {
  try {
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

// Improved user data assignment function
function assignUserDataFromCache(usernames, userDataCache) {
  const usernameColorCache = {};
  const usernameIdCache = {};
  
  for (const username of usernames) {
    const userData = userDataCache[username];
    
    // Assign with fallbacks
    usernameColorCache[username] = userData?.color || '#808080';
    usernameIdCache[username] = userData?.id || '';
    
    // Optional: Log missing data for debugging
    if (!userData) {
      console.debug(`No cached data found for username: ${username}`);
    }
  }
  
  return { usernameColorCache, usernameIdCache };
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to get dates between two dates (inclusive)
function getDatesBetween(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Function to parse personal messages from chat logs and update localStorage
export async function parsePersonalMessages(currentDate = today) {
  // Caching logic: only fetch if last fetch was more than 1 minute ago
  const now = Date.now();
  const lastFetch = Number(localStorage.getItem(ABSENT_MENTIONS_CACHE_KEY)) || 0;
  if (now - lastFetch < 60 * 1000) {
    // Less than 1 minute since last fetch, update timestamp and skip
    localStorage.setItem(ABSENT_MENTIONS_CACHE_KEY, String(now));
    return;
  }
  localStorage.setItem(ABSENT_MENTIONS_CACHE_KEY, String(now));

  const personalMessages = safeParseJSON(localStorage.getItem(PERSONAL_MESSAGES_KEY));

  // Get the last parse date, default to today if never parsed before
  const lastParseDate = localStorage.getItem(LAST_PARSE_DATE_KEY) || currentDate;

  // Determine which dates need to be parsed
  const datesToParse = [];

  if (lastParseDate === currentDate) {
    // Same day, only parse today
    datesToParse.push(currentDate);
  } else {
    // Different dates, parse from last parse date to current date
    const startDate = new Date(lastParseDate);
    const endDate = new Date(currentDate);

    // If last parse date is in the future (shouldn't happen but safety check)
    if (startDate > endDate) {
      datesToParse.push(currentDate);
    } else {
      datesToParse.push(...getDatesBetween(lastParseDate, currentDate));
    }

    if (datesToParse.length > 1) {
      localizedMessage({
        en: `Loading personal mentions for ${datesToParse.length} days. This may take a while. Please do not reload the page...`,
        ru: `Загрузка личных упоминаний за ${datesToParse.length} дней. Это может занять некоторое время. Пожалуйста, не перезагружайте страницу...`
      }, 'alert');
    }
  }

  console.log(`Parsing messages for dates: ${datesToParse.join(', ')}`);

  // Build a set of keys for messages already stored, using date and message for uniqueness
  const existingKeys = new Set(Object.values(personalMessages).map(m => `${m.date}|${m.message}`));

  // Load user data cache once at the beginning
  const userDataCache = safeParseJSON(localStorage.getItem(USER_DATA_CACHE_KEY));
  
  // Initialize caches
  let usernameColorCache = {};
  let usernameIdCache = {};

  let totalNewMentions = 0;

  // Progress UI for multi-day parsing
  let progressContainer, dateIndicator, progressBar, progressBarInner, progressLabel;

  if (datesToParse.length > 1) {
    progressContainer = document.createElement('div');
    progressContainer.className = 'messages-parser-progress-container';

    dateIndicator = document.createElement('div');
    dateIndicator.className = 'messages-parser-date-indicator';

    progressBar = document.createElement('div');
    progressBar.className = 'messages-parser-progress-bar';

    progressBarInner = document.createElement('div');
    progressBarInner.className = 'messages-parser-progress-bar-inner';
    progressBarInner.style.width = '0%';

    progressBar.appendChild(progressBarInner);

    progressLabel = document.createElement('div');
    progressLabel.className = 'messages-parser-progress-label';
    progressLabel.textContent = '';

    progressContainer.append(dateIndicator, progressBar, progressLabel);
    document.body.appendChild(progressContainer);
  }

  // Process each date
  let dateIndex = 0;

  for (const date of datesToParse) {
    let newMentionsForDate = 0;
    
    try {
      if (progressContainer) {
        dateIndicator.textContent = date;
        const percent = Math.round((dateIndex / datesToParse.length) * 100);
        progressBarInner.style.width = percent + '%';
        progressLabel.textContent = `${dateIndex + 1} / ${datesToParse.length}`;
      }
      
      const result = await fetchChatLogs(date);
      if (!result?.chatlogs?.length) continue;

      const chatlogEntries = result.chatlogs;

      // Get all unique, non-SYSTEM usernames from this date's chatlog
      const allUsernames = [...new Set(
        chatlogEntries
          .filter(e => e.username && e.username.trim() !== 'SYSTEM')
          .map(e => e.username)
      )];

      // Check if we need to fetch new user data
      const uncachedUsernames = allUsernames.filter(username => !userDataCache[username]);
      
      if (uncachedUsernames.length > 0) {
        console.log(`Fetching data for ${uncachedUsernames.length} uncached users for date ${date}`);
        
        try {
          // Fetch and cache new user data
          const newUserData = await cacheUserData(uncachedUsernames);
          
          // Merge new data with existing cache
          Object.assign(userDataCache, newUserData);
          
          // Update localStorage with new data
          localStorage.setItem(USER_DATA_CACHE_KEY, JSON.stringify(userDataCache));
        } catch (error) {
          console.error(`Failed to fetch user data for uncached users:`, error);
          // Continue with existing cache data
        }
      }

      // Assign user data from cache using the improved method
      const { usernameColorCache: dateColorCache, usernameIdCache: dateIdCache } = 
        assignUserDataFromCache(allUsernames, userDataCache);
      
      // Merge with existing caches (if processing multiple dates)
      Object.assign(usernameColorCache, dateColorCache);
      Object.assign(usernameIdCache, dateIdCache);

      // Process chatlog entries and add new mentions
      for (const entry of chatlogEntries) {
        if (
          entry.username &&
          entry.username !== 'SYSTEM' &&
          entry.message &&
          isMentionForMe(entry.message)
        ) {
          // Check uniqueness based on date and message only
          const uniqueKey = `${date}|${entry.message}`;
          if (!existingKeys.has(uniqueKey)) {
            const newId = `[${entry.time}]_${entry.username}_${date}`;
            
            // Use the cached data with proper fallbacks
            personalMessages[newId] = {
              time: `[${entry.time}]`,
              date: date,
              username: entry.username,
              usernameColor: usernameColorCache[entry.username] || '#808080',
              message: entry.message,
              type: 'mention',
              userId: usernameIdCache[entry.username] || ''
            };
            
            // Add to existing keys set to prevent duplicates within the same batch
            existingKeys.add(uniqueKey);
            newMentionsForDate++;
            totalNewMentions++;
          }
        }
      }

      console.log(`Found ${newMentionsForDate} new mentions for ${date}`);

      // Small delay between API calls to be respectful
      if (datesToParse.indexOf(date) < datesToParse.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error(`Error parsing messages for date ${date}:`, error);
      // Continue with other dates even if one fails
    }
    dateIndex++;
  }

  // Remove progress UI after parsing
  if (progressContainer) {
    progressBarInner.style.width = '100%';
    progressContainer.remove();
  }

  // Update localStorage and UI if new mentions were added
  if (totalNewMentions > 0) {
    localStorage.setItem(PERSONAL_MESSAGES_KEY, JSON.stringify(personalMessages));
    
    let newMessagesCount = Number(localStorage.getItem('newMessagesCount')) || 0;
    newMessagesCount += totalNewMentions;
    localStorage.setItem('newMessagesCount', String(newMessagesCount));

    const newMessageIndicator = document.querySelector('.personal-messages-button .new-message-count');
    if (newMessageIndicator) {
      newMessageIndicator.textContent = newMessagesCount;
      newMessageIndicator.style.visibility = newMessagesCount > 0 ? 'visible' : 'hidden';
      addJumpEffect(newMessageIndicator, 50, 50);
    }

    if (datesToParse.length > 1) {
      localizedMessage({
        en: `Added ${totalNewMentions} new personal mentions across ${datesToParse.length} days!`,
        ru: `Добавлено ${totalNewMentions} новых личных упоминаний за ${datesToParse.length} дней!`
      }, 'alert');
    }

    console.log(`Added ${totalNewMentions} total new mentions across ${datesToParse.length} days`);
  }

  // Update the last parse date to current date after successful parsing
  localStorage.setItem(LAST_PARSE_DATE_KEY, currentDate);
}