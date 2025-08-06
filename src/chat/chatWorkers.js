import { deniedSVG } from "../icons.js"; // icons

// helpers
import {
  debounce,
  locationHas
} from "../helpers/helpers.js";

import { getChatElements } from "./chatDomUtils.js";
import { decodeURL, isEncodedURL } from "../helpers/urlUtils.js";

// ========================================================================
// DEFINITIONS
// ========================================================================

const extraTimeout = 5000;
const minimalTimeout = 1000;

const blockedChatMessage = 'Вы не можете отправлять сообщения';
const lostConnectionMessage = 'Связь с сервером потеряна';

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

// ---- Set proper background color to user list ----
export function applyDynamicBackgroundColor() {
  const dynamicBackgroundColor = getComputedStyle(document.querySelector('.chat .messages')).backgroundColor;
  const style = document.createElement('style');
  style.innerHTML = `
    #chat-general .smile-tab, .chat-user-list {
      background-color: ${dynamicBackgroundColor};
    }
  `;
  document.head.appendChild(style);
}

// ---- Chat System Helpers ----
// Extracts a system message from the chat field's value.
// Returns the message string if found, or null otherwise.
export function getChatSystemMessage(chatField) {
  if (!chatField) return null;
  const value = chatField.value;
  if (value.includes(blockedChatMessage)) return blockedChatMessage;
  if (value.includes(lostConnectionMessage)) return lostConnectionMessage;
  return null;
}

// ---- Chat messages grouper ----
export function groupChatMessages() {
  const messagesContainer = document.getElementById('chat-content');
  const chatMessages = messagesContainer.querySelectorAll('.messages-content div p');
  const spacing = '14px';

  // Preprocess messages into an array of objects
  const messages = Array.from(chatMessages).map(element => ({
    element,
    isSystem: !!element.querySelector('.system-message'),
    username: (() => {
      const usernameElement = element.querySelector('span.username span[data-user]');
      return usernameElement ? usernameElement.textContent.replace(/[<>]/g, '') : null;
    })()
  }));

  let previousUser = null;
  let hasPreviousUserMessage = false;

  messages.forEach((current, index) => {
    const { element, isSystem, username } = current;

    // Reset margins before applying new styles
    element.style.marginTop = '';
    element.style.marginBottom = '';

    if (isSystem) {
      element.style.marginTop = spacing;
      element.style.marginBottom = spacing;
      return;
    }

    if (!username) return;

    // Apply top margin if user changes (after first message)
    if (hasPreviousUserMessage && username !== previousUser) {
      element.style.marginTop = spacing;
    }

    // Apply bottom margin if next message is different user
    const next = messages[index + 1];
    if (next && !next.isSystem && next.username !== username) {
      element.style.marginBottom = spacing;
    }

    previousUser = username;
    hasPreviousUserMessage = true;
  });
}

// ========================================================================
// CHAT CONNECTION RESTORATION AND UNBLOCK HANDLER
// ========================================================================
if (locationHas('gamelist')) {
  // Function to handle changes when the chat field is disabled.
  function handleChatStateChange(timeout, chatField, chatSend) {
    if (chatField.disabled) {
      const systemMessage = getChatSystemMessage(chatField);
      if (systemMessage === blockedChatMessage) {
        // Re-enable the chat field and send button, and update their styles.
        chatField.disabled = chatSend.disabled = false;
        chatSend.style.setProperty('background-color', 'rgb(160, 35, 35)', 'important');
        chatSend.style.setProperty(
          'background-image',
          `url("data:image/svg+xml,${encodeURIComponent(deniedSVG)}")`,
          'important'
        );
        chatSend.style.setProperty('background-repeat', 'no-repeat', 'important');
        chatSend.style.setProperty('background-position', 'center', 'important');
        chatSend.style.setProperty('color', 'transparent', 'important');
        chatField.value = null;
        console.log('Chat field was blocked, re-enabled.');
      } else if (systemMessage === lostConnectionMessage) {
        // Schedule a reload using timeout.
        console.log('Lost connection, reloading...');
        setTimeout(() => {
          window.location.reload();
        }, timeout);
      }
    }
  }

  // Create a MutationObserver to watch for attribute changes.
  const observer = new MutationObserver(() => {
    // Get updated chat elements.
    const { chatField, chatSend } = getChatElements();
    // Handle the change when the 'disabled' attribute is modified.
    handleChatStateChange(extraTimeout, chatField, chatSend);
  });

  // Get the chat field element.
  const { chatField: chatInputText } = getChatElements();
  // Start observing the chatField for changes to the 'disabled' attribute.
  if (chatInputText)
    observer.observe(chatInputText, { attributes: true, attributeFilter: ['disabled'] });

  // Compact visibilitychange event: When the document becomes visible,
  // set a shorter timeout duration and check the chat state.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const { chatField, chatSend } = getChatElements();
      handleChatStateChange(minimalTimeout, chatField, chatSend);
    }
  });
}

// ========================================================================
// CHAT FOCUS && INSERT PRIVATE
// ========================================================================

// Helper to apply or remove private mode stylization
function setPrivateModeStyles(enable) {
  const chatField = document.querySelector('.chat .messages .text');
  if (!chatField) return;
  
  // Create handler if it doesn't exist
  if (!setPrivateModeStyles._privateInputHandler) {
    setPrivateModeStyles._privateInputHandler = function (e) {
      if (e.target.value === '') {
        setPrivateModeStyles(false);
      }
    };
  }
  
  if (enable) {
    // Apply private mode styles
    chatField.style.setProperty('background-color', 'hsl(0, 50%, 20%)', 'important');
    chatField.style.setProperty('color', 'hsl(0, 50%, 80%)', 'important');
    
    // Add listener only when private mode is active
    chatField.addEventListener('input', setPrivateModeStyles._privateInputHandler);
  } else {
    // Remove private mode styles
    chatField.style.removeProperty('background-color');
    chatField.style.removeProperty('color');
    
    // Remove listener when private mode is disabled
    chatField.removeEventListener('input', setPrivateModeStyles._privateInputHandler);
  }
}

export function insertPrivate(userId) {
  // Always start <userName> for new user, toggle for same user
  insertPrivate._lastUserId = insertPrivate._lastUserId ?? null;
  insertPrivate._privateMode = insertPrivate._privateMode ?? true;
  if (insertPrivate._lastUserId !== userId) {
    insertPrivate._privateMode = true;
    insertPrivate._lastUserId = userId;
  } else {
    insertPrivate._privateMode = !insertPrivate._privateMode;
  }
  const userName = document.querySelector(`.name[data-user="${userId}"]`).textContent;
  const textElement = document.querySelector('.messages .text');
  textElement.value = insertPrivate._privateMode ? `<${userName}>` : `${userName}, `;
  textElement.focus();
  textElement.selectionEnd = textElement.value.length;
  setPrivateModeStyles(insertPrivate._privateMode);
}

// Function to set focus on the chat input field based on the active tab.
export function setChatFieldFocus() {
  const { chatHidden, chatField } = getChatElements(); // Get chat field elements
  if (!chatHidden && chatField) {
    chatField.focus(); // Set focus on the chat input field
  }
}

// ========================================================================
// CHAT SWITCHER  
// ========================================================================

function switchChatByKeydown() {
  const { nextChatTab, chatField, chatHidden } = getChatElements();

  if (!chatHidden && nextChatTab) {
    nextChatTab.click();
    chatField?.focus();
  }
}

function switchChatByClick(event) {
  console.log('Clicked element:', event.target);
  const activeTab = event.target.classList.contains('general') ? 'general' : 'game';
  localStorage.setItem('activeChatTab', activeTab);
}

// Function to restore the active chat tab and set focus on the chat input.
export function restoreChatTab() {
  const { activeChatTab, chatField } = getChatElements();
  activeChatTab?.click();
  chatField?.focus();
}

// ========================================================================
// CHAT EVENTS & LISTENERS
// ========================================================================

[...document.querySelectorAll('.general.c, .game.c')].forEach(tab =>
  tab.addEventListener('click', switchChatByClick)
);

document.addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    switchChatByKeydown();
    event.preventDefault();
  }
});

// ========================================================================
// INPUT BACKUP & RESTORATION
// ========================================================================
// ---- Restore message from backup ----
export function setupInputBackup() {
  const { chatField } = getChatElements();
  if (chatField) {
    chatField.value = localStorage.getItem('inputBackup') || '';

    chatField.addEventListener('input', debounce(() => {
      if (!getChatSystemMessage(chatField)) localStorage.setItem('inputBackup', chatField.value);
    }, 250));

    chatField.addEventListener('keydown', event => {
      if (event.key === 'Enter') localStorage.removeItem('inputBackup');
    });
  }
}

// ---- Restore chat state (Opened or Closed) ----
export function restoreChatState() {
  const chatMainWrapper = document.querySelector('#chat-fixed-placeholder');
  if (!localStorage.getItem('shouldShowPopupMessage')) localStorage.setItem('shouldShowPopupMessage', 'false');
  chatMainWrapper.style.display = JSON.parse(localStorage.getItem('shouldShowPopupMessage')) ? 'none' : 'unset';
}

// ---- Manual chat (Open and Close) ----
const chatCloseButton = document.querySelector('.mostright');

// Check if the current location is 'gmid' or 'gamelist'
if (locationHas('gmid') || locationHas('gamelist')) {
  // Event listener for mostright click event
  chatCloseButton.addEventListener('click', () => {
    setTimeout(() => {
      const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');
      if (chatHidden) {
        localStorage.setItem('shouldShowPopupMessage', 'true');
        isInitializedChat = false;
      } else {
        pruneDeletedMessages();
        setChatFieldFocus();
        isInitializedChat = false;
        setTimeout(() => (isInitializedChat = false), 3000);
        localStorage.setItem('shouldShowPopupMessage', 'false');
      }
    }, 300);
  });
}

// ========================================================================
// MESSAGE SENDING
// ========================================================================

// Compact function to break text into pieces of up to 300 characters.
function breakSentence(text) {
  const maxLength = 300;
  return text.split(' ').reduce((acc, word) => {
    const last = acc[acc.length - 1];
    return (last + ' ' + word).trim().length > maxLength
      ? [...acc, word]
      : [...acc.slice(0, -1), (last + ' ' + word).trim()];
  }, ['']);
}

async function sendMessageInParts(message) {
  const pieces = breakSentence(message);
  const { chatField, chatSend } = getChatElements();
  const isLongMessage = message.length > 300;

  if (isLongMessage) {
    chatField.disabled = true;
  }

  for (let index = 0; index < pieces.length; index++) {
    const fullMessage = pieces[index];
    chatField.value = fullMessage;
    console.log(`Sending piece ${index + 1}: "${fullMessage}" (Length: ${fullMessage.length})`);
    chatSend.click();

    if (index < pieces.length - 1) {
      const randomDelay = Math.floor(Math.random() * 500) + 500;
      console.log(`Waiting for ${randomDelay} ms before sending the next piece.`);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
    }
  }

  if (isLongMessage) {
    chatField.disabled = false;
  }
}

// ========================================================================
// CHAT INPUT EVENTS
// ========================================================================
export function setupChatInputListener() {
  const { chatField } = getChatElements();
  chatField.setAttribute('maxlength', '1000');

  chatField.addEventListener('paste', event => {
    event.preventDefault();
    const pastedValue = event.clipboardData.getData('text');
    let processedValue = pastedValue;

    if (isEncodedURL(pastedValue)) {
      processedValue = decodeURL(pastedValue);
    }

    const start = chatField.selectionStart;
    const end = chatField.selectionEnd;
    chatField.value = chatField.value.slice(0, start) + processedValue + chatField.value.slice(end);
    chatField.setSelectionRange(start + processedValue.length, start + processedValue.length);
  });

  chatField.addEventListener('keydown', event => {
    const message = chatField.value;
    if (event.key === 'Enter') {
      if (message.length > 300) {
        event.preventDefault();
        sendMessageInParts(message);
        console.log(`Long message processed: "${message}"`);
        chatField.value = '';
      } else {
        console.log(`Short message processed: "${message}"`);
      }
    }
  });
}

// ---- Chat Toggle (Ctrl + Space) ----
// Check if the current location is 'gmid' or 'gamelist'
if (locationHas('gmid') || locationHas('gamelist')) {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.code === 'Space') {
      const chat = document.querySelector('#chat-fixed-placeholder');
      const wasHidden = chat.style.display === 'none';
      chat.style.display = wasHidden ? 'unset' : 'none';
      localStorage.setItem('shouldShowPopupMessage', !wasHidden);
      !wasHidden
        ? document.querySelector('.popup-messages-container')?.remove()
        : getChatElements().chatField?.focus();
    }
  });
}