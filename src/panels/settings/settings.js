import "./settings.scss";

// icons
import {
  settingsSVG,
  closeSVG,
  trashSVG,
  importSVG,
  saveSVG,
  exportSVG
} from "../../icons.js";

import { addPulseEffect } from "../../animations.js";
import { createCustomTooltip } from "../../components/tooltip.js";

// helpers && helpers definitions
import {
  removePreviousPanel
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

import { settingsConfig } from "./settingsConfig.js";
import { initializeSaveButtonLogic } from "./settingsSaveButton.js";
import { clearSettingsContainers, populateSettings } from "./settingsPopulator.js";

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
    await handleUploadSettings(event);
    clearSettingsContainers();
    populateSettings();
  });


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
  panelControlButtons.append(
    saveSettingsButton,
    importSettingsButton,
    exportSettingsButton,
    clearCacheButton,
    closePanelButton
  );

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