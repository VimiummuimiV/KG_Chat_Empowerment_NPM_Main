import "./cache.scss" // cache styles

// helpers && helpers definitions
import {
  // helpers
  removePreviousPanel,
  debounce,
  getRandomEmojiAvatar,
  refreshFetchedUsers,
  calculateTimeOnSite,
  getCurrentLanguage
} from "../../helpers.js";

import { getUserProfileData } from "../../helpers/userProfileData.js";

import {
  triggerTargetElement,
  triggerDimmingElement,
  adjustVisibility
} from "../../helpers/elementVisibility.js";

import { getAllUserIDsByName } from "../../helpers/apiData.js";
import { createScrollButtons } from "../../helpers/scrollButtons.js";

// notifications
import {
  createStaticNotification
} from "../../notifications.js";

// icons
import {
  usersSVG,
  trashSVG,
  closeSVG,
  enterSVG,
  leaveSVG,
  userlistCacheSVG
} from "../../icons.js";

// definitions
import {
  cacheRefreshThresholdHours,
  debounceTimeout,
  profileBaseUrl,
  myUserId,
  state
} from "../../definitions.js";

import { addPulseEffect } from "../../animations.js"; // animations
import { createCustomTooltip } from "../../tooltip.js";
import { loadProfileIntoIframe } from "../../helpers/iframeProfileLoader.js";

// --- Localization for cache panel interface ---
const cacheMessages = {
  threshold: {
    icon: '🚧',
    en: 'Threshold',
    ru: 'Порог'
  },
  countdown: {
    icon: '💣',
    en: 'Countdown',
    ru: 'Обратный отсчёт'
  }
};
const currentLanguage = getCurrentLanguage();

// Rank order mapping
const rankOrder = {
  'Экстракибер': 1,
  'Кибергонщик': 2,
  'Супермен': 3,
  'Маньяк': 4,
  'Гонщик': 5,
  'Профи': 6,
  'Таксист': 7,
  'Любитель': 8,
  'Новичок': 9
};

// Rank color mapping
const rankColors = {
  'Экстракибер': '#06B4E9', // Light Blue
  'Кибергонщик': '#5681ff', // Medium Blue
  'Супермен': '#B543F5', // Purple
  'Маньяк': '#DA0543', // Red
  'Гонщик': '#FF8C00', // Orange
  'Профи': '#C1AA00', // Yellow
  'Таксист': '#2DAB4F', // Green
  'Любитель': '#61B5B3', // Light Cyan
  'Новичок': '#AFAFAF' // Grey
};

// Global function to prepend an emoticon to the visits element in the cache panel.
function updateVisitsEmoticon(visitsElement) {
  // Convert content to number; exit if invalid
  const count = Number(visitsElement.textContent);
  if (isNaN(count)) return console.warn('Invalid visits count!');

  // Select emoticon: 0–10: 💧, 11–20: 💦, 21–30: 🌊, above 30: 🔥
  const emoticon = count <= 10 ? '💧' : count <= 20 ? '💦' : count <= 30 ? '🌊' : '🔥';

  visitsElement.textContent = `${emoticon} ${count}`;
}

// Function to display the cached user list panel
function showCachePanel() {
  const existingPanel = document.querySelector('.cached-users-panel');
  if (existingPanel) {
    existingPanel.remove();
    triggerDimmingElement('hide');
    return;
  }

  removePreviousPanel();
  let users = JSON.parse(localStorage.getItem('fetchedUsers')) || {};

  const cachedUsersPanel = document.createElement('div');
  cachedUsersPanel.className = 'cached-users-panel popup-panel';

  state.panelsEvents.handleCacheKeydown = (event) => {
    if (event.key === 'Escape') {
      triggerTargetElement(cachedUsersPanel, 'hide');
      triggerDimmingElement('hide');
      document.removeEventListener('keydown', state.panelsEvents.handleCacheKeydown);
    }
  };
  document.addEventListener('keydown', state.panelsEvents.handleCacheKeydown);

  const panelHeaderContainer = document.createElement('div');
  panelHeaderContainer.className = 'panel-header';

  const dropTime = document.createElement('div');
  dropTime.className = 'drop-time';

  const dropTimeThresholdDescription = document.createElement('span');
  dropTimeThresholdDescription.className = 'drop-time-threshold-description';
  dropTimeThresholdDescription.textContent = `${cacheMessages.threshold.icon} ${cacheMessages.threshold[currentLanguage]}`;

  const dropTimeThreshold = document.createElement('span');
  dropTimeThreshold.className = 'drop-time-threshold';
  const storedThresholdTime = localStorage.getItem('cacheRefreshThresholdHours');
  dropTimeThreshold.innerHTML = storedThresholdTime || '00:00:00';
  dropTimeThreshold.addEventListener('click', setCacheRefreshTime);
  createCustomTooltip(dropTimeThreshold, {
    en: 'Click to set cache refresh time',
    ru: 'Нажмите, чтобы установить время обновления кэша'
  });

  const dropTimeExpirationDescription = document.createElement('span');
  dropTimeExpirationDescription.className = 'drop-time-expiration-description';
  dropTimeExpirationDescription.textContent = `${cacheMessages.countdown.icon} ${cacheMessages.countdown[currentLanguage]}`;

  const dropTimeExpiration = document.createElement('span');
  dropTimeExpiration.className = 'drop-time-expiration';
  createCustomTooltip(dropTimeExpiration, {
    en: 'Time until cache refresh',
    ru: 'Время до обновления кэша'
  });

  function setCacheRefreshTime() {
    let isValidInput = false;
    while (!isValidInput) {
      const userInput = prompt('Enter a cache refresh time (e.g., HH, HH:mm, or HH:mm:ss):');
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
        alert('Invalid time format. Please use HH, HH:mm, or HH:mm:ss.');
      }
    }
  }

  dropTime.append(dropTimeThresholdDescription, dropTimeThreshold, dropTimeExpirationDescription, dropTimeExpiration);
  panelHeaderContainer.appendChild(dropTime);

  const cacheSearchContainer = document.createElement('div');
  cacheSearchContainer.className = 'search-for-cached-users';

  const cacheSearchInput = document.createElement('input');
  cacheSearchInput.className = 'cached-users-search-input';
  cacheSearchInput.type = 'text';
  createCustomTooltip(cacheSearchInput, {
    en: `
      [Ctrl + Click] to clear the input and display all users
      [Enter] to activate user search mode on the site
    `,
    ru: ` 
      [Ctrl + Клик] очистить поле и показать всех пользователей
      [Enter] включить режим поиска пользователей на сайте
    `
  });
  cacheSearchContainer.appendChild(cacheSearchInput);

  cacheSearchInput.addEventListener('click', (event) => {
    if (event.ctrlKey) {
      cacheSearchInput.value = '';
      cacheSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  cacheSearchInput.addEventListener('input', () => {
    const oldUsersContainer = document.querySelector('.old-users');
    const newUsersContainer = document.querySelector('.new-users');
    const fetchedUsersContainer = document.querySelector('.fetched-users');

    if (!cacheSearchInput.value.trim()) {
      oldUsersContainer.style.display = 'grid';
      newUsersContainer.style.display = 'grid';
      const searchResultsContainer = document.querySelector('.search-results');
      if (searchResultsContainer && fetchedUsersContainer) {
        fetchedUsersContainer.removeChild(searchResultsContainer);
      }
    }
  });

  cacheSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.target.value.trim()) {
      event.preventDefault();
      event.target.value = 'user ';
    }
  });

  const handleSearch = async (username) => {
    const oldUsersContainer = document.querySelector('.old-users');
    const newUsersContainer = document.querySelector('.new-users');
    const fetchedUsersContainer = document.querySelector('.fetched-users');

    if (username) {
      oldUsersContainer.style.display = 'none';
      newUsersContainer.style.display = 'none';

      let searchResultsContainer = document.querySelector('.search-results') || createUserContainer('search');
      if (!searchResultsContainer.parentElement) fetchedUsersContainer.appendChild(searchResultsContainer);
      searchResultsContainer.replaceChildren();

      const userElements = [];

      try {
        const userIds = await getAllUserIDsByName(username);
        await Promise.all(userIds.map(async (userId) => {
          const profileData = await getUserProfileData(userId, false);
          const userData = {
            rank: profileData.rank,
            login: profileData.login,
            registered: profileData.registeredDate,
            bestSpeed: profileData.bestSpeed,
            ratingLevel: profileData.ratingLevel,
            friends: profileData.friends,
            cars: profileData.cars,
            avatarTimestamp: profileData.avatarTimestamp,
            avatar: profileData.avatar
          };
          const userElementData = createCachePanelUserElement(userId, userData);
          if (userElementData) userElements.push(userElementData);
        }));

        userElements.sort((a, b) => a.order !== b.order ? a.order - b.order : b.bestSpeed - a.bestSpeed);
        userElements.forEach(({ userElement }) => searchResultsContainer.appendChild(userElement));
        const searchDescription = createDescription(`Search Results for: ${username}`, 'search-results-description');
        searchResultsContainer.prepend(searchDescription);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = `Error: ${error.message}`;
        searchResultsContainer.appendChild(errorMessage);
      }
    }
  };

  cacheSearchInput.addEventListener('input', debounce((event) => {
    const inputValue = event.target.value.trim();
    const searchMode = localStorage.getItem('cachePanelSearchMode');
    const username = inputValue.startsWith('user ') ? inputValue.substring(5).trim() : (searchMode === 'fetch' ? inputValue : '');
    if (username) handleSearch(username);
  }, debounceTimeout));

  panelHeaderContainer.appendChild(cacheSearchContainer);

  const observer = new MutationObserver(mutations => {
    if (mutations.some(m => m.type === 'childList' && m.addedNodes.length)) {
      const cachePanelSearchInput = document.querySelector('.cached-users-search-input');
      const cachePanelLogins = Array.from(document.querySelectorAll('.fetched-users .login'));

      const getFuzzyMatchScore = (query, text) => {
        let score = 0, queryIndex = 0;
        for (const char of text.toLowerCase()) {
          if (queryIndex < query.length && char === query[queryIndex].toLowerCase()) {
            score += 2;
            queryIndex++;
          }
        }
        return queryIndex === query.length ? score : 0;
      };

      const filterItems = query => {
        cachePanelLogins.forEach(item => {
          const userContainer = item.closest('.user-item');
          userContainer.style.display = (!query || getFuzzyMatchScore(query, item.textContent) > 0) ? 'grid' : 'none';
        });
      };

      cachePanelSearchInput.focus();
      cachePanelSearchInput.addEventListener('input', () => filterItems(cachePanelSearchInput.value.trim()));
      observer.disconnect();
    }
  });
  observer.observe(panelHeaderContainer, { childList: true, subtree: true });

  const panelControlButtons = document.createElement('div');
  panelControlButtons.className = 'panel-control-buttons';
  panelControlButtons.style.display = 'flex';

  const cachePanelSearchMode = document.createElement('div');
  cachePanelSearchMode.className = 'large-button user-mode-button';
  cachePanelSearchMode.innerHTML = usersSVG;
  const currentSearchMode = localStorage.getItem('cachePanelSearchMode') || (localStorage.setItem('cachePanelSearchMode', 'cache'), 'cache');
  createCustomTooltip(cachePanelSearchMode, {
    en: (mode => `Current active mode: ${mode}`)(currentSearchMode),
    ru: (mode => `Текущий активный режим: ${mode === 'cache' ? 'кэш' : 'поиск'}`)(currentSearchMode)
  });

  function updateStyles(mode) {
    cachePanelSearchMode.classList.toggle('cache-mode-button', mode === 'cache');
    cachePanelSearchMode.classList.toggle('fetch-mode-button', mode !== 'cache');
  }
  updateStyles(currentSearchMode);

  cachePanelSearchMode.addEventListener('click', () => {
    const newMode = localStorage.getItem('cachePanelSearchMode') === 'cache' ? 'fetch' : 'cache';
    localStorage.setItem('cachePanelSearchMode', newMode);
    updateStyles(newMode);
    createCustomTooltip(cachePanelSearchMode, {
      en: `Current active mode: ${newMode}`,
      ru: `Текущий активный режим: ${newMode === 'cache' ? 'кэш' : 'поиск'}`
    });

    // Toggle visibility of user containers based on the mode
    const oldUsersContainer = document.querySelector('.old-users');
    const newUsersContainer = document.querySelector('.new-users');
    let searchResultsContainer = document.querySelector('.search-results');

    if (newMode === 'fetch') {
      // Hide old and new user containers
      oldUsersContainer.style.display = 'none';
      newUsersContainer.style.display = 'none';

      // Create or show the search results container
      if (!searchResultsContainer) {
        searchResultsContainer = document.createElement('div');
        searchResultsContainer.className = 'users-container search-results';
        fetchedUsersContainer.appendChild(searchResultsContainer);
      }
      searchResultsContainer.style.display = 'grid';
    } else {
      // Show old and new user containers, hide search results
      oldUsersContainer.style.display = 'grid';
      newUsersContainer.style.display = 'grid';
      if (searchResultsContainer) {
        searchResultsContainer.style.display = 'none';
      }
    }
  });

  panelControlButtons.appendChild(cachePanelSearchMode);

  const clearCacheButton = document.createElement('div');
  clearCacheButton.className = 'large-button panel-header-clear-button';
  createCustomTooltip(clearCacheButton, {
    en: 'Clear cache',
    ru: 'Очистить кэш'
  });
  clearCacheButton.innerHTML = trashSVG;
  clearCacheButton.addEventListener('click', () => {
    hideCachePanel();
    refreshFetchedUsers(true, cacheRefreshThresholdHours);
    const userCountElement = document.querySelector('.cache-panel-load-button .cache-user-count');
    if (userCountElement) userCountElement.textContent = '0';
  });
  panelControlButtons.appendChild(clearCacheButton);

  const closePanelButton = document.createElement('div');
  closePanelButton.className = 'large-button panel-header-close-button';
  createCustomTooltip(closePanelButton, {
    en: 'Close panel',
    ru: 'Закрыть панель'
  });
  closePanelButton.innerHTML = closeSVG;
  closePanelButton.addEventListener('click', hideCachePanel);
  panelControlButtons.appendChild(closePanelButton);

  panelHeaderContainer.appendChild(panelControlButtons);

  const fetchedUsersContainer = document.createElement('div');
  fetchedUsersContainer.className = 'fetched-users';

  function createUserContainer(type) {
    const userContainer = document.createElement('div');
    if (type === 'old') {
      userContainer.className = 'users-container old-users';
    } else if (type === 'new') {
      userContainer.className = 'users-container new-users';
    } else if (type === 'search') {
      userContainer.className = 'users-container search-results';
    }
    return userContainer;
  }

  const oldUsersContainer = createUserContainer('old');
  const newUsersContainer = createUserContainer('new');

  function createDescription(text, className) {
    const description = document.createElement('span');
    description.className = `description ${className}`;
    description.textContent = text;
    return description;
  }

  oldUsersContainer.appendChild(createDescription('Active Users', 'old-users-description'));
  newUsersContainer.appendChild(createDescription('New Registrations', 'new-users-description'));
  fetchedUsersContainer.append(oldUsersContainer, newUsersContainer);

  const userElements = [];
  let shouldProcessActionLog = true;
  const currentDate = new Date();
  const isNewUser = registered => (currentDate - new Date(registered)) <= 24 * 60 * 60 * 1000;

  const createCachePanelUserElement = (userId, userData) => {
    const userElement = document.createElement('div');
    userElement.className = 'user-item';

    const avatarElement = document.createElement('div');
    avatarElement.className = 'avatar';
    const avatarTimestamp = userData.avatarTimestamp; // Changed from fetchedUsers[userId]?.avatarTimestamp
    const bigAvatarUrl = `/storage/avatars/${userId}_big.png`;
    if ((avatarTimestamp && avatarTimestamp !== '00') || (userData.avatar && Object.keys(userData.avatar).length)) {
      const imgElement = document.createElement('img');
      imgElement.src = `${bigAvatarUrl}?updated=${avatarTimestamp}`;
      imgElement.alt = `${userData.login}'s avatar`;
      imgElement.style.objectFit = 'cover';
      avatarElement.appendChild(imgElement);
    } else {
      avatarElement.innerHTML = getRandomEmojiAvatar();
    }

    const userDataElement = document.createElement('div');
    userDataElement.className = 'user-data';

    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-container';

    const loginElement = document.createElement('a');
    loginElement.className = 'login';
    loginElement.textContent = userData.login;
    loginElement.href = `https://klavogonki.ru/profile/${userId}`;

    loginContainer.appendChild(loginElement);

    if (userData.visits !== undefined) {
      const visitsElement = document.createElement('span');
      visitsElement.className = `visits ${userData.tracked ? 'tracked' : 'untracked'}`;
      visitsElement.textContent = userData.visits;
      visitsElement.dataset.userId = userId;
      updateVisitsEmoticon(visitsElement);
      loginContainer.appendChild(visitsElement);
    }

    userDataElement.appendChild(loginContainer);

    const rankElement = document.createElement('div');
    rankElement.className = 'rank';
    rankElement.textContent = userData.rank || 'N/A';
    rankElement.style.color = rankColors[userData.rank] || 'white';
    userDataElement.appendChild(rankElement);

    const registeredElement = document.createElement('div');
    registeredElement.className = 'registered';
    registeredElement.textContent = userData.registered || 'N/A';
    userDataElement.appendChild(registeredElement);

    const createMetricElement = (className, color, icon, value, title, url) => {
      const element = document.createElement('span');
      element.className = className;
      element.style.color = color;
      element.innerHTML = `${icon}${value || 0}`;
      element.style.cursor = 'pointer';
      element.dataset.url = url; // Store the URL for delegation
      return element;
    };

    const userMetrics = document.createElement('div');
    userMetrics.className = "user-metrics";
    userMetrics.append(
      createMetricElement(
        'best-speed',
        'cyan',
        '🚀',
        userData.bestSpeed,
        'Best speed',
        `https://klavogonki.ru/u/#/${userId}/stats/normal/`
      ),

      createMetricElement(
        'rating-level',
        'gold',
        '⭐',
        userData.ratingLevel,
        'Rating level',
        `https://klavogonki.ru/top/rating/today?s=${userData.login}`
      ),

      createMetricElement(
        'cars-count',
        'lightblue',
        '🚖',
        userData.cars,
        'Cars count',
        `https://klavogonki.ru/u/#/${userId}/car/`
      ),

      createMetricElement(
        'friends-count',
        'lightgreen',
        '🤝',
        userData.friends,
        'Friends count',
        `https://klavogonki.ru/u/#/${userId}/friends/list/`
      )
    );

    userElement.append(avatarElement, userDataElement, userMetrics);

    return {
      userElement,
      order: rankOrder[userData.rank] || 10,
      bestSpeed: userData.bestSpeed || 0,
      registered: userData.registered
    };
  };

  if (localStorage.getItem('cachePanelSearchMode') === 'cache') {
    Object.keys(users).forEach(userId => {
      const userData = users[userId];
      userElements.push(createCachePanelUserElement(userId, userData));
    });
    userElements.sort((a, b) => a.order !== b.order ? a.order - b.order : b.bestSpeed - a.bestSpeed);
    userElements.forEach(({ userElement, registered }) => {
      (isNewUser(registered) ? newUsersContainer : oldUsersContainer).appendChild(userElement);
    });
  }

  document.body.appendChild(cachedUsersPanel);

  cachedUsersPanel.append(panelHeaderContainer, fetchedUsersContainer);
  const { scrollButtonsContainer } = createScrollButtons(fetchedUsersContainer);
  cachedUsersPanel.appendChild(scrollButtonsContainer);

  triggerTargetElement(cachedUsersPanel, 'show');
  triggerDimmingElement('show');

  function updateRemainingTime() {
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

  setInterval(updateRemainingTime, 1000);
  updateRemainingTime();

  // Delegated event listener for user metrics and login links
  fetchedUsersContainer.addEventListener('click', (event) => {
    const metric = event.target.closest('.best-speed, .rating-level, .cars-count, .friends-count');
    if (metric) {
      const url = metric.dataset.url;
      if (url) loadProfileIntoIframe(url);
      return;
    }

    const login = event.target.closest('.login');
    if (login) {
      event.preventDefault();
      const userId = login.href.split('/').pop();
      const profileUrl = profileBaseUrl + userId;
      const messageInProfile = `${profileBaseUrl}${myUserId}/messages/${userId}/`;
      if (event.ctrlKey && event.shiftKey) {
        const newTab = window.open(messageInProfile, '_blank');
        if (newTab) newTab.focus();
      } else if (event.ctrlKey) {
        loadProfileIntoIframe(messageInProfile);
      } else {
        loadProfileIntoIframe(profileUrl);
      }
      return;
    }

    const visits = event.target.closest('.visits');
    if (visits) {
      event.stopPropagation();
      let shouldProcessActionLog = true;
      const userId = visits.dataset.userId;
      const users = JSON.parse(localStorage.getItem('fetchedUsers')) || {};
      const user = users ? users[userId] : null;
      const actionLog = user?.actionLog;

      if (user) {
        let actionLogContainer = document.querySelector('.action-log');
        if (!actionLogContainer) {
          actionLogContainer = document.createElement('div');
          actionLogContainer.className = 'action-log';
          fetchedUsersContainer.appendChild(actionLogContainer);
          adjustVisibility(actionLogContainer, 'show', 1);
        } else {
          actionLogContainer.replaceChildren();
        }

        if (actionLog && shouldProcessActionLog) {
          actionLog.forEach((action, index) => {
            if (!shouldProcessActionLog || typeof action !== 'object' || !action) return;
            const { type, timestamp } = action;
            const userAction = visits.closest('.user-item').querySelector('.login').textContent || 'Unknown User';
            const actionIconType = type === 'enter' ? enterSVG : leaveSVG;
            const userPresence = type === 'enter';
            setTimeout(() => {
              if (shouldProcessActionLog) {
                createStaticNotification(userAction, actionIconType, timestamp, userPresence, 'cachePanel');
              }
            }, 10 * (index + 1));
          });
        }
        const closeActionLog = (e) => {
          if (!actionLogContainer.contains(e.target) || e.code === 'Space') {
            if (e.code === 'Space') e.preventDefault();
            adjustVisibility(actionLogContainer, 'hide', 0);
            shouldProcessActionLog = false;
            ['click', 'keydown'].forEach(evt => document.removeEventListener(evt, closeActionLog));
          }
        };
        ['click', 'keydown'].forEach(evt => document.addEventListener(evt, closeActionLog));
      } else {
        console.error('User data not found');
      }
    }
  });

  // Delegated mouseover/mouseout for .registered
  fetchedUsersContainer.addEventListener('mouseover', (event) => {
    const registered = event.target.closest('.registered');
    if (registered && fetchedUsersContainer.contains(registered)) {
      registered._originalContent = registered.textContent;
      registered._hoverTimer = setTimeout(() => {
        const userItem = registered.closest('.user-item');
        const login = userItem?.querySelector('.login');
        const userId = login?.href?.split('/').pop();
        // Use the users object from closure, not localStorage
        const userData = users[userId] || { registered: registered.textContent };
        registered.textContent = calculateTimeOnSite(userData.registered);
      }, 300);
    }
  });
  fetchedUsersContainer.addEventListener('mouseout', (event) => {
    const registered = event.target.closest('.registered');
    if (registered && fetchedUsersContainer.contains(registered)) {
      clearTimeout(registered._hoverTimer);
      if (registered._originalContent) {
        registered.textContent = registered._originalContent;
      }
    }
  });

  // Delegated tooltips for user metrics
  createCustomTooltip(
    '.login,' +
    '.visits,' +
    '.best-speed,' +
    '.rating-level,' +
    '.cars-count,' +
    '.friends-count',
    fetchedUsersContainer,
    (el) => {
      if (el.classList.contains('login')) {
        return {
          en: ` 
          [Click] to open profile in iframe (summary)
          [Ctrl + Click] to open profile in iframe (messages)
          [Ctrl + Shift + Click] to open profile in a new tab (messages)
          `,
          ru: ` 
          [Клик] открыть профиль в iframe (сводка)
          [Ctrl + Клик] открыть профиль в iframe (сообщения)
          [Ctrl + Shift + Клик] открыть профиль в новой вкладке (сообщения)
          `
        }
      }

      if (el.classList.contains('visits')) {
        const userItem = el.closest('.user-item');
        const loginElement = userItem?.querySelector('.login');
        const loginText = loginElement?.textContent || '';
        return {
          en: `View action log for ${loginText}`,
          ru: `Посмотреть журнал действий для ${loginText}`
        }
      }

      if (el.classList.contains('best-speed')) {
        return { en: 'Best speed', ru: 'Лучшая скорость' };
      }
      if (el.classList.contains('rating-level')) {
        return { en: 'Rating level', ru: 'Уровень рейтинга' };
      }
      if (el.classList.contains('cars-count')) {
        return { en: 'Cars count', ru: 'Количество машин' };
      }
      if (el.classList.contains('friends-count')) {
        return { en: 'Friends count', ru: 'Количество друзей' };
      }
      return { en: '', ru: '' };
    },
    true
  );

} // showCachePanel END

function hideCachePanel() {
  const cachedUsersPanel = document.querySelector('.cached-users-panel');
  if (cachedUsersPanel) {
    triggerTargetElement(cachedUsersPanel, 'hide');
    triggerDimmingElement('hide');
  }
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
