import {
  addMessageToQueue,
  processEncodedLinks,
  scrollMessagesToBottom,
  updatePersonalMessageCounts,
  normalizeAndResetUsernames,
  convertRussianUsernameToLatin,
  getLatestMessageData,
  isBanMessage,
  playSound
} from "../helpers"; // helpers

import { convertImageLinksToImage } from "../converters/image-converter.js"; // image converter
import { convertVideoLinksToPlayer } from "../converters/video-converter.js"; // video converter
import { showPopupMessage } from "../popup-messages"; // popup messages
import { groupChatMessages } from "./chat-workers"; // chat workers
import { isInitializedChat } from "../../main"; // main
import { usualMessageFrequencies, mentionMessageFrequencies, playBeep, beepVolume } from "../voice-engine"; // voice engine definitions
import { myNickname } from "../definitions.js"; // definitions
import { settingsState } from "../panels/settings/settings.js"; // settings

const { ignored } = settingsState;

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

          // Convert Cyrillic username to Latin
          const latinUsername = convertRussianUsernameToLatin(currentMessageUsername);

          // Check for a ban message and play sound if detected
          if (isBanMessage(currentMessageText)) {
            console.log('Ban message detected:', currentMessageText);
            playSound();
          }

          // Hide message if the username is in the ignored list
          if (currentMessageUsername && ignored.includes(currentMessageUsername)) {
            node.classList.add('ignored-user', latinUsername);
            node.style.display = 'none';
            continue;
          }

          // Get sound switcher and message mode elements
          const soundSwitcher = document.querySelector('#voice, #beep, #silence');
          const isVoice = soundSwitcher && soundSwitcher.id === 'voice';
          const isBeep = soundSwitcher && soundSwitcher.id === 'beep';
          const messageMode = document.querySelector('#every-message, #mention-message');
          const isEveryMessageMode = messageMode && messageMode.id === 'every-message';
          const isMentionMessageMode = messageMode && messageMode.id === 'mention-message';

          // Check if the message contains a private indicator
          const privateMessageIndicator = '[шепчет вам]';
          const privateMessageContainer = node.querySelector('.room.private');
          const isPrivateMessage = privateMessageContainer && privateMessageContainer.textContent.includes(privateMessageIndicator);

          // If voice mode is enabled and the message is new, trigger text-to-speech
          if (isVoice && isInitializedChat && currentMessageText && currentMessageText !== previousMessageText) {
            localStorage.setItem('previousMessageText', currentMessageText);
            if (currentMessageUsername && !currentMessageUsername.includes(myNickname)) {
              const shouldRead = isEveryMessageMode || (isMentionMessageMode && isMention) || isPrivateMessage;
              if (shouldRead) {
                addMessageToQueue(currentMessageText);
              }
            }
          }

          // If beep mode is enabled and the message is new, play beep sound
          if (isBeep && isInitializedChat && currentMessageText && currentMessageText !== previousMessageText) {
            localStorage.setItem('previousMessageText', currentMessageText);
            if (currentMessageUsername && !currentMessageUsername.includes(myNickname)) {
              const shouldBeep = isEveryMessageMode || (isMentionMessageMode && isMention) || isPrivateMessage;
              if (shouldBeep) {
                const useMentionFrequency = !isEveryMessageMode || isMention;
                playBeep(useMentionFrequency ? mentionMessageFrequencies : usualMessageFrequencies, beepVolume);
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
            scrollMessagesToBottom();
            showPopupMessage();
            updatePersonalMessageCounts(); // Rethink when to call
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
