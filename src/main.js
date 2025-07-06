import "./style.scss";

import {
  locationHas,
  shouldEnable
} from "./helpers/helpers.js";

import { highlightMentionWords } from "./helpers/getLatestMessageData.js";
import { processEncodedLinks } from "./helpers/urlUtils.js";
import { refreshFetchedUsers } from "./panels/cache/cacheHelpers.js";
import { removeIgnoredUserMessages } from "./chat/chatIgnore.js";
import { addTrackedIconsToUsernames } from "./chat/chatTracked.js";
import { parsePersonalMessages } from "./panels/messages/messagesParser.js";

import {
  restoreChatTab,
  setChatFieldFocus,
  setupInputBackup,
  setupChatInputListener,
  restoreChatState,
  groupChatMessages,
  applyDynamicBackgroundColor
} from "./chat/chatWorkers.js";

import { scrollToBottom } from "./helpers/scrollTo.js";
import { setupFonts } from "./components/fonts.js";
import { createEmpowermentPanel } from "./components/empowermentPanel.js";
import { refreshUserList } from "./chat/chatUserlist.js";
import ChatMessagesRemover from "./chat/chatMessagesRemover/chatMessagesRemover.js";
import { pruneDeletedMessages } from "./chat/chatMessagesRemover/chatMessagesRemover.js";
import { createChatUserCounter } from "./components/participantCount.js";
import { startChatUserObserver } from "./chat/chatUsersObserver.js";
import { startChatMessagesObserver } from "./chat/chatMessagesObserver.js"
import { initChatEvents } from "./components/popupLengthIndicator.js";

import { convertImageLinksToImage } from "./converters/imageConverter.js";
import { convertVideoLinksToPlayer } from "./converters/videoConverter.js";

import { createMessageModeButton } from "./components/mode/messageMode.js";
import { createSoundSwitcherButton } from "./components/mode/soundMode.js";

import { createCacheButton } from "./panels/cache/cacheHelpers.js";
import { createMessagesButton } from "./panels/messages/messages.js";
import { createChatLogsButton } from "./panels/chatlogs/chatlogs.js";
import { createSettingsButton } from "./panels/settings/settings.js";

// definitions
import {
  cacheRefreshThresholdHours,
  today
} from "./definitions.js";

// Skip reading the messages on page load to read them normally when the user is present and the page is stable
export let isInitializedChat = false;

(() => { // This is the recommended way for safety and isolation
  // Prevent running the script inside an iframe
  if (window.self !== window.top) {
    return;
  }

  // Initialize all fonts with one call
  setupFonts();

  // Creates an empowerment panel and appends it to the document body (now imported)
  const empowermentPanel = createEmpowermentPanel();

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
        addTrackedIconsToUsernames();
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
        parsePersonalMessages(today);
      }
    }
  });

  // Start observing the DOM for changes
  waitForChatObserver.observe(document, { childList: true, subtree: true });

})();