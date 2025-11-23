import { settingsState } from "./settings.js";
import { settingsConfig } from "./settingsConfig.js";
import { localizedMessage } from "../../helpers/helpers.js";

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
          localizedMessage({
            en: 'Failed to parse JSON data. Please check the format and try again.',
            ru: 'Не удалось разобрать данные JSON. Пожалуйста, проверьте формат и попробуйте снова.'
          }, 'alert');
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
    localizedMessage({
      en: 'Cannot export settings. Please try again.',
      ru: 'Не удалось экспортировать настройки. Пожалуйста, попробуйте снова.'
    }, 'alert');
    return;
  }

  try {
    const tabSize2 = '  ';
    const tabSize4 = '    ';

    let jsonData = '{\n';

    settingsConfig.forEach((config, index) => {
      const key = config.key;
      let data = settingsData[key];

      // Special pretty formatting for userData (only saved colors)
      if (key === 'userData' && data && typeof data === 'object') {
        const entries = Object.entries(data);
        if (entries.length === 0) {
          jsonData += `${tabSize2}"userData": {}`;
        } else {
          jsonData += `${tabSize2}"userData": {\n`;
          entries.forEach(([username, userObj], i) => {
            const line = JSON.stringify(userObj);
            const comma = i < entries.length - 1 ? ',' : '';
            jsonData += `${tabSize4}"${username}": ${line}${comma}\n`;
          });
          jsonData += `${tabSize2}}`;
        }
      }
      // All other keys (arrays)
      else if (Array.isArray(data)) {
        if (data.length === 0) {
          jsonData += `${tabSize2}"${key}": []`;
        } else {
          jsonData += `${tabSize2}"${key}": [\n`;
          data.forEach((item, i) => {
            const comma = i < data.length - 1 ? ',' : '';
            jsonData += `${tabSize4}${JSON.stringify(item)}${comma}\n`;
          });
          jsonData += `${tabSize2}]`;
        }
      }
      // Fallback (should not happen)
      else {
        jsonData += `${tabSize2}"${key}": ${JSON.stringify(data)}`;
      }

      // Add comma except for last item
      jsonData += index < settingsConfig.length - 1 ? ',\n' : '\n';
    });

    jsonData += '}';

    // Generate filename with date
    const currentDate = new Intl.DateTimeFormat('en-CA').format(new Date());
    const filename = `KG_Chat_Empowerment_Settings_${currentDate}.json`;

    // Download
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
    localizedMessage({
      en: 'Failed to export settings. Please try again.',
      ru: 'Не удалось экспортировать настройки. Пожалуйста, попробуйте снова.'
    }, 'alert');
  }
}

export function getSettingsData() {
  const data = Object.fromEntries(
    settingsConfig.map(config => [
      config.key,
      JSON.parse(localStorage.getItem(config.key)) || []
    ])
  );

  // Only export manually saved user colors
  if (data.userData) {
    data.userData = Object.fromEntries(
      Object.entries(data.userData).filter(([_, v]) => v?.change === 'user')
    );
  }

  return data;
}

// Process and apply uploaded settings dynamically
export function processUploadedSettings(uploadedSettings) {
  settingsConfig.forEach(config => {
    const key = config.key;
    if (!uploadedSettings.hasOwnProperty(key)) return;

    if (key === 'userData') {
      const current = JSON.parse(localStorage.getItem('userData') || '{}');
      const merged = { ...current, ...uploadedSettings[key] };

      localStorage.setItem('userData', JSON.stringify(merged));
      if (settingsState[key] !== undefined) settingsState[key] = merged;
    }
    else if (Array.isArray(uploadedSettings[key])) {
      settingsState[key] = uploadedSettings[key];
      localStorage.setItem(key, JSON.stringify(uploadedSettings[key]));
    }
  });

  console.log('Settings imported successfully');
}