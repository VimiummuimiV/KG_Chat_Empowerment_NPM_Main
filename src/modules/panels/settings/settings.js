import "./settings.scss" // settings styles

// icons
import {
  settingsSVG,
  closeSVG,
  trashSVG,
  importSVG,
  saveSVG,
  exportSVG,
  removeSVG,
  snowflakeSVG,
  addSVG
} from '../../icons.js';

import { addPulseEffect, addShakeEffect } from '../../animations.js'; // animations
import { createCustomTooltip } from "../../tooltip.js"; // tooltip

// helpers && helpers definitions
import {
  // helpers
  removePreviousPanel,
  createScrollButtons,
  debounce,
  triggerDimmingElement,
  triggerTargetElement,
  // helpers definitions
  isAltKeyPressed,
  isCtrlKeyPressed
} from '../../helpers.js';

// definitions
import {
  defaultVoiceSpeed,
  defaultVoicePitch,
  myNickname,
  debounceTimeout,
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

// Common function to attach click event for removing an item
function attachRemoveListener(removeButton, item) {
  removeButton.addEventListener('click', () => {
    item.remove();
  });
}

// Function to attach click event for toggling snowflake states
function attachSnowflakeListener(snowflakeButton, username) {
  snowflakeButton.addEventListener('click', () => {
    const isFrozen = snowflakeButton.classList.toggle('assigned-frozen-config');
    snowflakeButton.classList.toggle('assigned-thawed-config');
    snowflakeButton.style.opacity = isFrozen ? '1' : '0.3';
    updateUserState(username, isFrozen ? 'frozen' : 'thawed');
  });
}

// Helper function to create a container element
function createContainer(type) {
  const item = document.createElement('div');
  item.className = `${type}-item`;
  return item;
}

// Helper function to create an input element
function createInput(type, value = '', placeholder = '') {
  const input = document.createElement('input');
  input.className = `settings-field ${type}-field`;
  input.value = value;
  input.placeholder = placeholder;
  return input;
}

// Helper function to create a remove button
function createRemoveButton(type, item) {
  const removeButton = document.createElement('div');
  removeButton.className = `settings-button remove-settings-button remove-${type}-word`;
  removeButton.innerHTML = removeSVG;
  attachRemoveListener(removeButton, item);
  return removeButton;
}

// Helper function to create a snowflake button
function createSnowflakeButton(state = 'thawed', username) {
  const snowflakeButton = document.createElement('div');
  snowflakeButton.className = `settings-button assigned-settings-button assigned-${state}-config`;
  snowflakeButton.style.opacity = state === 'thawed' ? '0.3' : '1';
  snowflakeButton.innerHTML = snowflakeSVG;
  attachSnowflakeListener(snowflakeButton, username);
  return snowflakeButton;
}

// Function to update user state in localStorage
function updateUserState(username, state) {
  const usersData = localStorage.getItem("usersToTrack");
  if (usersData) {
    const updatedUsers = JSON.parse(usersData).map(user =>
      user.name === username ? { ...user, state } : user
    );
    localStorage.setItem("usersToTrack", JSON.stringify(updatedUsers));
  }
}

// Function to create a spoiler container
function createSpoilerContainer(contentElement, options = {}) {
  const container = document.createElement('div');
  container.classList.add("settings-spoiler");
  const toggleButton = document.createElement('button');
  toggleButton.textContent = options.showText || 'Show Content';
  contentElement.style.display = 'none';

  toggleButton.addEventListener('click', () => {
    const isHidden = contentElement.style.display === 'none';
    contentElement.style.display = isHidden ? 'flex' : 'none';
    toggleButton.textContent = isHidden
      ? (options.hideText || 'Hide Content')
      : (options.showText || 'Show Content');
  });

  container.appendChild(toggleButton);
  container.appendChild(contentElement);
  return container;
}

// Creator functions for settingsConfig
function createTrackedItem(user) {
  const item = createContainer('tracked', 'flex');
  const usernameInput = createInput('tracked-username', user.name, 'Username');
  const pronunciationInput = createInput('tracked-pronunciation', user.pronunciation, 'Pronunciation');
  const removeButton = createRemoveButton('tracked', item);
  const initialState = (user.state === 'frozen') ? 'frozen' : 'thawed';
  const snowflakeButton = createSnowflakeButton(initialState, user.name);

  const genderSelect = document.createElement('select');
  genderSelect.className = 'tracked-gender-select';
  const genders = [
    { value: 'Male', emoji: '👨' },
    { value: 'Female', emoji: '👩' },
  ];
  genders.forEach(({ value, emoji }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = `${emoji} ${value}`;
    if (user.gender === value) option.selected = true;
    genderSelect.appendChild(option);
  });

  item.appendChild(usernameInput);
  item.appendChild(genderSelect);
  item.appendChild(pronunciationInput);
  item.appendChild(removeButton);
  item.appendChild(snowflakeButton);
  return item;
}

function createMentionItem(keyword) {
  const item = createContainer('mention');
  const mentionInput = createInput('mention', keyword, 'Mention Keyword');
  const removeButton = createRemoveButton('mention', item);
  item.appendChild(mentionInput);
  item.appendChild(removeButton);
  return item;
}

function createReplacementItem(replacement = { original: '', replacement: '' }) {
  const item = createContainer('replacement');
  const originalInput = createInput('replacement-original', replacement.original, 'Original username');
  const replacementInput = createInput('replacement', replacement.replacement, 'Replacement name');
  const removeButton = createRemoveButton('replacement', item);
  item.appendChild(originalInput);
  item.appendChild(replacementInput);
  item.appendChild(removeButton);
  return item;
}

function createModeratorItem(moderator) {
  const item = createContainer('moderator');
  const moderatorInput = createInput('moderator', moderator, 'Moderator Name');
  const removeButton = createRemoveButton('moderator', item);
  item.appendChild(moderatorInput);
  item.appendChild(removeButton);
  return item;
}

function createIgnoredItem(user) {
  const item = createContainer('ignored');
  const ignoredInput = createInput('ignored', user, 'Ignored User');
  const removeButton = createRemoveButton('ignored', item);
  item.appendChild(ignoredInput);
  item.appendChild(removeButton);
  return item;
}

function createToggleItem(toggleConfig, optionValue) {
  const item = createContainer('toggle');
  if (toggleConfig.type === 'language') {
    const select = document.createElement('select');
    select.className = 'language-toggle-select';
    (toggleConfig.languages || []).forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = lang.label;
      if (optionValue === lang.value) option.selected = true;
      select.appendChild(option);
    });
    const label = document.createElement('span');
    label.className = 'toggle-description';
    label.textContent = toggleConfig.description;
    item.appendChild(select);
    item.appendChild(label);
    return item;
  }

  const select = document.createElement('select');
  select.className = 'toggle-select';

  const description = document.createElement('span');
  description.className = 'toggle-description';
  // Store category and type in data attributes
  description.dataset.category = toggleConfig.category;
  description.dataset.type = toggleConfig.type;
  description.textContent = toggleConfig.description;

  description.style.cursor = 'pointer';
  description.style.transition = 'color 0.15s ease-in-out';

  description.addEventListener('click', () => {
    if (toggleConfig.image) window.open(toggleConfig.image, '_blank');
  });

  const options = [
    { value: 'yes', emoji: '✔️' },
    { value: 'no', emoji: '❌' }
  ];
  options.forEach(({ value, emoji }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = `${emoji} ${value}`;
    select.appendChild(option);
  });
  select.value = optionValue;

  item.appendChild(select);
  item.appendChild(description);
  return item;
}

// 1. Define all settings keys in camelCase format
const settingsConfig = [
  {
    type: 'tracked',
    emoji: '👀',
    key: 'usersToTrack',
    selector: '.settings-tracked-container',
    creator: createTrackedItem
  },
  {
    type: 'mention',
    emoji: '📢',
    key: 'mentionKeywords',
    selector: '.settings-mention-container',
    creator: createMentionItem
  },
  {
    type: 'replacement',
    emoji: '♻️',
    key: 'usernameReplacements',
    selector: '.settings-replacement-container',
    creator: createReplacementItem
  },
  {
    type: 'moderator',
    emoji: '⚔️',
    key: 'moderator',
    selector: '.settings-moderator-container',
    creator: createModeratorItem
  },
  {
    type: 'ignored',
    emoji: '🛑',
    key: 'ignored',
    selector: '.settings-ignored-container',
    creator: createIgnoredItem
  },
  {
    type: 'toggle',
    emoji: '🔘',
    key: 'toggle',
    selector: '.settings-toggle-container',
    creator: createToggleItem
  }
];

// Process toggle settings separately with categorization and defaults
export const toggleSettingsConfig = [
  {
    description: '👀 Show chat static notifications',
    image: 'https://i.imgur.com/oUPSi9I.jpeg',
    category: 'notifications',
    type: 'static'
  },
  {
    description: '👀 Show global dynamic notifications',
    image: 'https://i.imgur.com/8ffCdUG.jpeg',
    category: 'notifications',
    type: 'dynamic'
  },
  {
    description: '🔊 Play a beep sound and speak feedback when the user enters or leaves the chat',
    image: 'https://i.imgur.com/6PXFIES.jpeg',
    category: 'sound',
    type: 'presence'
  },
  {
    description: '🔊 Switch to google TTS engine if available',
    image: 'https://i.imgur.com/0H94LII.jpeg',
    category: 'sound',
    type: 'gTTS'
  },
  {
    description: '📦️ Create participants counter',
    image: 'https://i.imgur.com/rqIVAgH.jpeg',
    category: 'elements',
    type: 'counter'
  },
  {
    description: '🌐 Interface language',
    image: '',
    category: 'ui',
    type: 'language',
    languages: [
      { value: 'en', label: '🇬🇧 English' },
      { value: 'ru', label: '🇷🇺 Русский' }
    ]
  }
];

// 2. Declare and initialize all arrays dynamically
export const settingsState = Object.fromEntries(
  settingsConfig.map(config => [config.key, []])
);

// 3. Load data from localStorage and populate arrays
settingsConfig.forEach(config => {
  const key = config.key;
  const stored = JSON.parse(localStorage.getItem(key)) || [];
  if (stored.length) {
    settingsState[key].splice(0, settingsState[key].length, ...stored);
  }
});

// 4. Add myNickname to mentionKeywords after loading stored data
const mentionConfig = settingsConfig.find(config => config.type === 'mention');
if (typeof myNickname !== 'undefined' && myNickname && mentionConfig) {
  settingsState[mentionConfig.key].push(myNickname);
}

// Global function to handle file input and process uploaded settings
async function handleUploadSettings(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    // Return a Promise to handle the asynchronous reading
    return new Promise((resolve, reject) => {
      reader.onload = function (e) {
        const jsonData = e.target.result; // Get the raw JSON string
        try {
          const settingsData = JSON.parse(jsonData); // Attempt to parse the JSON data
          // Call a function to process the uploaded settings data
          processUploadedSettings(settingsData);
          resolve(); // Resolve the promise if successful
        } catch (error) {
          console.error('Error parsing JSON data:', error.message); // Log the error message
          console.error('Invalid JSON:', jsonData); // Log the raw JSON string for debugging
          // Optional: Notify the user about the error
          alert('Failed to parse JSON data. Please check the format and try again.');
          reject(error); // Reject the promise on error
        }
      };

      reader.onerror = function (e) {
        console.error('Error reading file:', e.target.error); // Handle file reading errors
        reject(e.target.error); // Reject the promise on error
      };

      reader.readAsText(file); // Read the file as text
    });
  }
}

function handleDownloadSettings(settingsData) {
  if (!settingsData || typeof settingsData !== 'object') {
    console.error('Invalid settings data for download.');
    alert('Cannot export settings. Please try again.');
    return;
  }

  try {
    const tabSize2 = '  ';
    const tabSize4 = '    ';
    let jsonData = '{\n';

    // Iterate over settingsConfig to build each key-value pair dynamically
    settingsConfig.forEach((config, index) => {
      const key = config.key;
      const data = settingsData[key];
      let formattedValue = '';

      if (Array.isArray(data)) {
        // Format each array element using JSON.stringify with proper indentation.
        formattedValue = `[\n${data
          .map(item => `${tabSize4}${JSON.stringify(item)}`)
          .join(',\n')}\n${tabSize2}]`;
      } else {
        // For non-array values, simply stringify them.
        formattedValue = JSON.stringify(data);
      }

      // Append the formatted key-value pair
      jsonData += `${tabSize2}"${key}": ${formattedValue}`;
      if (index < settingsConfig.length - 1) {
        jsonData += ',\n';
      } else {
        jsonData += '\n';
      }
    });

    jsonData += '}';

    // Generate filename with current date
    const currentDate = new Intl.DateTimeFormat('en-CA').format(new Date());
    const filename = `KG_Chat_Empowerment_Settings_${currentDate}.json`;

    // Create blob and trigger download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = filename;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting settings:', error);
    alert('Failed to export settings. Please try again.');
  }
}

export function getSettingsData() {
  return Object.fromEntries(settingsConfig.map(config => [config.key, JSON.parse(localStorage.getItem(config.key)) || []]));
}

// Create a button to upload and apply new settings,
// receiving the parent panel as a parameter.
export function createSettingsButton(panel) {
  const showSettingsButton = document.createElement('div');
  showSettingsButton.classList.add("empowerment-button", "settings-button");

  createCustomTooltip(showSettingsButton, {
    en: 'Show Settings Panel',
    ru: 'Открыть панель настроек'
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

function saveSettingsToLocalStorage() {
  settingsConfig.forEach(config => {
    localStorage.setItem(config.key, JSON.stringify(settingsState[config.key]));
  });
}

// Process and apply uploaded settings dynamically
function processUploadedSettings(uploadedSettings) {
  // Iterate over settingsConfig and apply uploaded values dynamically
  settingsConfig.forEach(config => {
    if (Array.isArray(uploadedSettings[config.key])) {
      settingsState[config.key] = uploadedSettings[config.key];
    }
  });

  // Save the updated settings to localStorage
  saveSettingsToLocalStorage();

  // Log the updated settings
  console.log('Uploaded settings applied:', settingsState);
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

  function initializeSaveButtonLogic(saveButton) {
    const container = document.querySelector('.settings-content-container');
    if (!container) return console.error("Container not found.");

    const showButton = () => {
      saveButton.style.visibility = 'visible'; // Make the element interactable
      saveButton.style.display = 'flex'; // Set display to flex to reveal it
      setTimeout(() => {
        saveButton.style.opacity = '1'; // Gradually change opacity
      }, 10); // Small delay to trigger the transition
    };

    const hideButton = () => {
      saveButton.style.opacity = '0'; // Fade out
      setTimeout(() => {
        saveButton.style.visibility = 'hidden'; // Hide the element after fading out
        saveButton.style.display = 'none'; // Hide the element from layout
      }, 300); // Match the transition duration for smooth disappearance
    };

    // Get previous values from localStorage
    const previousValues = getSettingsData();

    const handleInputChange = () => {
      // Dynamically create the currentValues object with empty arrays
      const currentValues = {};
      settingsConfig.forEach(config => {
        currentValues[config.key] = [];
      });

      // Process tracked items
      container.querySelectorAll('.settings-tracked-container .tracked-item').forEach(item => {
        const usernameField = item.querySelector('.tracked-username-field');
        const genderField = item.querySelector('.tracked-gender-select');
        const pronunciationField = item.querySelector('.tracked-pronunciation-field');
        const snowflakeButton = item.querySelector('.assigned-thawed-config, .assigned-frozen-config');

        const usernameValue = usernameField ? usernameField.value.trim() : '';
        const genderValue = genderField ? genderField.value.trim() : '';
        const pronunciationValue = pronunciationField ? pronunciationField.value.trim() : '';
        // Determine the state based on the button's class
        const state = snowflakeButton.classList.contains('assigned-frozen-config') ? 'frozen' : 'thawed';

        // Push current values to usersToTrack
        currentValues.usersToTrack.push({
          name: usernameValue,
          gender: genderValue,
          pronunciation: pronunciationValue,
          state
        });
      });

      // Create a set of tracked usernames (case-insensitive)
      const trackedNames = new Set(
        currentValues.usersToTrack.map(user => user.name.toLowerCase())
      );

      // Process mention items
      container.querySelectorAll('.settings-mention-container .mention-item').forEach(item => {
        const mentionField = item.querySelector('.mention-field');
        const mentionValue = mentionField ? mentionField.value.trim() : '';
        currentValues.mentionKeywords.push(mentionValue);
      });

      // Process replacement items
      container.querySelectorAll('.settings-replacement-container .replacement-item').forEach(item => {
        const originalField = item.querySelector('.replacement-original-field');
        const replacementField = item.querySelector('.replacement-field');
        const originalValue = originalField ? originalField.value.trim() : '';
        const replacementValue = replacementField ? replacementField.value.trim() : '';

        // If the original value exists in tracked users, prevent creating a new replacement item.
        if (trackedNames.has(originalValue.toLowerCase())) {
          // Optionally, mark the field as invalid to notify the user.
          originalField.classList.add('input-error');
          addShakeEffect(originalField);
          return; // Skip pushing this replacement item.
        } else {
          originalField.classList.remove('input-error');
        }

        currentValues.usernameReplacements.push({
          original: originalValue,
          replacement: replacementValue
        });
      });

      // Process moderator
      container.querySelectorAll('.settings-moderator-container .moderator-item').forEach(item => {
        const moderatorField = item.querySelector('.moderator-field');
        const moderatorValue = moderatorField ? moderatorField.value.trim() : '';
        currentValues.moderator.push(moderatorValue);
      });

      // Process ignored items
      container.querySelectorAll('.settings-ignored-container .ignored-item').forEach(item => {
        const ignoredField = item.querySelector('.ignored-field');
        const ignoredValue = ignoredField ? ignoredField.value.trim() : '';
        currentValues.ignored.push(ignoredValue);
      });

      // In your save logic where you process toggle items
      container.querySelectorAll('.settings-toggle-container .toggle-item').forEach(item => {
        const descriptionElement = item.querySelector('.toggle-description');
        const selectElement = item.querySelector('select');
        if (descriptionElement && descriptionElement.textContent.includes('Interface language')) {
          currentValues.toggle.push({
            category: 'ui',
            type: 'language',
            option: selectElement.value
          });
        } else {
          const selectedValue = selectElement?.value.trim() || 'no';
          currentValues.toggle.push({
            category: descriptionElement.dataset.category,
            type: descriptionElement.dataset.type,
            option: selectedValue
          });
        }
      });

      // Check if any values have changed compared to previous state
      const valuesChanged = JSON.stringify(previousValues) !== JSON.stringify(currentValues);

      // Show or hide the save button based on whether values have changed
      valuesChanged ? showButton() : hideButton();

      return currentValues; // Return current values for saving later
    };

    // Attach click event to save settings when there are changes
    saveButton.addEventListener('click', () => {
      const currentValues = handleInputChange(); // Get current values before saving
      processUploadedSettings(currentValues); // Process and save the current settings
      // Update previousValues to the current state after saving
      Object.assign(previousValues, currentValues);
      hideButton(); // Optionally hide the button after saving
    });

    // Add input listeners to existing fields
    container.querySelectorAll('input, select').forEach(field => {
      field.addEventListener('input', handleInputChange);
    });

    // Function to attach event listeners to dynamically added input and select elements
    const attachEventListeners = (element) => {
      if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
        element.addEventListener('input', handleInputChange);
        // console.log('Listener attached to:', element);
      } else {
        // Check its children for input or select elements
        element.querySelectorAll('input, select').forEach((child) => {
          child.addEventListener('input', handleInputChange);
          // console.log('Listener attached to child:', child);
        });
      }
    };

    // Create a mutation observer to monitor changes in the target container
    const observer = new MutationObserver(debounce((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // console.log('Added:', node);
              attachEventListeners(node); // Attach event listeners to new elements
            }
          });

          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // console.log('Removed:', node);
              handleInputChange(); // Call handleInputChange to check the state after any changes
            }
          });
        }
      });
    }, debounceTimeout));

    // Start observing the target container for child list changes
    observer.observe(container, {
      childList: true,
      subtree: true, // Observe all descendants as well
    });
  }

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

    settingsConfig.forEach(config => {
      const { key, selector, creator, type, emoji } = config;
      const container = document.querySelector(selector);
      if (!container) return;

      container.classList.add('settings-container');

      // Clear existing items, preserving the add button if it exists
      const existingAddButton = container.querySelector('.add-settings-button');
      while (container.firstChild) {
        if (container.firstChild !== existingAddButton) {
          container.removeChild(container.firstChild);
        } else {
          break;
        }
      }

      if (type !== 'toggle') {
        // For non-toggle settings, populate from stored data
        const items = data[key] || [];
        items.forEach(item => container.appendChild(creator(item)));
        const addButton = createAddButton(selector, creator);
        container.appendChild(addButton);
      } else {
        // Inside your initialization logic (where you process toggle settings)
        const storedToggleSettings = JSON.parse(localStorage.getItem(key)) || [];
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
          const toggleItem = createToggleItem(toggle, optionValue);
          container.appendChild(toggleItem);
        });
      }

      // Wrap the container in a spoiler for all settings types
      const spoiler = createSpoilerContainer(container, {
        showText: `${emoji} Show ${type}`,
        hideText: `${emoji} Hide ${type}`
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