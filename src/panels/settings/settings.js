import "./settings.scss";

// icons
import {
  settingsSVG,
  closeSVG,
  trashSVG,
  importSVG,
  saveSVG,
  exportSVG,
  addSVG
} from "../../icons.js";

import { addPulseEffect } from "../../animations.js";
import { createCustomTooltip } from "../../components/tooltip.js";

// helpers && helpers definitions
import {
  removePreviousPanel,
  getCurrentLanguage
} from "../../helpers/helpers.js";

import { isAltKeyPressed, isCtrlKeyPressed } from "../../helpers/hotkeyState.js";

import {
  triggerTargetElement,
  triggerDimmingElement
} from "../../helpers/elementVisibility.js";

import { createScrollButtons } from "../../helpers/scrollButtons.js";


import {
  handleUploadSettings,
  handleDownloadSettings,
  getSettingsData
} from "./settingsFileHandlers.js";

import { createSpoilerContainer, createTrackedItem } from "./settingsCreators.js";
import { settingsTitles } from "./settingsTitles.js";
import { settingsConfig, toggleSettingsConfig } from "./settingsConfig.js";
import { initializeSaveButtonLogic } from "./settingsSaveButton.js";

// definitions
import {
  defaultVoiceSpeed,
  defaultVoicePitch,
  myNickname,
  state
} from '../../definitions.js';

// Define dynamic variables
let {
  panelsEvents
} = state;

const stored = localStorage.getItem('KG_Chat_Empowerment');
export const KG_Chat_Empowerment = stored
  ? JSON.parse(stored)
  : {
    voiceSettings: { voiceSpeed: defaultVoiceSpeed, voicePitch: defaultVoicePitch },
    messageSettings: {},
  };

if (!stored) {
  localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));
}

// Declare and initialize all arrays dynamically
export const settingsState = Object.fromEntries(
  settingsConfig.map(config => [config.key, []])
);

// Load data from localStorage and populate arrays
settingsConfig.forEach(config => {
  const key = config.key;
  const stored = JSON.parse(localStorage.getItem(key)) || [];
  if (stored.length) {
    settingsState[key].splice(0, settingsState[key].length, ...stored);
  }
});

// Add myNickname to mentionKeywords after loading stored data
const mentionConfig = settingsConfig.find(config => config.type === 'mention');
if (typeof myNickname !== 'undefined' && myNickname && mentionConfig) {
  settingsState[mentionConfig.key].push(myNickname);
}


// Create a button to upload and apply new settings,
// receiving the parent panel as a parameter.
export function createSettingsButton(panel) {
  const showSettingsButton = document.createElement('div');
  showSettingsButton.classList.add("empowerment-button", "settings-button");

  createCustomTooltip(showSettingsButton, {
    en: 'Open Settings',
    ru: 'Открыть настройки'
  });
  showSettingsButton.style.position = 'relative';

  // Use the settings SVG from icons.js
  showSettingsButton.innerHTML = settingsSVG;

  const importFileInput = document.createElement('input');
  importFileInput.type = 'file';
  importFileInput.accept = '.json';
  importFileInput.style.display = 'none';

  importFileInput.addEventListener('change', handleUploadSettings);

  showSettingsButton.addEventListener('click', event => {
    addPulseEffect(showSettingsButton);
    if (isAltKeyPressed) handleDownloadSettings(getSettingsData());
    if (isCtrlKeyPressed) importFileInput.click();
    if (isAltKeyPressed || isCtrlKeyPressed) return;
    showSettingsPanel();
  });

  showSettingsButton.appendChild(importFileInput);

  // Append the settings button to the passed panel
  panel.appendChild(showSettingsButton);
}

// Function to display the settings panel
function showSettingsPanel() {
  // Check if the panel already exists
  const existingPanel = document.querySelector('.settings-panel');
  if (existingPanel) {
    existingPanel.remove(); // Remove the settings panel
    triggerDimmingElement('hide');
    return; // Return immediately to prevent further execution
  }

  // Remove any previous panel before creating a new one
  removePreviousPanel();

  // Create the settings panel container
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'settings-panel popup-panel';

  // Define the event handler function for settings panel
  panelsEvents.handleSettingsKeydown = (event) => { // Assign the function to the object
    if (event.key === 'Escape') {
      triggerTargetElement(settingsPanel, 'hide');
      triggerDimmingElement('hide');
      document.removeEventListener('keydown', panelsEvents.handleSettingsKeydown); // Remove the event listener
    }
  };

  // Attach the event listener
  document.addEventListener('keydown', panelsEvents.handleSettingsKeydown);

  // Create a container div for the panel header
  const panelHeaderContainer = document.createElement('div');
  panelHeaderContainer.className = 'panel-header';

  const panelControlButtons = document.createElement('div');
  panelControlButtons.classList.add("panel-control-buttons");

  // Create a close button with the provided SVG icon
  const closePanelButton = document.createElement('div');
  closePanelButton.className = 'large-button panel-header-close-button';
  closePanelButton.innerHTML = closeSVG;
  createCustomTooltip(closePanelButton, {
    en: 'Close panel',
    ru: 'Закрыть панель'
  });

  // Add a click event listener to the close panel button
  closePanelButton.addEventListener('click', () => {
    // Fade out the settings panel when the close button is clicked
    triggerTargetElement(settingsPanel, 'hide');
    triggerDimmingElement('hide');
  });

  // Create a clear cache button with the provided SVG icon
  const clearCacheButton = document.createElement('div');
  clearCacheButton.className = "large-button panel-header-clear-button";
  clearCacheButton.innerHTML = trashSVG;
  createCustomTooltip(clearCacheButton, {
    en: 'Clear settings',
    ru: 'Очистить настройки'
  });

  // Add a click event listener to the clear cache button
  clearCacheButton.addEventListener('click', () => {
    clearSettingsContainers();
  })

  // Create an import button with the provided SVG icon
  const importSettingsButton = document.createElement('div');
  importSettingsButton.className = "large-button panel-header-import-button";
  importSettingsButton.innerHTML = importSVG;
  createCustomTooltip(importSettingsButton, {
    en: 'Import settings',
    ru: 'Импортировать настройки'
  });

  // Create a save button with the provided SVG icon
  const saveSettingsButton = document.createElement('div');
  saveSettingsButton.className = "large-button panel-header-save-button";
  saveSettingsButton.innerHTML = saveSVG;
  createCustomTooltip(saveSettingsButton, {
    en: 'Save settings',
    ru: 'Сохранить настройки'
  });

  // Create a hidden file input for importing settings
  const importFileInput = document.createElement('input');
  importFileInput.type = 'file';
  importFileInput.accept = '.json'; // Specify the file type
  importFileInput.style.display = 'none'; // Hide the file input

  // Add an event listener for the import file input
  importFileInput.addEventListener('change', async (event) => {
    await handleUploadSettings(event); // Wait for processing uploaded settings
    // Clear the containers before populating new data
    clearSettingsContainers();
    // Populate the UI with updated settings
    populateSettings();
  });

  // Function to clear the content of settings containers
  function clearSettingsContainers() {
    // Generate container selectors from settingsConfig
    settingsConfig.forEach(config => {
      const container = document.querySelector(config.selector);
      if (container) {
        const addButton = container.querySelector('.add-settings-button');
        container.replaceChildren(); // Clear the container
        // Re-add the .add-settings-button if it was found
        addButton && container.appendChild(addButton);
      }
    });
  }

  // Add a click event listener to the import button
  importSettingsButton.addEventListener('click', () => {
    importFileInput.click(); // Trigger file input click
  });

  // Append the file input to the import button
  importSettingsButton.appendChild(importFileInput);

  // Create an export button with the provided SVG icon
  const exportSettingsButton = document.createElement('div');
  exportSettingsButton.className = "large-button panel-header-export-button";
  exportSettingsButton.innerHTML = exportSVG;
  createCustomTooltip(exportSettingsButton, {
    en: 'Export settings',
    ru: 'Экспортировать настройки'
  });

  // Example of how to use the getSettingsData function in the export event
  exportSettingsButton.addEventListener('click', function () {
    const settingsData = getSettingsData(); // Retrieve the settings data
    handleDownloadSettings(settingsData); // Pass the retrieved settings data to the download function
  });

  // Append the buttons to the panel header container
  panelControlButtons.appendChild(saveSettingsButton);
  panelControlButtons.appendChild(importSettingsButton);
  panelControlButtons.appendChild(exportSettingsButton);
  panelControlButtons.appendChild(clearCacheButton);
  panelControlButtons.appendChild(closePanelButton);

  panelHeaderContainer.appendChild(panelControlButtons);

  settingsPanel.appendChild(panelHeaderContainer);

  // Create a container for the settings content
  const settingsContainer = document.createElement('div');
  settingsContainer.className = 'settings-content-container';

  settingsConfig.forEach(({ type }) => {
    // Create the description container directly
    const container = document.createElement('div');
    container.className = `settings-${type}-container`;
    settingsContainer.appendChild(container);
  });

  // Append the settings content container to the settings panel
  settingsPanel.appendChild(settingsContainer);

  function populateSettings() {
    const data = getSettingsData(); // Retrieves the settings data
    const settingsContainer = document.querySelector('.settings-content-container'); // Main parent container (adjust if different)

    // Clear all existing spoiler containers first
    settingsContainer.innerHTML = '';

    settingsConfig.forEach(config => {
      const { key, creator, type } = config;

      // Create a fresh container for each type
      const container = document.createElement('div');
      container.className = `settings-${type}-container`;
      container.classList.add('settings-container');

      if (type !== 'toggle') {
        // For non-toggle settings, populate from stored data
        const items = data[key] || [];
        items.forEach(item => container.appendChild(creator(item)));
        const addButton = createAddButton(`.settings-${type}-container`, creator);
        container.appendChild(addButton);
      } else {
        // Inside your initialization logic (where you process toggle settings)
        const storedToggleSettings = JSON.parse(localStorage.getItem(key)) || [];
        const lang = getCurrentLanguage();
        toggleSettingsConfig.forEach(toggle => {
          // Find stored setting by category + type (not name)
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
          // Get localized description
          const localizedDescription = settingsTitles.toggleTitles[toggle.type][lang];
          const toggleItem = creator(toggle, optionValue, localizedDescription);
          container.appendChild(toggleItem);
        });
      }

      // Wrap the container in a spoiler for all settings types
      const spoiler = createSpoilerContainer(container, {
        type,
        showText: undefined, // Use localization
        hideText: undefined  // Use localization
      });
      settingsContainer.appendChild(spoiler);
    });
  }

  // Function to create an "Add" button for dynamic item creation
  function createAddButton(containerSelector, itemCreator) {
    const middleWord = containerSelector.split('-')[1]; // Extract key type (e.g., tracked, mention)
    const existingButton = document.querySelector(`.add-${middleWord}-item`); // Check if the button already exists
    // If the button exists, remove it
    if (existingButton) existingButton.remove();

    const addButton = document.createElement('div');
    // Set class, content, and style for the button
    addButton.className = `settings-button add-settings-button add-${middleWord}-item`;
    addButton.innerHTML = addSVG; // Add SVG icon to the button

    // On click, validate the last item and create a new one if valid
    addButton.addEventListener('click', () => {
      const container = document.querySelector(containerSelector); // Get the container element

      // Get all settings {type} items and select the last one
      const allItems = container.querySelectorAll(`.${middleWord}-item`);
      const lastItem = allItems.length > 0 ? allItems[allItems.length - 1] : null;

      // Check if the last item has any input fields
      const inputFields = lastItem ? lastItem.querySelectorAll('input') : []; // Get all input fields in the last item
      const hasEmptyFields = Array.from(inputFields).some(field => field.value.trim().length === 0); // Check for empty fields

      // Allow creation only if the last item has no empty fields (or if there are no items yet)
      const canCreateNewItem = !lastItem || !hasEmptyFields;

      if (canCreateNewItem) {
        // Create a new empty item based on the item creator function
        const emptyItem = itemCreator === createTrackedItem
          ? itemCreator({ name: '', pronunciation: '' }) // Remove gender from tracked item creation
          : itemCreator('');

        // Check if the new item is a valid HTMLElement before inserting
        if (emptyItem instanceof HTMLElement) {
          container.insertBefore(emptyItem, addButton); // Insert the new item before the Add button
        } else {
          console.error('Invalid item created.'); // Log an error if the item is not valid
        }
      } else {
        // Alert the user if the last item is filled
        alert('Please fill in the previous item before adding a new one.');
      }
    });

    return addButton; // Return the created button
  }

  // Create and append scroll buttons
  const { scrollButtonsContainer } = createScrollButtons(settingsContainer);
  settingsPanel.appendChild(scrollButtonsContainer);

  // Append the settings panel to the body
  document.body.appendChild(settingsPanel);

  // Call the function to populate settings on page load
  populateSettings();

  // Make save button work as expected
  initializeSaveButtonLogic(saveSettingsButton);

  // Fade in the settings panel and dimming background element
  triggerTargetElement(settingsPanel, 'show');
  triggerDimmingElement('show');
}