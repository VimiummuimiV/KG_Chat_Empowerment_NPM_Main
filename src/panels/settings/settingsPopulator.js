import { settingsConfig, toggleSettingsConfig } from "./settingsConfig.js";
import { getSettingsData } from "./settingsFileHandlers.js";
import { 
  createSpoilerContainer, 
  createAddButton, 
  createUserColorsContainer 
} from "./settingsCreators.js";
import { settingsTitles } from "./settingsTitles.js";
import { getCurrentLanguage } from "../../helpers/helpers.js";

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
    let container;

    if (type === 'userColors') {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      // Prevent creation if empty or absent
      if (!userData || Object.keys(userData).length === 0) return;
      container = createUserColorsContainer(userData, creator);
    } else if (type !== 'toggle') {
      // Standard container for tracked, mention, replacement, moderator, ignored
      container = document.createElement('div');
      container.className = `settings-${type}-container`;
      container.classList.add('settings-container');
      
      const items = data[key] || [];
      items.forEach(item => container.appendChild(creator(item)));
      const addButton = createAddButton(`.settings-${type}-container`, creator);
      container.appendChild(addButton);
    } else {
      // Toggle container
      container = document.createElement('div');
      container.className = `settings-${type}-container`;
      container.classList.add('settings-container');
      
      const storedToggleSettings = JSON.parse(localStorage.getItem(key)) || [];
      const lang = getCurrentLanguage();
      
      toggleSettingsConfig.forEach(toggle => {
        let optionValue = 'yes';
        
        if (toggle.type === 'language') {
          const storedSetting = storedToggleSettings.find(
            s => s.category === 'ui' && s.type === 'language'
          );
          optionValue = storedSetting ? storedSetting.option : 'en';
        } else {
          const storedSetting = storedToggleSettings.find(
            s => s.category === toggle.category && s.type === toggle.type
          );
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