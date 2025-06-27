import "./cache.scss"

import {
  removePreviousPanel,
  debounce,
  getCurrentLanguage
} from "../../helpers/helpers.js";

import {
  setCacheRefreshTime,
  refreshFetchedUsers,
  updateRemainingTime
} from "./cacheHelpers.js";

import { createSortButtons } from "./cacheSort.js"

import {
  triggerTargetElement,
  triggerDimmingElement
} from "../../helpers/elementVisibility.js";

import { createScrollButtons } from "../../helpers/scrollButtons.js";

import {
  usersSVG,
  trashSVG,
  closeSVG
} from "../../icons.js";

import {
  cacheRefreshThresholdHours,
  debounceTimeout,
  state
} from "../../definitions.js";

import { createCustomTooltip } from "../../components/tooltip.js";

import { handleSearch, createUserContainer, createDescription } from "./cacheSearch.js";
import { createCachePanelUserElement } from "./cacheUserElement.js";
import { setupCacheTooltips } from "./cacheDelegatedTooltips.js";
import { setupCacheDelegatedEvents } from "./cacheDelegatedEvents.js";

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

// Function to display the cached user list panel
export function showCachePanel() {
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

  cacheSearchInput.addEventListener('input', debounce((event) => {
    const inputValue = event.target.value.trim();
    const searchMode = localStorage.getItem('cachePanelSearchMode');
    const username = inputValue.startsWith('user ') ? inputValue.substring(5).trim() : (searchMode === 'fetch' ? inputValue : '');
    if (username) handleSearch(username, createCachePanelUserElement);
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

  const closePanelButton = document.createElement('div');
  closePanelButton.className = 'large-button panel-header-close-button';
  createCustomTooltip(closePanelButton, {
    en: 'Close panel',
    ru: 'Закрыть панель'
  });
  closePanelButton.innerHTML = closeSVG;
  closePanelButton.addEventListener('click', hideCachePanel);

  panelControlButtons.append(clearCacheButton, closePanelButton);

  panelHeaderContainer.appendChild(panelControlButtons);

  const fetchedUsersContainer = document.createElement('div');
  fetchedUsersContainer.className = 'fetched-users';

  const oldUsersContainer = createUserContainer('old');
  const newUsersContainer = createUserContainer('new');

  // Create and store description elements using imported createDescription function
  const oldUsersDescription = createDescription(
    currentLanguage === 'en' ? 'Old Residents' : 'Постояльцы',
    'old-users-description'
  );
  oldUsersContainer.appendChild(oldUsersDescription);

  const newUsersDescription = createDescription(
    currentLanguage === 'en' ? 'New Residents' : 'Новобранцы',
    'new-users-description'
  );
  newUsersContainer.appendChild(newUsersDescription);

  fetchedUsersContainer.append(oldUsersContainer, newUsersContainer);

  const userElements = [];
  const currentDate = new Date();
  const isNewUser = registered => (currentDate - new Date(registered)) <= 24 * 60 * 60 * 1000;

  if (localStorage.getItem('cachePanelSearchMode') === 'cache') {
    Object.keys(users).forEach(userId => {
      const userData = users[userId];
      userElements.push(createCachePanelUserElement(userId, userData));
    });
    userElements.sort((a, b) => a.sortData.order !== b.sortData.order
      ? a.sortData.order - b.sortData.order
      : b.sortData.bestSpeed - a.sortData.bestSpeed);
    userElements.forEach(({ userElement, registered }) => {
      (isNewUser(registered) ? newUsersContainer : oldUsersContainer).appendChild(userElement);
    });
  }

  const sortButtonsContainer = createSortButtons(
    userElements,
    oldUsersContainer,
    newUsersContainer,
    isNewUser,
    oldUsersDescription,
    newUsersDescription
  );

  cachedUsersPanel.append(panelHeaderContainer, sortButtonsContainer, fetchedUsersContainer);
  const { scrollButtonsContainer } = createScrollButtons(fetchedUsersContainer);
  cachedUsersPanel.appendChild(scrollButtonsContainer);

  document.body.appendChild(cachedUsersPanel);

  triggerTargetElement(cachedUsersPanel, 'show');
  triggerDimmingElement('show');

  setInterval(updateRemainingTime, 1000);
  updateRemainingTime();

  // Setup delegated tooltips and events
  setupCacheTooltips(sortButtonsContainer, fetchedUsersContainer);
  setupCacheDelegatedEvents(fetchedUsersContainer);
}

function hideCachePanel() {
  const cachedUsersPanel = document.querySelector('.cached-users-panel');
  if (cachedUsersPanel) {
    triggerTargetElement(cachedUsersPanel, 'hide');
    triggerDimmingElement('hide');
  }
}
