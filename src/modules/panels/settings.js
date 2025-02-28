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
} from '../icons.js';

import { addPulseEffect } from '../animations.js'; // animations

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
} from '../helpers.js';

// definitions
import {
  myNickname,
  debounceTimeout,
  state
} from '../definitions.js';

// Define dynamic variables
let {
  panelsEvents
} = state;

// 1. First declare and initialize all arrays as empty
export let usersToTrack = [];
export let mentionKeywords = [];
export let usernameReplacements = [];
export let moderator = [];
export let ignored = [];
export let toggle = [];

// 2. Create settings map AFTER array declarations
const settingsMap = [
  ['usersToTrack', usersToTrack],
  ['mentionKeywords', mentionKeywords],
  ['usernameReplacements', usernameReplacements],
  ['moderator', moderator],
  ['ignored', ignored]
];

// 3. Load data from localStorage and immediately fill the arrays with the stored data
settingsMap.forEach(([key, arr]) => {
  const stored = JSON.parse(localStorage.getItem(key)) || [];
  if (stored.length) {
    arr.splice(0, arr.length, ...stored);  // Clear existing data and fill with stored data
  }
});

// 4. Add myNickname to mentionKeywords after loading stored data
// (Assuming myNickname is defined elsewhere)
mentionKeywords.push(myNickname);


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

    // Format usersToTrack
    const usersToTrackFormatted = settingsData.usersToTrack
      .map((user) => `${tabSize4}${JSON.stringify(user)}`)
      .join(',\n');

    // Format username replacements
    const replacementsFormatted = settingsData.usernameReplacements
      ?.map(replacement => `${tabSize4}${JSON.stringify(replacement)}`)
      .join(',\n') || '';

    // Format toggle settings
    const toggleFormatted = settingsData.toggle
      .map(toggle => `${tabSize4}${JSON.stringify(toggle)}`)
      .join(',\n');

    // Build JSON structure
    const jsonData = '{\n' +
      `${tabSize2}"usersToTrack": [\n` +
      `${usersToTrackFormatted}\n` +
      `${tabSize2}],\n` +
      `${tabSize2}"mentionKeywords": [\n` +
      `${settingsData.mentionKeywords.map(keyword => `${tabSize4}"${keyword}"`).join(',\n')}\n` +
      `${tabSize2}],\n` +
      `${tabSize2}"usernameReplacements": [\n` + // Added replacements section
      `${replacementsFormatted}\n` +
      `${tabSize2}],\n` +
      `${tabSize2}"moderator": [\n` +
      `${settingsData.moderator.map(moderator => `${tabSize4}"${moderator}"`).join(',\n')}\n` +
      `${tabSize2}],\n` +
      `${tabSize2}"ignored": [\n` +
      `${settingsData.ignored.map(user => `${tabSize4}"${user}"`).join(',\n')}\n` +
      `${tabSize2}],\n` +
      `${tabSize2}"toggle": [\n` +
      `${toggleFormatted}\n` +
      `${tabSize2}]\n` +
      '}';

    // Generate filename
    const currentDate = new Intl.DateTimeFormat('en-CA').format(new Date());
    const filename = `KG_Chat_Empowerment_Settings_${currentDate}.json`;

    // Create and trigger download
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

// Function to retrieve settings from localStorage and combine them into a single object
function getSettingsData() {
  // Retrieve data from localStorage using the appropriate keys
  const usersToTrack = JSON.parse(localStorage.getItem('usersToTrack')) || [];
  const mentionKeywords = JSON.parse(localStorage.getItem('mentionKeywords')) || [];
  const usernameReplacements = JSON.parse(localStorage.getItem('usernameReplacements')) || [];
  const moderator = JSON.parse(localStorage.getItem('moderator')) || [];
  const ignored = JSON.parse(localStorage.getItem('ignored')) || [];
  const toggle = JSON.parse(localStorage.getItem('toggle')) || [];

  // Combine the retrieved data into a single object
  const settingsData = {
    usersToTrack: usersToTrack,
    mentionKeywords: mentionKeywords,
    usernameReplacements: usernameReplacements,
    moderator: moderator,
    ignored: ignored,
    toggle: toggle
  };

  return settingsData;
}

// Create a button to upload and apply new settings,
// receiving the parent panel as a parameter.
export function createSettingsButton(panel) {
  const showSettingsButton = document.createElement('div');
  showSettingsButton.classList.add("empowerment-button", "settings-button");

  showSettingsButton.title = 'Show Settings Panel';
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

// Save the current settings to localStorage
function saveSettingsToLocalStorage() {
  localStorage.setItem('usersToTrack', JSON.stringify(usersToTrack));
  localStorage.setItem('mentionKeywords', JSON.stringify(mentionKeywords));
  localStorage.setItem('usernameReplacements', JSON.stringify(usernameReplacements));
  localStorage.setItem('moderator', JSON.stringify(moderator));
  localStorage.setItem('ignored', JSON.stringify(ignored));
  localStorage.setItem('toggle', JSON.stringify(toggle));
}

// Process and apply uploaded settings
function processUploadedSettings({
  usersToTrack: u = [],
  mentionKeywords: mk = [],
  usernameReplacements: ur = [],
  moderator: md = [],
  ignored: i = [],
  toggle: t = []
}) {
  // Ensure the uploaded values are valid arrays
  usersToTrack = Array.isArray(u) ? u : usersToTrack;
  mentionKeywords = Array.isArray(mk) ? mk : mentionKeywords;
  usernameReplacements = Array.isArray(ur) ? ur : usernameReplacements;
  moderator = Array.isArray(md) ? md : moderator;
  ignored = Array.isArray(i) ? i : ignored;
  toggle = Array.isArray(t) ? t : toggle;

  // Save to localStorage after applying the settings
  saveSettingsToLocalStorage();
  console.log('Uploaded settings applied:', {
    usersToTrack,
    mentionKeywords,
    usernameReplacements, // Added to log
    moderator,
    ignored,
    toggle
  });
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
  closePanelButton.title = 'Close panel';

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
  clearCacheButton.title = 'Clear settings';

  // Add a click event listener to the clear cache button
  clearCacheButton.addEventListener('click', () => {
    clearSettingsContainers();
  })

  // Create an import button with the provided SVG icon
  const importSettingsButton = document.createElement('div');
  importSettingsButton.className = "large-button panel-header-import-button";
  importSettingsButton.innerHTML = importSVG;
  importSettingsButton.title = 'Import settings';

  // Create a save button with the provided SVG icon
  const saveSettingsButton = document.createElement('div');
  saveSettingsButton.className = "large-button panel-header-save-button";
  saveSettingsButton.innerHTML = saveSVG;
  saveSettingsButton.title = 'Save settings';

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
      const currentValues = {
        usersToTrack: [],
        mentionKeywords: [],
        usernameReplacements: [],
        moderator: [],
        ignored: [],
        toggle: []
      };

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

      // Process toggle (yes/no) settings based on select elements within each toggle-setting item
      container.querySelectorAll('.settings-toggle-container .toggle-item').forEach(item => {
        const descriptionElement = item.querySelector('.toggle-description'); // Get the description element
        const selectElement = item.querySelector('.toggle-select'); // Select the toggle (select) element within the current toggle-item
        const selectedValue = selectElement ? selectElement.value.trim() : 'no'; // Default to 'no' if not selected

        // Get the data-toggle-name attribute value from the descriptionElement
        const toggleName = descriptionElement.getAttribute('data-toggle-name');

        // Push the current toggle setting as an object into the toggle array
        if (toggleName) {
          currentValues.toggle.push({
            name: toggleName, // Store the toggle name
            option: selectedValue // Store the selected value directly
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
    const containers = [
      '.settings-tracked-container',
      '.settings-mention-container',
      '.settings-replacement-container',
      '.settings-moderator-container',
      '.settings-ignored-container',
      '.settings-toggle-container'
    ];

    containers.forEach(selector => {
      const container = document.querySelector(selector);
      if (container) container.replaceChildren(); // Clear the container

      const addButton = container.querySelector('.add-settings-button');
      // Re-add the .add-settings-button if it was found
      addButton && container.appendChild(addButton);
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
  exportSettingsButton.title = 'Export settings';

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

  // Array of settings types with corresponding emoji
  const settingsTypes = [
    { type: 'tracked', emoji: '👀' },
    { type: 'mention', emoji: '📢' },
    { type: 'replacement', emoji: '♻️' },
    { type: 'moderator', emoji: '⚔️' },
    { type: 'ignored', emoji: '🛑' },
    { type: 'toggle', emoji: '🔘' }
  ];

  settingsTypes.forEach(({ type, emoji }) => {
    const description = document.createElement('div');
    description.className = `settings-${type}-description settings-description`; // Add specific class and settings-description

    // Create the description container directly
    const container = document.createElement('div');
    container.className = `settings-${type}-container`;

    // Set the text content with first letter capitalized and append emoji
    description.textContent = `${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} ${emoji}`;

    settingsContainer.appendChild(description);
    settingsContainer.appendChild(container);
  });

  // Append the settings content container to the settings panel
  settingsPanel.appendChild(settingsContainer);

  // Applies common styles to a select element and its options
  function styleSelect(select) {
    select.style.height = '30px';
    select.style.maxWidth = '120px';
    select.style.minWidth = '105px';
    select.style.padding = '0.4em';
    select.style.font = '1em Montserrat';
    select.style.fontFamily = 'Montserrat';
    select.style.setProperty('color', 'bisque', 'important');
    select.style.setProperty('border-radius', '0.2em', 'important');
    select.style.boxSizing = 'border-box';
    select.style.setProperty('background-color', 'rgb(17,17,17)', 'important');
    select.style.setProperty('border', '1px solid rgb(34,34,34)', 'important');

    // Style each option element
    Array.from(select.options).forEach(option => {
      option.style.height = '30px';
      option.style.setProperty('background-color', 'rgb(17,17,17)', 'important');
      option.style.setProperty('color', 'bisque', 'important');
      option.style.fontFamily = 'Montserrat';
    });
  }

  // Common function to attach click event for removing an item
  function attachRemoveListener(removeButton, item) {
    removeButton.addEventListener('click', () => {
      item.remove(); // Remove the parent element
    });
  }

  // Function to attach click event for toggling between "assigned-thawed-config" and "assigned-frozen-config"
  function attachSnowflakeListener(snowflakeButton, username) {
    snowflakeButton.addEventListener('click', () => {
      const isFrozen = snowflakeButton.classList.toggle('assigned-frozen-config');
      snowflakeButton.classList.toggle('assigned-thawed-config');

      // Set opacity based on the assigned class
      snowflakeButton.style.opacity = isFrozen ? '1' : '0.3';

      // Update localStorage using the helper function
      updateUserState(username, isFrozen ? 'frozen' : 'thawed');
    });
  }

  // Helper function to create a container element
  function createContainer(type, layout = 'inline-flex') {
    const item = document.createElement('div');
    item.className = `${type}-item`;
    item.style.display = layout;
    item.style.gap = '0.5em';
    item.style.padding = '0.25em';
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

  // Helper function to create a remove button with styles and event listener
  function createRemoveButton(type, item) {
    const removeButton = document.createElement('div');
    removeButton.className = `settings-button remove-settings-button remove-${type}-word`;
    removeButton.innerHTML = removeSVG;
    attachRemoveListener(removeButton, item);
    return removeButton;
  }

  // Helper function to create a snowflake button with styles and event listener
  function createSnowflakeButton(state = 'thawed', username) {
    const snowflakeButton = document.createElement('div');
    snowflakeButton.className = `settings-button assigned-settings-button assigned-${state}-config`;

    // Set initial opacity based on the state
    snowflakeButton.style.opacity = state === 'thawed' ? '0.3' : '1';
    snowflakeButton.innerHTML = snowflakeSVG;

    attachSnowflakeListener(snowflakeButton, username); // Pass username here
    return snowflakeButton;
  }

  // Function to update a specific user in localStorage to add the state property
  function updateUserState(username, state) {
    const usersData = localStorage.getItem("usersToTrack");
    if (usersData) {
      const updatedUsers = JSON.parse(usersData).map(user =>
        user.name === username ? { ...user, state } : user
      );
      localStorage.setItem("usersToTrack", JSON.stringify(updatedUsers));
    }
  }

  // Function to create a spoiler container (as provided)
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

  // Function to create a tracked item (with gender select)
  function createTrackedItem(user) {
    const item = createContainer('tracked', 'flex');

    const usernameInput = createInput('tracked-username', user.name, 'Username');
    const pronunciationInput = createInput('tracked-pronunciation', user.pronunciation, 'Pronunciation');
    const removeButton = createRemoveButton('tracked', item);

    // Set the initial state based on the user's state property, defaulting to 'thawed' if it doesn't exist
    const initialState = (user.state === 'frozen') ? 'frozen' : 'thawed';
    const snowflakeButton = createSnowflakeButton(initialState, user.name); // Pass username

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
    styleSelect(genderSelect);

    item.appendChild(usernameInput);
    item.appendChild(genderSelect);
    item.appendChild(pronunciationInput);
    item.appendChild(removeButton);
    item.appendChild(snowflakeButton);

    return item;
  }

  // Function to create a mention item
  function createMentionItem(keyword) {
    const item = createContainer('mention');
    const mentionInput = createInput('mention', keyword, 'Mention Keyword');
    const removeButton = createRemoveButton('mention', item);

    item.appendChild(mentionInput);
    item.appendChild(removeButton);

    return item;
  }

  // Function to create a username replacement item for text to speech API
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

  // Function to create a moderator item
  function createModeratorItem(moderator) {
    const item = createContainer('moderator');
    const moderatorInput = createInput('moderator', moderator, 'Moderator Name');
    const removeButton = createRemoveButton('moderator', item);

    item.appendChild(moderatorInput);
    item.appendChild(removeButton);

    return item;
  }

  // Function to create an ignored item
  function createIgnoredItem(user) {
    const item = createContainer('ignored');
    const ignoredInput = createInput('ignored', user, 'Ignored User');
    const removeButton = createRemoveButton('ignored', item);

    item.appendChild(ignoredInput);
    item.appendChild(removeButton);

    return item;
  }

  // Function to create a toggle item with a description and select for yes/no options
  function createToggleItem(toggle, name, optionValue) {
    const item = createContainer('toggle', 'flex');
    item.style.alignItems = 'center';

    // Create the select element for yes/no
    const select = document.createElement('select');
    select.className = 'toggle-select';

    // Create the description element
    const description = document.createElement('span');
    description.className = 'toggle-description';
    description.innerText = toggle.description;
    // Set the custom data attribute for the setting using the name parameter
    description.setAttribute('data-toggle-name', name); // Set data-toggle-name to the name parameter

    // Add click event to open the image in a new tab
    description.style.cursor = 'pointer'; // Add pointer cursor to indicate it's clickable
    description.style.color = 'burlywood';
    description.style.transition = 'color 0.15s ease-in-out';

    description.addEventListener('click', () => {
      if (toggle.image) {
        window.open(toggle.image, '_blank'); // Open the image in a new tab
      }
    });

    // Compact mouseover and mouseout events
    description.addEventListener('mouseover', function () { description.style.color = 'lightgoldenrodyellow'; })
    description.addEventListener('mouseout', function () { description.style.color = 'burlywood'; });

    // Define options with emojis for yes and no
    const options = [
      { value: 'yes', emoji: '✔️' },
      { value: 'no', emoji: '❌' }
    ];

    // Create options for the select element
    options.forEach(({ value, emoji }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = `${emoji} ${value}`; // Format text as "✔️ yes" or "❌ no"
      select.appendChild(option);
    });

    // Set the initial value of the select based on the optionValue parameter
    select.value = optionValue; // Assign the optionValue to the select element

    // Style the select element
    styleSelect(select); // Call the styling function

    // Append the description and select to the toggle item
    item.appendChild(select);
    item.appendChild(description);

    return item; // Return the created toggle item
  }

  function populateSettings() {
    const containers = {
      usersToTrack: '.settings-tracked-container',
      mentionKeywords: '.settings-mention-container',
      usernameReplacements: '.settings-replacement-container',
      moderator: '.settings-moderator-container',
      ignored: '.settings-ignored-container'
    };

    const creators = {
      usersToTrack: { name: 'tracked', createItem: createTrackedItem },
      mentionKeywords: { name: 'mention', createItem: createMentionItem },
      usernameReplacements: { name: 'replacement', createItem: createReplacementItem },
      moderator: { name: 'moderator', createItem: createModeratorItem },
      ignored: { name: 'ignored', createItem: createIgnoredItem }
    };

    const data = getSettingsData();

    Object.entries(data).forEach(([key, items]) => {
      const container = document.querySelector(containers[key]);
      if (!container) return;
      container.classList.add("settings-container");

      if (key === 'mentionKeywords' || key === 'moderator' || key === 'ignored') {
        container.style.flexDirection = 'row';
      }

      // Clear existing items and add buttons, but ensure the add button is not removed
      const existingAddButton = container.querySelector('.add-settings-button');
      while (container.firstChild) {
        if (container.firstChild !== existingAddButton) {
          container.removeChild(container.firstChild);
        } else {
          break;
        }
      }

      // Populate items
      items.forEach(item => container.appendChild(creators[key].createItem(item)));

      const addButton = createAddButton(containers[key], creators[key].createItem);
      container.appendChild(addButton);

      // Check if already wrapped in a spoiler
      const isAlreadyWrapped = container.closest('.settings-spoiler') !== null;

      if (!isAlreadyWrapped) {
        const parent = container.parentNode;
        if (parent) {
          const index = Array.from(parent.childNodes).indexOf(container);
          parent.removeChild(container);
          const spoiler = createSpoilerContainer(container, {
            showText: `Show ${creators[key].name} settings`,
            hideText: `Hide ${creators[key].name} settings`
          });
          spoiler.classList.add('settings-spoiler-wrapper');
          if (index >= parent.childNodes.length) {
            parent.appendChild(spoiler);
          } else {
            parent.insertBefore(spoiler, parent.childNodes[index]);
          }
        }
      }
    });

    // Process toggle settings separately
    const storedToggleSettings = JSON.parse(localStorage.getItem('toggle')) || [];
    const toggleContainer = document.querySelector('.settings-toggle-container');
    const toggleSettings = [
      {
        name: 'showChatStaticNotifications',
        description: '👀 Show chat static notifications',
        image: 'https://i.imgur.com/oUPSi9I.jpeg'
      },
      {
        name: 'showGlobalDynamicNotifications',
        description: '👀 Show global dynamic notifications',
        image: 'https://i.imgur.com/8ffCdUG.jpeg'
      },
      {
        name: 'enabledBeepOnChatJoinLeave',
        description: '🔊 Play a beep sound and speak feedback when the user enters or leaves the chat',
        image: 'https://i.imgur.com/6PXFIES.jpeg'
      },
      {
        name: 'switchToGoogleTTSEngine',
        description: '🔊 Switch to google TTS engine if available',
        image: 'https://i.imgur.com/0H94LII.jpeg'
      }
    ];

    toggleSettings.forEach(toggle => {
      const storedSetting = storedToggleSettings.find(item => item.name === toggle.name);
      const optionValue = storedSetting ? storedSetting.option : 'yes';
      const toggleItem = createToggleItem(toggle, toggle.name, optionValue);
      toggleContainer.appendChild(toggleItem);
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
    addButton.style.margin = '0.4em';

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