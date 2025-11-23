import { settingsConfig, toggleSettingsConfig } from "./settingsConfig.js";
import { getSettingsData } from "./settingsFileHandlers.js";
import { createSpoilerContainer, createAddButton } from "./settingsCreators.js";
import { createCustomTooltip } from "../../components/tooltip.js";
import { removeSVG } from "../../icons.js";
import { settingsTitles } from "./settingsTitles.js";
import { getCurrentLanguage, debounce } from "../../helpers/helpers.js";

export function clearSettingsContainers() {
  settingsConfig.forEach(config => {
    const container = document.querySelector(config.selector);
    if (container) {
      const addButton = container.querySelector('.add-settings-button');
      container.replaceChildren();
      if (addButton) container.appendChild(addButton);
    }
  });
}

export function populateSettings() {
  const data = getSettingsData();
  const settingsContainer = document.querySelector('.settings-content-container');
  settingsContainer.innerHTML = '';

  settingsConfig.forEach(config => {
    const { key, creator, type } = config;
    const container = document.createElement('div');
    container.className = `settings-${type}-container`;
    container.classList.add('settings-container');

    if (type === 'userColors') {
      // Handle userColors separately - load userData once and pass it to creators
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      let usernames = Object.keys(userData);
      
      // Sort by changeDate timestamp (newest first), then alphabetically
      usernames.sort((a, b) => {
        const aUser = userData[a] && userData[a].change === 'user';
        const bUser = userData[b] && userData[b].change === 'user';
        
        // Both have user changes - sort by date (newest first)
        if (aUser && bUser) {
          const aDate = userData[a].changeDate || 0;
          const bDate = userData[b].changeDate || 0;
          if (aDate !== bDate) return bDate - aDate; // Descending order (newest first)
          return a.localeCompare(b); // Fallback to alphabetical
        }
        
        // One has user changes - prioritize it
        if (aUser !== bUser) return aUser ? -1 : 1;
        
        // Neither has user changes - sort alphabetically
        return a.localeCompare(b);
      });

      const searchContainer = document.createElement('div');
      searchContainer.className = 'userColors-search-container';
      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      searchInput.className = 'settings-field userColors-search-field';
      searchInput.placeholder = settingsTitles.placeholderTitles.userColors?.search?.[getCurrentLanguage()] || 'Search';
      searchContainer.appendChild(searchInput);

      // Trash button to clear all userData
      const trashButton = document.createElement('div');
      trashButton.className = 'settings-button remove-settings-button clear-userData-button';
      trashButton.innerHTML = removeSVG;
      createCustomTooltip(trashButton, {
        en: `
          [Click] Remove unsaved user colors
          [Ctrl + Click] Remove ALL user colors
        `,
        ru: `
          [Клик] Удалить несохранённые цвета пользователей
          [Ctrl + Клик] Удалить все цвета пользователей
        `
      });
      trashButton.addEventListener('click', (e) => {
        const lang = getCurrentLanguage();
        const isCtrl = e.ctrlKey || e.metaKey;
        const confirmText = isCtrl
          ? settingsTitles.actionTitles?.userColors?.confirmAll?.[lang]
          : settingsTitles.actionTitles?.userColors?.confirm?.[lang];
        if (!confirm(confirmText)) return;

        // Load current userData
        let current = {};
        try { current = JSON.parse(localStorage.getItem('userData') || '{}'); } catch (err) { current = {}; }

        if (isCtrl) {
          // Remove everything
          try { localStorage.removeItem('userData'); } catch (err) {}
          // Remove all DOM items
          const items = itemsWrapper.querySelectorAll('.userColors-item');
          items.forEach(it => it.remove());
          return;
        }

        // Otherwise remove only entries that are NOT marked as changed by user
        try {
          Object.keys(current).forEach(k => {
            if (!(current[k] && current[k].change === 'user')) delete current[k];
          });
          localStorage.setItem('userData', JSON.stringify(current));
        } catch (err) {}

        // Remove DOM items for removed keys
        const items = itemsWrapper.querySelectorAll('.userColors-item');
        items.forEach(it => {
          const name = it.dataset.username;
          if (!name) return;
          if (!(current[name] && current[name].change === 'user')) it.remove();
        });
      });
      searchContainer.appendChild(trashButton);
      container.appendChild(searchContainer);

      // Bottom: items wrapper (grid handled in SCSS)
      const itemsWrapper = document.createElement('div');
      itemsWrapper.className = 'settings-userColors-items-container';

      usernames.forEach(username => {
        const item = creator(username, userData);
        if (item && item instanceof HTMLElement) item.dataset.username = username;
        itemsWrapper.appendChild(item);
      });

      container.appendChild(itemsWrapper);

      // Debounced filter toggling CSS class to hide non-matches
      const filter = debounce((e) => {
        const q = (e.target.value || '').trim().toLowerCase();
        const items = itemsWrapper.querySelectorAll('.userColors-item');
        items.forEach(it => {
          const name = (it.dataset.username || '').toLowerCase();
          if (q === '' || name.includes(q)) it.classList.remove('userColors-hidden');
          else it.classList.add('userColors-hidden');
        });
      }, 150);
      searchInput.addEventListener('input', filter);
    } else if (type !== 'toggle') {
      const items = data[key] || [];
      items.forEach(item => container.appendChild(creator(item)));
      const addButton = createAddButton(`.settings-${type}-container`, creator);
      container.appendChild(addButton);
    } else {
      const storedToggleSettings = JSON.parse(localStorage.getItem(key)) || [];
      const lang = getCurrentLanguage();
      toggleSettingsConfig.forEach(toggle => {
        const storedSetting = storedToggleSettings.find(
          s => s.category === toggle.category && s.type === toggle.type
        );
        let optionValue = 'yes';
        if (toggle.type === 'language') {
          const storedSetting = storedToggleSettings.find(s => s.category === 'ui' && s.type === 'language');
          optionValue = storedSetting ? storedSetting.option : 'en';
        } else {
          optionValue = storedSetting ? storedSetting.option : 'yes';
        }
        const localizedDescription = settingsTitles.toggleTitles[toggle.type][lang];
        const toggleItem = creator(toggle, optionValue, localizedDescription);
        container.appendChild(toggleItem);
      });
    }

    const spoiler = createSpoilerContainer(container, {
      type,
      showText: undefined,
      hideText: undefined
    });
    settingsContainer.appendChild(spoiler);
  });
}
