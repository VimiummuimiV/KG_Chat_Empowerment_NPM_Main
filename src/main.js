import "./style.css"; // styles

import { convertImageLinksToImage } from "./modules/converters/image-converter.js"; // image converter
import { convertVideoLinksToPlayer } from "./modules/converters/video-converter.js"; // video converter

import { createMessageModeButton } from "./modules/message-mode.js"; // message mode button
import { createSoundSwitcherButton } from "./modules/sound-mode.js"; // sound switcher button

import { createCacheButton } from "./modules/panels/cache.js"; // cache panel
import { createMessagesButton } from "./modules/panels/messages.js"; // messages panel
import { createChatLogsButton } from "./modules/panels/chatlogs.js"; // chatlogs panel
import { createSettingsButton } from "./modules/panels/settings.js"; // settings panel

// helpers && helpers definitions
import {
  // helpers
  processEncodedLinks,
  refreshFetchedUsers,
  scrollMessagesToBottom,
  highlightMentionWords,
  removeIgnoredUserMessages,
  locationHas
} from "./modules/helpers.js";

// chat
import {
  // helpers
  restoreChatTab,
  setChatFieldFocus,
  setupInputBackup,
  setupChatInputListener,
  restoreChatState,
  groupChatMessages,
  applyDynamicBackgroundColor
} from "./modules/chat/chat-workers.js";

import { setupFonts } from "./modules/fonts.js"; // fonts
import { refreshUserList } from "./modules/chat/chat-userlist.js"; // chat userlist
import ChatMessagesRemover from "./modules/chat/chat-messages-remover.js"; // chat messages remover
import { pruneDeletedMessages } from "./modules/chat/chat-messages-remover.js";
import { createChatUserCounter } from "./modules/users-counter.js"; // counter
import { startChatUserObserver } from "./modules/chat/chat-users-observer.js"; // users observer

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
    createChatUserCounter(empowermentPanel);
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
        scrollMessagesToBottom();
        refreshFetchedUsers(false, cacheRefreshThresholdHours);
        refreshUserList();
        setChatFieldFocus();
        chatMessagesRemover.updateDeletedMessages();
        setupChatInputListener();
        pruneDeletedMessages();
        setTimeout(() => (isInitializedChat = true), 100);
      }
    }
  });

  // Start observing the DOM for changes
  waitForChatObserver.observe(document, { childList: true, subtree: true });

})();