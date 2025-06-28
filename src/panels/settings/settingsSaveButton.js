import { addShakeEffect } from "../../animations.js";
import { debounce } from "../../helpers/helpers.js";
import { debounceTimeout } from "../../definitions.js";
import { settingsConfig } from "./settingsConfig.js";
import { getSettingsData, processUploadedSettings } from "./settingsFileHandlers.js";

/**
 * Initializes save button logic for the settings panel
 * @param {HTMLElement} saveButton - The save button element
 */
export function initializeSaveButtonLogic(saveButton) {
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
      const selectElement = item.querySelector('select');

      if (selectElement.classList.contains('language-toggle-select')) {
        currentValues.toggle.push({
          category: 'ui',
          type: 'language',
          option: selectElement.value
        });
      } else if (selectElement.classList.contains('toggle-select')) {
        const descriptionElement = item.querySelector('.toggle-description');
        const selectedValue = selectElement.value.trim() || 'no';
        currentValues.toggle.push({
          category: descriptionElement.dataset.category,
          type: descriptionElement.dataset.type,
          option: selectedValue
        });
      }
    });

    // If no language setting was found in the form, preserve the existing one
    const hasLanguageSetting = currentValues.toggle.some(item => item.type === 'language');
    if (!hasLanguageSetting) {
      const existingLanguageSetting = previousValues.toggle?.find(item => item.type === 'language');
      if (existingLanguageSetting) {
        currentValues.toggle.push(existingLanguageSetting);
      }
    }

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