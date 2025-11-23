import { addSVG, removeSVG, refreshUsernameSVG, snowflakeSVG, checkSVG } from "../../icons.js";
import { createCustomTooltip, disableCustomTooltip } from "../../components/tooltip.js";
import { settingsTitles } from "./settingsTitles.js";
import { getCurrentLanguage, localizedMessage, debounce } from "../../helpers/helpers.js";
import { getRandomEmojiAvatar } from "../../helpers/helpers.js";
import { state } from "../../definitions.js";
import { getDataById, getDataByName } from "../../helpers/apiData.js";
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
    // Update tooltip after state change
    createCustomTooltip(snowflakeButton, {
      en: isFrozen ? 'Unfreeze user' : 'Freeze user',
      ru: isFrozen ? 'Разморозить пользователя' : 'Заморозить пользователя'
    });
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
  createCustomTooltip(removeButton, {
    en: 'Remove user',
    ru: 'Удалить пользователя'
  });
  return removeButton;
}

// Helper function to create a confirm button for tracked items
export function createConfirmButton(user, onConfirm) {
  const confirmButton = document.createElement('div');
  confirmButton.className = 'settings-button confirm-settings-button';
  confirmButton.innerHTML = refreshUsernameSVG;
  createCustomTooltip(confirmButton, {
    en: 'Confirm username change',
    ru: 'Подтвердить изменение имени'
  });
  confirmButton.addEventListener('click', () => {
    let trackedUsers = [];
    try { trackedUsers = JSON.parse(localStorage.getItem('usersToTrack')) || []; } catch {}
    const trackedItem = confirmButton.closest('.tracked-item');
    const usernameInput = trackedItem && trackedItem.querySelector('.tracked-username-field');
    const newName = usernameInput && usernameInput.value;
    const idx = trackedUsers.findIndex(u => u.id === user.id);
    if (idx !== -1 && newName) {
      trackedUsers[idx].name = newName;
      localStorage.setItem('usersToTrack', JSON.stringify(trackedUsers));
      usernameInput.classList.remove('input-warning');
      if (usernameInput) disableCustomTooltip(usernameInput);
    }
    confirmButton.remove();
    if (typeof onConfirm === 'function') onConfirm();
  });
  return confirmButton;
}

// Helper function to create a snowflake button
export function createSnowflakeButton(state = 'thawed', username) {
  const snowflakeButton = document.createElement('div');
  snowflakeButton.className = `settings-button assigned-settings-button assigned-${state}-config`;
  snowflakeButton.style.opacity = state === 'thawed' ? '0.3' : '1';
  snowflakeButton.innerHTML = snowflakeSVG;
  attachSnowflakeListener(snowflakeButton, username);
  createCustomTooltip(snowflakeButton, {
    en: state === 'thawed' ? 'Freeze user' : 'Unfreeze user',
    ru: state === 'thawed' ? 'Заморозить пользователя' : 'Разморозить пользователя'
  });
  return snowflakeButton;
}

// Creator function for a tracked item
export function createTrackedItem(user) {
  const item = createContainer('tracked');
  // Add id input as the first input, using the correct placeholder key
  const idInput = createInput('tracked-id', user.id || '', getPlaceholder('tracked', 'id'));
  const usernameInput = createInput('tracked-username', user.name, getPlaceholder('tracked', 'name'));
  usernameInput.disabled = true;
  const pronunciationInput = createInput('tracked-pronunciation', user.pronunciation, getPlaceholder('tracked', 'pronunciation'));
  const removeButton = createRemoveButton('tracked', item);
  const initialState = (user.state === 'frozen') ? 'frozen' : 'thawed';
  const snowflakeButton = createSnowflakeButton(initialState, user.name);

  // Tooltip message for username mismatch
  const usernameWarningTooltip = {
    en: `Username has changed. Previous name: ${user.name}`,
    ru: `Имя пользователя изменилось. Прошлое имя: ${user.name}`
  };

  // Debounced event for id input to fetch username
  idInput.addEventListener('input', debounce(async function (e) {
    const idValue = e.target.value.trim();
    if (idValue) {
      const result = await getDataById(idValue, 'currentLogin');
      // Found user by ID, set username input value
      if (result) {
        usernameInput.value = result;
        usernameInput.placeholder = getPlaceholder('tracked', 'name');
        // Not found user by ID, clear username input
      } else {
        usernameInput.value = '';
        usernameInput.placeholder = getPlaceholder('tracked', 'notFoundName');
      }
      // If no ID is entered, clear username input
    } else {
      usernameInput.value = '';
      usernameInput.placeholder = getPlaceholder('tracked', 'name');
    }
  }, 500));

  // Fast fill: if id is empty but username is present, try to fetch id by usernameInput value
  if ((!user.id || user.id === '') && user.name && user.name.trim() !== '') {
    const username = usernameInput.value.trim();
    if (username) {
      getDataByName(username, 'userId').then(foundId => {
        if (foundId && idInput.value.trim() === '') {
          idInput.value = foundId;
          // Optionally, trigger the input event to update username field as well
          idInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }
  }

  // --- Always recheck login for each tracked item on creation ---
  if (user.id) {
    getDataById(user.id, 'currentLogin').then(currentLogin => {
      const confirmBtn = snowflakeButton.parentNode && snowflakeButton.parentNode.querySelector('.confirm-settings-button');
      if (currentLogin && currentLogin !== user.name) {
        usernameInput.value = currentLogin;
        usernameInput.placeholder = getPlaceholder('tracked', 'name');
        usernameInput.classList.add('input-warning');
        createCustomTooltip(usernameInput, usernameWarningTooltip[getCurrentLanguage()] || usernameWarningTooltip.en);
        if (!confirmBtn) {
          const confirmButton = createConfirmButton(user);
          snowflakeButton.insertAdjacentElement('afterend', confirmButton);
        }
      } else {
        usernameInput.classList.remove('input-warning');
        disableCustomTooltip(usernameInput);
        if (confirmBtn) confirmBtn.remove();
      }
    });
  }

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

  item.appendChild(idInput);
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

// Create badge helper
function showUserBadge(item, username, userData, doSave = false) {
  if (doSave) {
    try {
      if (!userData[username]) userData[username] = {};
      userData[username].change = 'user';
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Move to top of wrapper
      const wrapper = item.closest('.settings-userColors-items-container');
      if (wrapper && wrapper.firstChild !== item) {
        wrapper.insertBefore(item, wrapper.firstChild);
      }
    } catch (err) {}
  }

  // Create/show badge
  const header = item.querySelector('.userColors-header-row');
  if (header && !header.querySelector('.userColors-user-badge')) {
    const badge = document.createElement('span');
    badge.className = 'userColors-user-badge';
    badge.innerHTML = checkSVG;
    header.appendChild(badge);
  }
}

// Creator function for a user color item
export function createUserColorItem(username, userData = null) {
  const item = createContainer('userColors');
  // Use provided in-memory userData when available to avoid duplicate localStorage reads
  if (!userData) userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userColorData = userData[username] || { id: '', color: '#808080' };
  
  // Update userData helper
  const updateColor = (color) => {
    userData[username].color = color;
    localStorage.setItem('userData', JSON.stringify(userData));
  };
  
  // Avatar + username display
  const avatarElement = document.createElement('div');
  avatarElement.className = 'userColors-avatar';

  const userId = userColorData.id || '';
  // Compactly resolve avatarTimestamp from fetchedUsers cache or localStorage
  let avatarTimestamp = '';
  if (userId) {
    avatarTimestamp = (state?.fetchedUsers?.[userId]?.avatarTimestamp) || '';
    if (!avatarTimestamp) {
      try {
        const cached = JSON.parse(localStorage.getItem('fetchedUsers') || '{}');
        avatarTimestamp = (cached?.[userId]?.avatarTimestamp) || '';
      } catch {}
    }
  }

  if (userId) {
    const bigAvatarUrl = avatarTimestamp && avatarTimestamp !== '00'
      ? `/storage/avatars/${userId}_big.png?updated=${avatarTimestamp}`
      : `/storage/avatars/${userId}_big.png`;
    const img = document.createElement('img');
    img.alt = `${username}'s avatar`;
    img.className = 'userColors-avatar-img';
    // If image fails to load, replace the img with an emoji fallback inside the avatar container
    img.onerror = () => {
      avatarElement.innerHTML = '';
      const emojiEl = document.createElement('div');
      emojiEl.className = 'userColors-avatar-emoji';
      emojiEl.textContent = getRandomEmojiAvatar();
      avatarElement.appendChild(emojiEl);
    };
    img.src = bigAvatarUrl;
    avatarElement.appendChild(img);
  } else {
    avatarElement.innerHTML = '';
    const emojiEl = document.createElement('div');
    emojiEl.className = 'userColors-avatar-emoji';
    emojiEl.textContent = getRandomEmojiAvatar();
    avatarElement.appendChild(emojiEl);
  }

  const usernameSpan = document.createElement('span');
  usernameSpan.className = 'userColors-username-display';
  usernameSpan.textContent = username;
  
  // Hex input
  const hexInput = createInput('userColors', userColorData.color, getPlaceholder('userColors', 'hex'));
  Object.assign(hexInput, { pattern: '^#[0-9A-Fa-f]{6}$', maxLength: 7 });
  
  hexInput.addEventListener('input', (e) => {
    let value = e.target.value.toUpperCase();
    if (value && !value.startsWith('#')) value = '#' + value;
    e.target.value = value;
    hexInput.classList.toggle('input-warning', !/^#[0-9A-Fa-f]{6}$/.test(value));
  });
  
  hexInput.addEventListener('change', (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      const newColor = e.target.value;
      const oldColor = (userData[username] && userData[username].color) || userColorData.color;
      // If color didn't change, just update swatch and bail out
      if (newColor === oldColor) {
        if (swatch) swatch.style.backgroundColor = newColor;
        return;
      }
      updateColor(newColor);
      showUserBadge(item, username, userData, true);
      if (swatch) swatch.style.backgroundColor = newColor;
    }
  });

  // Color swatch + hidden native color input
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'userColors-color-input-hidden';
  colorInput.value = userColorData.color;
  colorInput.style.display = 'none';

  const swatch = document.createElement('div');
  swatch.className = 'userColors-color-swatch';
  swatch.style.backgroundColor = userColorData.color;

  swatch.addEventListener('click', () => {
    colorInput.click();
  });

  colorInput.addEventListener('change', (e) => {
    const newColor = e.target.value;
    const oldColor = (userData[username] && userData[username].color) || userColorData.color;
    hexInput.value = newColor;
    hexInput.classList.remove('input-warning');
    swatch.style.backgroundColor = newColor;
    if (newColor === oldColor) return;
    updateColor(newColor);
    showUserBadge(item, username, userData, true);
  });
  
  // Remove button
  const removeButton = document.createElement('div');
  removeButton.className = 'settings-button remove-settings-button remove-userColors-item';
  removeButton.innerHTML = removeSVG;
  removeButton.addEventListener('click', () => {
    delete userData[username];
    localStorage.setItem('userData', JSON.stringify(userData));
    item.remove();
  });
  createCustomTooltip(removeButton, {
    en: 'Remove user color',
    ru: 'Удалить цвет пользователя'
  });
  
  // Build layout
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'userColors-content-wrapper';
  
  const controlsRow = document.createElement('div');
  controlsRow.className = 'userColors-controls-row';
  // append visible hex input, swatch, hidden color input, then remove button
  controlsRow.append(hexInput, swatch, colorInput, removeButton);
  
  // Insert avatar + username together
  const headerRow = document.createElement('div');
  headerRow.className = 'userColors-header-row';
  headerRow.appendChild(avatarElement);
  headerRow.appendChild(usernameSpan);

  contentWrapper.append(headerRow, controlsRow);
  item.appendChild(contentWrapper);
  
  // Show badge initially if user has 'change: user' flag
  if (userData[username]?.change === 'user') {
    showUserBadge(item, username, userData);
  }
  
  return item;
}

// Function to create an "Add" button for dynamic item creation
export function createAddButton(containerSelector, itemCreator) {
  const middleWord = containerSelector.split('-')[1]; // Extract key type (e.g., tracked, mention)
  const existingButton = document.querySelector(`.add-${middleWord}-item`); // Check if the button already exists
  // If the button exists, remove it
  if (existingButton) existingButton.remove();

  const addButton = document.createElement('div');
  // Set class, content, and style for the button
  addButton.className = `settings-button add-settings-button add-${middleWord}-item`;
  addButton.innerHTML = addSVG; // Add SVG icon to the button
  createCustomTooltip(addButton, {
    en: 'Add new user',
    ru: 'Добавить пользователя'
  });

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
      // Localized alert if the last item is not filled
      localizedMessage({
        en: 'Please fill in the previous field before adding a new one.',
        ru: 'Пожалуйста, заполните предыдущее поле перед добавлением нового.'
      }, 'alert');
    }
  });

  return addButton; // Return the created button
}