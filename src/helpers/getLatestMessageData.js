import { normalizeUsernameColor } from './colorUtils.js';

import { today } from '../definitions.js';
import { settingsState } from '../panels/settings/settings.js';
const {
  ignored,
  mentionKeywords,
  usernameReplacements,
  usersToTrack
} = settingsState;


// --- Helper functions for message processing ---

// Function to check if a username is mentioned in the message
export function isMentionForMe(message) {
  const messageLowercase = message.toLowerCase();
  return mentionKeywords.some(keyword => messageLowercase.includes(keyword.toLowerCase()));
}

// Function to replace usernames with their pronunciations or replacements
function replaceWithPronunciation(text) {
  if (text === null) return text;

  // Combine all usernames that need replacement
  const allUsernames = [
    ...usersToTrack.map(user => user.name),
    ...usernameReplacements.map(replacement => replacement.original)
  ];

  // Create a pattern to match any character that is part of a word (including Cyrillic characters).
  const pattern = new RegExp(`(${allUsernames.join('|')})`, 'gu');

  return text.replace(pattern, (matched) => {
    // Priority 1: Check username replacements
    const replacement = usernameReplacements.find(r => r.original === matched);
    if (replacement) return replacement.replacement;

    // Priority 2: Check tracked user pronunciations
    const trackedUser = usersToTrack.find(user => user.name === matched);
    return trackedUser?.pronunciation || matched;
  });
}

// Function to highlight mention words in messages
export function highlightMentionWords(containerType = 'generalMessages') {
  const containerSelectors = {
    generalMessages: {
      container: '.messages-content div',
      messageElement: 'p',
      exclude: ['.time', '.username'] // Add exclusion list
    },
    chatlogsMessages: {
      container: '.chat-logs-container',
      messageElement: '.message-text'
    },
    personalMessages: {
      container: '.messages-container',
      messageElement: '.message-text'
    }
  };

  const config = containerSelectors[containerType];
  if (!config) {
    console.error('Invalid container type');
    return;
  }

  const containers = document.querySelectorAll(config.container);
  const globalProcessed = new WeakSet();

  containers.forEach((container) => {
    const messages = container.querySelectorAll(config.messageElement);

    messages.forEach((message) => {
      const processingQueue = [
        ...message.querySelectorAll('.private'),
        ...message.querySelectorAll('.system-message'),
        message
      ];

      processingQueue.forEach((element) => {
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip processed nodes and protected elements
              if (globalProcessed.has(node)) return NodeFilter.FILTER_SKIP;

              // Check if node is inside excluded elements
              const parent = node.parentElement;
              if (parent.closest('.mention, .time, .username')) {
                return NodeFilter.FILTER_SKIP;
              }

              // Additional exclusion for generalMessages
              if (containerType === 'generalMessages' && parent.closest(config.exclude.join(','))) {
                return NodeFilter.FILTER_SKIP;
              }

              return NodeFilter.FILTER_ACCEPT;
            }
          },
          false
        );

        const nodes = [];
        let currentNode;
        while ((currentNode = walker.nextNode())) {
          nodes.push(currentNode);
        }

        nodes.forEach((node) => {
          if (!globalProcessed.has(node)) {
            processNode(node);
            globalProcessed.add(node);
          }
        });
      });
    });
  });

  function processNode(node) {
    const regex = /[\s]+|[^\s\wа-яА-ЯёЁ]+|[\wа-яА-ЯёЁ]+/g;
    const words = node.textContent.match(regex);
    if (!words) return;

    const fragment = document.createDocumentFragment();

    words.forEach((word) => {
      if (mentionKeywords.map(alias => alias.toLowerCase()).includes(word.toLowerCase())) {
        const mentionSpan = document.createElement('span');
        mentionSpan.className = 'mention';
        mentionSpan.textContent = word;
        fragment.appendChild(mentionSpan);
      } else {
        fragment.appendChild(document.createTextNode(word));
      }
    });

    node.parentNode.replaceChild(fragment, node);
  }
}

// --- Main function to get the latest message data ---

// Initialize the variable to keep track of the last username seen
let lastUsername = null;

export async function getLatestMessageData() {
  const messageElement = document.querySelector('.messages-content div p:last-of-type');
  if (!messageElement) return null;

  // Inline helper: collects text parts from a container's child nodes.
  const collectMessageParts = async (container) =>
    Array.from(container.childNodes)
      .map(node =>
        node.nodeType === Node.TEXT_NODE && node.textContent.trim() ? node.textContent.trim() :
          node.nodeName === 'IMG' && node.getAttribute('title') ? node.getAttribute('title') :
            node.nodeName === 'A' && node.getAttribute('href') ? node.getAttribute('href') : ''
      )
      .filter(Boolean);

  // 1. Extract common message text.
  let finalMessageText = (await collectMessageParts(messageElement)).join(' ').trim();
  let messageType = "common"; // Default message type

  // 2. Check for private messages
  const privateMessageContainer = messageElement.querySelector('.room.private');
  if (privateMessageContainer && privateMessageContainer.textContent.includes('[шепчет ')) {
    const privateMessageElement = messageElement.querySelector('span.private');
    if (privateMessageElement) {
      finalMessageText = (await collectMessageParts(privateMessageElement)).join(' ').trim();
      messageType = "private";
    }
  }

  // 3. Check for system messages
  const systemMessageElement = messageElement.querySelector('.system-message');
  if (systemMessageElement) {
    let systemMessageText = (await collectMessageParts(systemMessageElement)).join(' ').trim();
    systemMessageText = systemMessageText.replace(/<Клавобот>\s*/g, '');
    finalMessageText = systemMessageText;
    messageType = "system";
  }

  // 4. If still "common" and it mentions the user, mark as "mention".
  if (messageType === "common" && isMentionForMe(finalMessageText)) {
    messageType = "mention";
  }

  // Process localStorage: retrieve or initialize personalMessages.
  const personalMessages = JSON.parse(localStorage.getItem('personalMessages')) || {};

  // Extract message metadata.
  const time = messageElement.querySelector('.time')?.textContent || 'N/A';
  const usernameDataElement = messageElement.querySelector('.username span[data-user]');
  const userId = usernameDataElement ? usernameDataElement.getAttribute('data-user') : null;
  const extractedUsername = usernameDataElement ? usernameDataElement.textContent : 'SYSTEM';
  const usernameColor = usernameDataElement ? usernameDataElement.parentElement.style.color : 'rgb(180,180,180)';
  const normalizedColor = normalizeUsernameColor(usernameColor, "rgb");
  const messageKey = `${time}_${extractedUsername}_${today}`;

  // Check if the message type is "mention" or "private", and if the username is not in the ignore list
  const shouldSaveMessage = (
    messageType === "mention" ||
    messageType === "private"
  ) && !ignored.includes(extractedUsername);

  // If the condition is met, save the message to localStorage
  if (shouldSaveMessage) {
    personalMessages[messageKey] = {
      time,
      date: today,
      username: extractedUsername,
      usernameColor: normalizedColor,
      message: finalMessageText,
      type: messageType,
      userId
    };
    localStorage.setItem('personalMessages', JSON.stringify(personalMessages));
  }

  // Extract username (defaulting to "SYSTEM") and build prefix.
  const usernameContainer = messageElement.querySelector('.username');
  const usernameText = usernameContainer ? usernameContainer.textContent.replace(/[<>]/g, '') : 'SYSTEM';

  highlightMentionWords(); // Apply highlight for all message types

  let prefix = (messageType === "mention" || messageType === "private")
    ? `${replaceWithPronunciation(usernameText)} обращается: `
    : (usernameText !== lastUsername ? `${replaceWithPronunciation(usernameText)} пишет: ` : "");

  lastUsername = usernameText;

  const messageText = prefix + replaceWithPronunciation(finalMessageText);
  return { messageText, usernameText };
}