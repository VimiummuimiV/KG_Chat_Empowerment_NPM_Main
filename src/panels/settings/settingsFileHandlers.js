import { settingsState } from "./settings.js";
import { settingsConfig } from "./settingsConfig.js";
import { getCurrentLanguage } from "../../helpers/helpers.js";

// Global function to handle file input and process uploaded settings
export async function handleUploadSettings(event) {
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
          {
            const lang = getCurrentLanguage();
            const msg = {
              en: 'Failed to parse JSON data. Please check the format and try again.',
              ru: 'Не удалось разобрать данные JSON. Пожалуйста, проверьте формат и попробуйте снова.'
            };
            alert(msg[lang] || msg.en);
          }
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

export function handleDownloadSettings(settingsData) {
  if (!settingsData || typeof settingsData !== 'object') {
    console.error('Invalid settings data for download.');
    {
      const lang = getCurrentLanguage();
      const msg = {
        en: 'Cannot import settings. Please try again.',
        ru: 'Не удалось импортировать настройки. Пожалуйста, попробуйте снова.'
      };
      alert(msg[lang] || msg.en);
    }
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
    {
      const lang = getCurrentLanguage();
      const msg = {
        en: 'Failed to export settings. Please try again.',
        ru: 'Не удалось экспортировать настройки. Пожалуйста, попробуйте снова.'
      };
      alert(msg[lang] || msg.en);
    }
  }
}

export function getSettingsData() {
  return Object.fromEntries(settingsConfig.map(config => [config.key, JSON.parse(localStorage.getItem(config.key)) || []]));
}

function saveSettingsToLocalStorage() {
  settingsConfig.forEach(config => {
    localStorage.setItem(config.key, JSON.stringify(settingsState[config.key]));
  });
}

// Process and apply uploaded settings dynamically
export function processUploadedSettings(uploadedSettings) {
  // Iterate over the settingsConfig to apply each setting
  settingsConfig.forEach(config => {
    if (Array.isArray(uploadedSettings[config.key])) {
      // If the setting is an array, update it in the settingsState
      settingsState[config.key] = uploadedSettings[config.key];
    }

    // Save the updated settings to localStorage
    saveSettingsToLocalStorage();

    // Log the updated settings for debugging
    console.log(`Updated setting for ${config.key}:`, settingsState[config.key]);
  });
}