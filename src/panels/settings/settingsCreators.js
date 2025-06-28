import { removeSVG, snowflakeSVG } from "../../icons.js";
import { settingsTitles } from "./settingsTitles.js";
import { getCurrentLanguage } from "../../helpers/helpers.js";
import { settingsConfig } from "./settingsConfig.js";

// Helper function to get localized placeholder text
function getPlaceholder(type, field = null) {
  const lang = getCurrentLanguage();
  const placeholders = settingsTitles.placeholderTitles[type];

  if (!placeholders) return '';

  if (field && typeof placeholders === 'object' && placeholders[field]) {
    return placeholders[field][lang] || placeholders[field]['en'] || '';
  }

  if (typeof placeholders === 'object' && !field) {
    return placeholders[lang] || placeholders['en'] || '';
  }

  return '';
}

// Helper function to attach click event for removing an item
export function attachRemoveListener(removeButton, item) {
  removeButton.addEventListener('click', () => {
    item.remove();
  });
}

// Function to attach click event for toggling snowflake states
export function attachSnowflakeListener(snowflakeButton, username) {
  snowflakeButton.addEventListener('click', () => {
    const isFrozen = snowflakeButton.classList.toggle('assigned-frozen-config');
    snowflakeButton.classList.toggle('assigned-thawed-config');
    snowflakeButton.style.opacity = isFrozen ? '1' : '0.3';
    updateUserState(username, isFrozen ? 'frozen' : 'thawed');
  });
}

// Function to update user state in localStorage
export function updateUserState(username, state) {
  const usersData = localStorage.getItem("usersToTrack");
  if (usersData) {
    const updatedUsers = JSON.parse(usersData).map(user =>
      user.name === username ? { ...user, state } : user
    );
    localStorage.setItem("usersToTrack", JSON.stringify(updatedUsers));
  }
}

// Helper function to create a container element
export function createContainer(type) {
  const item = document.createElement('div');
  item.className = `${type}-item`;
  return item;
}

// Helper function to create a spoiler container
export function createSpoilerContainer(contentElement, options = {}) {
  const container = document.createElement('div');
  container.classList.add("settings-spoiler");
  const toggleButton = document.createElement('button');
  // Use localized spoiler button text with emoji
  const type = options.type;
  const lang = getCurrentLanguage();
  // Find emoji for this type from settingsConfig
  const config = settingsConfig.find(cfg => cfg.type === type);
  const emoji = config && config.emoji ? config.emoji + ' ' : '';
  const spoilerMsg = settingsTitles.spoilerTitles[type] || settingsTitles.spoilerTitles.toggle;
  toggleButton.textContent = (options.showText || (emoji + spoilerMsg[lang].show));
  contentElement.style.display = 'none';

  toggleButton.addEventListener('click', () => {
    const isHidden = contentElement.style.display === 'none';
    toggleButton.textContent = isHidden
      ? (options.hideText || (emoji + spoilerMsg[lang].hide))
      : (options.showText || (emoji + spoilerMsg[lang].show));
    contentElement.style.display = isHidden ? 'flex' : 'none';
  });

  container.appendChild(toggleButton);
  container.appendChild(contentElement);
  return container;
}

// Helper function to create an input element
export function createInput(type, value = '', placeholder = '') {
  const input = document.createElement('input');
  input.className = `settings-field ${type}-field`;
  input.value = value;
  input.placeholder = placeholder;
  return input;
}

// Helper function to create a remove button
export function createRemoveButton(type, item) {
  const removeButton = document.createElement('div');
  removeButton.className = `settings-button remove-settings-button remove-${type}-word`;
  removeButton.innerHTML = removeSVG;
  attachRemoveListener(removeButton, item);
  return removeButton;
}

// Helper function to create a snowflake button
export function createSnowflakeButton(state = 'thawed', username) {
  const snowflakeButton = document.createElement('div');
  snowflakeButton.className = `settings-button assigned-settings-button assigned-${state}-config`;
  snowflakeButton.style.opacity = state === 'thawed' ? '0.3' : '1';
  snowflakeButton.innerHTML = snowflakeSVG;
  attachSnowflakeListener(snowflakeButton, username);
  return snowflakeButton;
}

// Creator function for a tracked item
export function createTrackedItem(user) {
  const item = createContainer('tracked');
  const usernameInput = createInput('tracked-username', user.name, getPlaceholder('tracked', 'name'));
  const pronunciationInput = createInput('tracked-pronunciation', user.pronunciation, getPlaceholder('tracked', 'pronunciation'));
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

// Creator function for a mention item
export function createMentionItem(keyword) {
  const item = createContainer('mention');
  const mentionInput = createInput('mention', keyword, getPlaceholder('mention'));
  const removeButton = createRemoveButton('mention', item);
  item.appendChild(mentionInput);
  item.appendChild(removeButton);
  return item;
}

// Creator function for a replacement item
export function createReplacementItem(replacement = { original: '', replacement: '' }) {
  const item = createContainer('replacement');
  const originalInput = createInput('replacement-original', replacement.original, getPlaceholder('replacement', 'find'));
  const replacementInput = createInput('replacement', replacement.replacement, getPlaceholder('replacement', 'replace'));
  const removeButton = createRemoveButton('replacement', item);
  item.appendChild(originalInput);
  item.appendChild(replacementInput);
  item.appendChild(removeButton);
  return item;
}

// Creator function for a moderator item
export function createModeratorItem(moderator) {
  const item = createContainer('moderator');
  const moderatorInput = createInput('moderator', moderator, getPlaceholder('moderator'));
  const removeButton = createRemoveButton('moderator', item);
  item.appendChild(moderatorInput);
  item.appendChild(removeButton);
  return item;
}

// Creator function for an ignored item
export function createIgnoredItem(user) {
  const item = createContainer('ignored');
  const ignoredInput = createInput('ignored', user, getPlaceholder('ignored'));
  const removeButton = createRemoveButton('ignored', item);
  item.appendChild(ignoredInput);
  item.appendChild(removeButton);
  return item;
}

// Creator function for a toggle item
export function createToggleItem(toggleConfig, optionValue, localizedDescription) {
  const item = createContainer('toggle');
  if (toggleConfig.type === 'language') {
    const select = document.createElement('select');
    select.className = 'language-toggle-select';
    (toggleConfig.languages || []).forEach(langOpt => {
      const option = document.createElement('option');
      option.value = langOpt.value;
      option.textContent = langOpt.label;
      select.appendChild(option);
    });
    select.value = optionValue;
    const label = document.createElement('span');
    label.className = 'toggle-description';
    label.textContent = `${toggleConfig.emoji} ${localizedDescription}`;
    item.appendChild(select);
    item.appendChild(label);
    return item;
  }

  const select = document.createElement('select');
  select.className = 'toggle-select';

  const description = document.createElement('span');
  description.className = 'toggle-description';
  description.dataset.category = toggleConfig.category;
  description.dataset.type = toggleConfig.type;
  description.textContent = `${toggleConfig.emoji} ${localizedDescription}`;

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