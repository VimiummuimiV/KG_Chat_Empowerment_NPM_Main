import { state } from "../../definitions.js";
let { fetchedUsers } = state;

import { createCustomTooltip } from "../../components/tooltip.js";
import { userlistCacheSVG } from "../../icons.js";
import { addPulseEffect } from "../../animations.js";
import { showCachePanel } from "./cache.js";
import { getCurrentLanguage } from "../../helpers/helpers.js";

const lang = getCurrentLanguage();

// Global function to prepend an emoticon to the visits element in the cache panel.
export function updateVisitsEmoticon(visitsElement) {
  // Convert content to number; exit if invalid
  const count = Number(visitsElement.textContent);
  if (isNaN(count)) return console.warn('Invalid visits count!');

  // Select emoticon: 0–10: 💧, 11–20: 💦, 21–30: 🌊, above 30: 🔥
  const emoticon = count <= 10 ? '💧' : count <= 20 ? '💦' : count <= 30 ? '🌊' : '🔥';

  visitsElement.textContent = `${emoticon} ${count}`;
}

// Function to set the cache refresh time based on user input
export function setCacheRefreshTime() {
  let isValidInput = false;
  while (!isValidInput) {
    const userInput = prompt(
      (lang === 'ru')
        ? 'Введите время обновления кэша (например, HH, HH:mm или HH:mm:ss):'
        : 'Enter a cache refresh time (e.g., HH, HH:mm, or HH:mm:ss):'
    );
    const dropTimeThreshold = document.querySelector('.drop-time-threshold');
    const timeRegex = /^([0-9]+|[01][0-9]|2[0-4])(:([0-5]?[0-9])(:([0-5]?[0-9]))?)?$/;
    if (userInput === null) {
      isValidInput = true;
    } else if (timeRegex.test(userInput)) {
      const [hours, minutes = '00', seconds = '00'] = userInput.split(':').map(part => part.padStart(2, '0'));
      dropTimeThreshold.textContent = `${hours}:${minutes}:${seconds}`;
      localStorage.setItem('cacheRefreshThresholdHours', `${hours}:${minutes}:${seconds}`);
      localStorage.removeItem('fetchedUsers');
      localStorage.removeItem('lastClearTime');
      localStorage.removeItem('nextClearTime');
      setTimeout(() => location.reload(), 1000);
      isValidInput = true;
    } else {
      alert(
        (lang === 'ru')
          ? 'Неверный формат времени. Пожалуйста, используйте HH, HH:mm или HH:mm:ss.'
          : 'Invalid time format. Please use HH, HH:mm, or HH:mm:ss.'
      );
    }
  }
}

// Function to calculate time spent on the site
export function calculateTimeOnSite(registeredDate) {
  const totalSeconds = Math.floor((new Date() - new Date(registeredDate)) / 1000);
  const years = Math.floor(totalSeconds / (365 * 24 * 60 * 60));
  const months = Math.floor((totalSeconds % (365 * 24 * 60 * 60)) / (30.44 * 24 * 60 * 60));
  const days = Math.floor((totalSeconds % (30.44 * 24 * 60 * 60)) / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  const timeComponents = [];

  if (years > 0) {
    timeComponents.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) timeComponents.push(`${months} month${months > 1 ? 's' : ''}`);
  } else if (months > 1 || (months === 1 && days > 0)) {
    timeComponents.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) timeComponents.push(`${days} day${days > 1 ? 's' : ''}`);
  } else if (days > 0) {
    timeComponents.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) timeComponents.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  } else if (hours > 0) {
    timeComponents.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  } else if (minutes > 0) {
    timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) timeComponents.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  } else {
    timeComponents.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  }

  return timeComponents.filter(Boolean).join(' '); // Filter out empty strings and join components
}

// Function to refresh or manually clear fetched users and reset the timer
// @param {boolean} isManual - If true, clears cache unconditionally; if false, clears based on threshold (default is false)
// @param {number} thresholdHours - Time threshold in hours for automatic cache clearing (default is 24 hours)
export function refreshFetchedUsers(isManual = false, thresholdHours = 24) {
  // Retrieve the last clear time from localStorage
  const lastClearTime = localStorage.getItem('lastClearTime');
  const timeElapsed = lastClearTime ? (new Date().getTime() - lastClearTime) / (1000 * 60 * 60) : Infinity;

  // If clearing manually or the time threshold has been reached, clear the cache
  if (isManual || timeElapsed >= thresholdHours) {
    localStorage.removeItem('fetchedUsers');
    // fetchedUsers = {};
    Object.keys(fetchedUsers).forEach(key => delete fetchedUsers[key]);
    // Reset the timer by updating 'lastClearTime' and 'nextClearTime'
    const nextClearTime = new Date().getTime() + thresholdHours * 60 * 60 * 1000;
    localStorage.setItem('lastClearTime', new Date().getTime().toString());
    localStorage.setItem('nextClearTime', nextClearTime.toString());
  }
}

export function updateRemainingTime() {
  const lastClearTime = localStorage.getItem('lastClearTime');
  const nextClearTime = localStorage.getItem('nextClearTime');
  const dropTimeExpiration = document.querySelector('.drop-time-expiration');
  if (lastClearTime && nextClearTime && dropTimeExpiration) {
    const remainingTime = nextClearTime - Date.now();
    if (remainingTime <= 0) {
      refreshFetchedUsers(true, cacheRefreshThresholdHours);
    } else {
      updateDropTimeExpiration(dropTimeExpiration, remainingTime);
    }
  }
}

const emojiMap = { 0: '🕛', 5: '🕐', 10: '🕑', 15: '🕒', 20: '🕓', 25: '🕔', 30: '🕕', 35: '🕖', 40: '🕗', 45: '🕘', 50: '🕙', 55: '🕚' };
function updateDropTimeExpiration(dropTimeExpiration, remainingTime) {
  const hours = String(Math.floor(remainingTime / 3600000)).padStart(2, '0');
  const minutes = String(Math.floor((remainingTime % 3600000) / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((remainingTime % 60000) / 1000)).padStart(2, '0');
  const nextInterval = Math.ceil(parseInt(seconds) / 5) * 5;
  dropTimeExpiration.textContent = `${hours}:${minutes}:${seconds} ${emojiMap[nextInterval] || emojiMap[0]}`;
}

export function createCacheButton(panel) {
  const showUserListCacheButton = document.createElement('div');
  showUserListCacheButton.classList.add('empowerment-button', 'cache-panel-load-button');
  showUserListCacheButton.style.position = 'relative';
  showUserListCacheButton.style.zIndex = '3';
  showUserListCacheButton.innerHTML = userlistCacheSVG;

  const cacheUserCount = document.createElement('div');
  cacheUserCount.className = 'cache-user-count';
  cacheUserCount.textContent = Object.keys(JSON.parse(localStorage.getItem('fetchedUsers')) || {}).length;
  showUserListCacheButton.appendChild(cacheUserCount);

  // Replace with custom tooltip
  createCustomTooltip(showUserListCacheButton, {
    en: 'Open Cache',
    ru: 'Открыть кэш'
  });
  showUserListCacheButton.addEventListener('click', () => {
    addPulseEffect(showUserListCacheButton);
    showCachePanel();
  });

  panel.appendChild(showUserListCacheButton);
}

export function updateUserCountText() {
  const userCountElement = document.querySelector('.cache-panel-load-button .cache-user-count');
  if (!userCountElement) return;
  const newUserCount = Object.keys(JSON.parse(localStorage.getItem('fetchedUsers')) || {}).length.toString();
  if (newUserCount !== userCountElement.textContent) {
    userCountElement.textContent = newUserCount;
    addPulseEffect(userCountElement);
  }
}