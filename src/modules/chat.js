// helpers
import {
  isValidEncodedURL,
  debounce
} from "./helpers";

// ========================================================================
// DEFINITIONS
// ========================================================================

const currentLocationIncludes = part => window.location.href.includes(part);

const extraTimeout = 5000;
const minimalTimeout = 1000;

const blockedChatMessage = 'Вы не можете отправлять сообщения';
const lostConnectionMessage = 'Связь с сервером потеряна';

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

// ---- DOM Utilities ----
// Dynamically retrieves the current chat elements based on the active tab.
export const getChatElements = () => {
  const activeTab = localStorage.getItem('activeChatTab') || 'game'; // Defaults to 'game' if not found or empty
  const isGameLocation = window.location.href.includes('gmid');

  // Default to general chat elements
  const chatFieldSelector = isGameLocation
    ? (activeTab === 'game' ? '[id^="chat-game"] .text' : '#chat-general .text')
    : '#chat-general .text';

  const chatSendSelector = isGameLocation
    ? (activeTab === 'game' ? '[id^="chat-game"] .send' : '#chat-general .send')
    : '#chat-general .send';

  // Get the currently active tab based on localStorage's activeTab value (used for restore)
  const activeChatTab = document.querySelector(
    isGameLocation
      ? (activeTab === 'game' ? '.game.c' : '.general.c') // Select the active tab (game or general)
      : (activeTab === 'general' ? '.general.c' : '.game.c') // If activeTab is general, select general
  );

  // Get next tab to switch (either general or game)
  const nextChatTab = document.querySelector(
    isGameLocation
      ? (document.querySelector('.game.c.active') ? '.general.c' : '.game.c')
      : (document.querySelector('.general.c.active') ? '.game.c' : '.general.c')
  );

  return {
    chatField: document.querySelector(chatFieldSelector),
    chatSend: document.querySelector(chatSendSelector),
    activeChatTab, // Return the currently active tab element (either general or game)
    nextChatTab, // Return the next tab to switch to
    chatHidden: document.querySelector('#chat-wrapper.chat-hidden')
  };
};

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

// ========================================================================
// CHAT CONNECTION RESTORATION AND UNBLOCK HANDLER
// ========================================================================
if (currentLocationIncludes('gamelist')) {
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
          `url("data:image/svg+xml,${encodeURIComponent(icons.deniedSVG)}")`,
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
// CHAT FOCUS
// ========================================================================

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

    if (isValidEncodedURL(pastedValue)) {
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
