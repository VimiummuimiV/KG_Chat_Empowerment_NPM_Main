import "./style.css"; // general styles

import {
  processEncodedLinks,
  refreshFetchedUsers,
  scrollToBottom,
  highlightMentionWords,
  removeIgnoredUserMessages,
  locationHas,
  shouldEnable
} from "./modules/helpers.js"; // helpers

import {
  restoreChatTab,
  setChatFieldFocus,
  setupInputBackup,
  setupChatInputListener,
  restoreChatState,
  groupChatMessages,
  applyDynamicBackgroundColor
} from "./modules/chat/chat-workers.js"; //chat

import { setupFonts } from "./modules/fonts.js"; // fonts
import { refreshUserList } from "./modules/chat/chat-userlist.js"; // chat userlist
import ChatMessagesRemover from "./modules/chat/chat-messages-remover/chat-messages-remover.js"; // chat messages remover
import { pruneDeletedMessages } from "./modules/chat/chat-messages-remover/chat-messages-remover.js";
import { createChatUserCounter } from "./modules/participant-count.js"; // counter
import { startChatUserObserver } from "./modules/chat/chat-users-observer.js"; // users observer
import { startChatMessagesObserver } from "./modules/chat/chat-messages-observer.js" // messages observer
import { initChatEvents } from "./modules/popup-length-indicator.js"; // popup length indicator

import { convertImageLinksToImage } from "./modules/converters/image-converter.js"; // image converter
import { convertVideoLinksToPlayer } from "./modules/converters/video-converter.js"; // video converter

import { createMessageModeButton } from "./modules/message-mode.js"; // message mode button
import { createSoundSwitcherButton } from "./modules/sound-mode.js"; // sound switcher button

import { createCacheButton } from "./modules/panels/cache/cache.js"; // cache panel
import { createMessagesButton } from "./modules/panels/messages/messages.js"; // messages panel
import { createChatLogsButton } from "./modules/panels/chatlogs/chatlogs.js"; // chatlogs panel
import { createSettingsButton } from "./modules/panels/settings/settings.js"; // settings panel

// definitions
import {
  cacheRefreshThresholdHours
} from "./modules/definitions.js";

// Skip reading the messages on page load to read them normally when the user is present and the page is stable
export let isInitializedChat = false;

(() => { // This is the recommended way for safety and isolation

  // Initialize all fonts with one call
  setupFonts();

  // Creates an empowerment panel and appends it to the document body
  const empowermentPanel = (() => {
    const panel = document.createElement('div');
    panel.classList.add("empowerment-panel");
    document.body.appendChild(panel);
    return panel;
  })();

  // 1 ======================================================================
  // Check if the current location is 'gmid' or 'gamelist'
  if (locationHas('gmid') || locationHas('gamelist')) {
    const shouldCreateCounter = shouldEnable('elements', 'counter');
    if (shouldCreateCounter) {
      createChatUserCounter(empowermentPanel);
    }
    applyDynamicBackgroundColor();
  }
  // ========================================================================


  // Check if the current location is 'gmid' or 'gamelist'
  if (locationHas('gmid') || locationHas('gamelist')) {
    // 2 ======================================================================
    createSoundSwitcherButton(empowermentPanel);
    // ========================================================================

    // 3 ======================================================================
    createMessageModeButton(empowermentPanel);
    // ========================================================================
  }

  // 4 ======================================================================
  createCacheButton(empowermentPanel);
  // ========================================================================

  // 5 ======================================================================
  createMessagesButton(empowermentPanel);
  // ========================================================================

  // 6 ======================================================================
  createChatLogsButton(empowermentPanel);
  // ========================================================================

  // 7 ======================================================================
  createSettingsButton(empowermentPanel);
  // ========================================================================


  // OBSERVERS
  // 1 ======================================================================
  startChatMessagesObserver();
  // ========================================================================

  // 2 ======================================================================
  startChatUserObserver();
  // ========================================================================

  // Check if the current location is 'gmid' or 'gamelist'
  if (!(locationHas('gmid') || locationHas('gamelist'))) return;

  // Instantiate ChatMessagesRemover before using it
  const chatMessagesRemover = new ChatMessagesRemover();

  // Create a new MutationObserver to wait for the chat to fully load with all messages
  let waitForChatObserver = new MutationObserver(() => {
    // Get the container for all chat messages
    const messagesContainer = document.querySelector('.messages-content div');
    // Get all the message elements from messages container
    const messages = document.querySelectorAll('.messages-content div p');

    // Check if the chat element has been added to the DOM
    if (document.contains(messagesContainer)) {
      restoreChatState();
      // Check if there are at least 20 messages in the container
      if (messages.length >= 20) {
        waitForChatObserver.disconnect();
        removeIgnoredUserMessages();
        convertImageLinksToImage('generalMessages');
        convertVideoLinksToPlayer('generalMessages');
        processEncodedLinks('generalMessages');
        window.location.href.includes('gmid') && restoreChatTab();
        setupInputBackup('#chat-general .text');
        highlightMentionWords();
        groupChatMessages();
        scrollToBottom('generalMessages', 350);
        refreshFetchedUsers(false, cacheRefreshThresholdHours);
        refreshUserList();
        setChatFieldFocus();
        chatMessagesRemover.updateDeletedMessages();
        setupChatInputListener();
        pruneDeletedMessages();
        setTimeout(() => { initChatEvents() }, 600);
        setTimeout(() => (isInitializedChat = true), 600);
      }
    }
  });

  // Start observing the DOM for changes
  waitForChatObserver.observe(document, { childList: true, subtree: true });

})();