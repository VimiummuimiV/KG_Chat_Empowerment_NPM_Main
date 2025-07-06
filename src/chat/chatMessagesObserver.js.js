import {
  updatePersonalMessageCounts,
  normalizeAndResetUsernames,
  isBanMessage,
  playSound
} from "../helpers/helpers.js";

import { convertRussianUsernameToLatin } from "./chatIgnore.js";

import { processEncodedLinks } from "../helpers/urlUtils.js";
import { getLatestMessageData } from "../helpers/getLatestMessageData.js";
import { addMessageToQueue } from "../helpers/messagesReader.js";

import { convertImageLinksToImage } from "../converters/imageConverter.js";
import { convertVideoLinksToPlayer } from "../converters/videoConverter.js";
import { showPopupMessage } from "../components/popupMessages.js";
import { groupChatMessages } from "./chatWorkers.js";
import { isInitializedChat } from "../main.js";
import { playBeep } from "../components/beepEngine.js";
import { myNickname } from "../definitions.js";
import { settingsState } from "../panels/settings/settings.js";
import { scrollToBottom } from "../helpers/scrollTo.js";
import { addTrackedIconsToUsernames } from "./chatTracked.js";

const { ignored } = settingsState;

// Get mention keywords from localStorage once and cache them
let allMentionWords = [];

function initializeMentionKeywords() {
  const storedKeywords = localStorage.getItem('mentionKeywords');
  const mentionKeywords = storedKeywords ? JSON.parse(storedKeywords) : [];
  allMentionWords = [myNickname, ...mentionKeywords];
}

// Initialize mention keywords on load
initializeMentionKeywords();

// Function to check if message contains any mention words
function checkForMentions(messageText) {
  if (!messageText) return false;
  
  const messageTextLower = messageText.toLowerCase();
  
  return allMentionWords.some(word => 
    messageTextLower.includes(word.toLowerCase())
  );
}

// Set the flag as false for the mention beep sound to trigger at first usual beep sound for usual messages
let isMention = false;

// Create a mutation observer to watch for new messages being added
const newMessagesObserver = new MutationObserver(async mutations => {
  // Normalize chat usernames color for dark theme
  const allUsernameElements = document.querySelectorAll('.username'); // Get all username elements
  normalizeAndResetUsernames(allUsernameElements, 'all'); // Process all username elements

  if (!isInitializedChat) return;

  for (let mutation of mutations) {
    if (mutation.type === 'childList') {
      for (let node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P') {
          const singleUsernameElement = node.querySelector('.username'); // Get a single username element
          if (singleUsernameElement) normalizeAndResetUsernames(singleUsernameElement, 'one'); // Process the single username element

          // Retrieve the previous message text from localStorage
          const previousMessageText = localStorage.getItem('previousMessageText');

          // Get the latest message data (returns only messageText and usernameText)
          const latestMessageData = await getLatestMessageData();
          const currentMessageText = latestMessageData?.messageText || null;
          const currentMessageUsername = latestMessageData?.usernameText || null;

          // Check if the message contains a private indicator
          const privateMessageIndicator = '[шепчет вам]';
          const privateMessageContainer = node.querySelector('.room.private');
          const isPrivateMessage = privateMessageContainer && privateMessageContainer.textContent.includes(privateMessageIndicator);

          // Check if the current message contains any mention words OR if it's a private message
          isMention = checkForMentions(currentMessageText) || isPrivateMessage;

          // Check for a ban message and play sound if detected
          if (isBanMessage(currentMessageText)) {
            console.log('Ban message detected:', currentMessageText);
            playSound();
          }

          // Hide message if the username is in the ignored list
          if (currentMessageUsername && ignored.includes(currentMessageUsername)) {
            const latinUsername = `from-${convertRussianUsernameToLatin(currentMessageUsername)}`;
            node.classList.add('ignored-user', latinUsername);
            node.style.display = 'none';
            continue;
          }

          // Hide message if it is addressed to an ignored user (e.g., "username," or "username ")
          if (currentMessageText) {
            let addressedUsername = null;

            if (/^[^\s,]+,/.test(currentMessageText)) {
              addressedUsername = currentMessageText.split(',')[0].trim();
            } else if (/^[^\s]+ /.test(currentMessageText)) {
              addressedUsername = currentMessageText.split(' ')[0].trim();
            }

            if (addressedUsername) {
              if (ignored.includes(addressedUsername)) {
                const latinAddressedUsername = `to-${convertRussianUsernameToLatin(addressedUsername)}`;
                node.classList.add('ignored-user', latinAddressedUsername);
                node.style.display = 'none';
                continue;
              }
            }
          }

          // Get sound switcher and message mode elements
          const soundSwitcher = document.querySelector('#voice, #beep, #silence');
          const isVoice = soundSwitcher && soundSwitcher.id === 'voice';
          const isBeep = soundSwitcher && soundSwitcher.id === 'beep';
          const messageMode = document.querySelector('#every-message, #mention-message');
          const isEveryMessageMode = messageMode && messageMode.id === 'every-message';
          const isMentionMessageMode = messageMode && messageMode.id === 'mention-message';

          // If voice mode is enabled and the message is new, trigger text-to-speech
          if (isVoice && isInitializedChat && currentMessageText && currentMessageText !== previousMessageText) {
            localStorage.setItem('previousMessageText', currentMessageText);
            if (currentMessageUsername && !currentMessageUsername.includes(myNickname)) {
              const shouldRead = isEveryMessageMode || (isMentionMessageMode && isMention);
              if (shouldRead) {
                addMessageToQueue(currentMessageText);
              }
            }
          }

          // If beep mode is enabled and the message is new, play beep sound
          if (isBeep && isInitializedChat && currentMessageText && currentMessageText !== previousMessageText) {
            localStorage.setItem('previousMessageText', currentMessageText);
            if (currentMessageUsername && !currentMessageUsername.includes(myNickname)) {
              const shouldBeep = isEveryMessageMode || (isMentionMessageMode && isMention);
              if (shouldBeep) {
                const audioKey = (!isEveryMessageMode || isMention) ? 'mention' : 'message';
                playBeep(audioKey);
                if (isMention) isMention = false;
              }
            }
          }

          // If the page is initialized, perform various UI updates and processing
          if (isInitializedChat) {
            convertImageLinksToImage('generalMessages');
            convertVideoLinksToPlayer('generalMessages');
            processEncodedLinks('generalMessages');
            groupChatMessages();
            scrollToBottom('generalMessages', 350);
            showPopupMessage();
            updatePersonalMessageCounts();
            addTrackedIconsToUsernames('latest'); // Highlight tracked users messages for the latest message
          }
        }
      }
    }
  }
});

// Define a function to start observing the messages container
export function startChatMessagesObserver() {
  // Make sure the messages container is available before starting the observer
  const messagesContainer = document.querySelector('.messages-content div');
  if (messagesContainer) { newMessagesObserver.observe(messagesContainer, { childList: true, subtree: true }); }
  else { console.warn('Messages container not found!'); }
}