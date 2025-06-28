import { copyChatlogsUrlToClipboard } from '../../helpers/helpers.js';
import { removeMessage } from './messagesHelpers.js';
import { findGeneralChatMessage, findChatLogsMessage } from './messagesHelpers.js';
import { showChatLogsPanel } from '../chatlogs/chatlogs.js';
import { triggerTargetElement, triggerDimmingElement } from '../../helpers/elementVisibility.js';
import { calibrateToMoscowTime } from "./messagesHelpers.js";
import { timeColors } from '../../definitions.js';

export function setupMessagesEvents(messagesContainer, showMessagesPanel) {
  // Helper function to hide panels - extracted to avoid duplication
  function hidePanelsAfterMessageFound() {
    triggerTargetElement(messagesContainer.closest('.cached-messages-panel'), 'hide');
    triggerDimmingElement('hide');
  }

  messagesContainer.addEventListener('mouseover', function (event) {
    const timeEl = event.target.closest('.message-time');
    if (timeEl && messagesContainer.contains(timeEl)) {
      const messageItem = timeEl.closest('.message-item');
      if (!messageItem) return;
      const type = messageItem.dataset.type;
      if (type === 'mention' || type === 'private') {
        timeEl.style.color = type === 'mention' ? 'lightgreen' : 'peachpuff';
      }
    }
  });

  messagesContainer.addEventListener('mouseout', function (event) {
    const timeEl = event.target.closest('.message-time');
    if (timeEl && messagesContainer.contains(timeEl)) {
      const messageItem = timeEl.closest('.message-item');
      if (!messageItem) return;
      const type = messageItem.dataset.type;
      if (type === 'mention' || type === 'private') {
        timeEl.style.color = timeColors[type] || 'slategray';
      }
    }
  });

  messagesContainer.addEventListener('click', async function (event) {
    const timeEl = event.target.closest('.message-time');
    const usernameEl = event.target.closest('.message-username');
    const messageTextEl = event.target.closest('.message-text');
    const messageItem = event.target.closest('.message-item');
    if (!messageItem) return;

    if (timeEl && messageItem.contains(timeEl)) {
      const type = messageItem.dataset.type;
      let date;
      let prev = messageItem.previousElementSibling;
      while (prev && !prev.classList.contains('date-item')) {
        prev = prev.previousElementSibling;
      }
      if (prev) date = prev.dataset.date;
      if (type === 'mention' || type === 'private') {
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          copyChatlogsUrlToClipboard(date, calibrateToMoscowTime(timeEl.textContent), timeEl);
          return;
        }
        if (event.ctrlKey) {
          removeMessage(messageItem, 'from');
          return;
        }
        if (type === 'mention') {
          const url = `https://klavogonki.ru/chatlogs/${date}.html#${calibrateToMoscowTime(timeEl.textContent)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }
    }

    if (usernameEl && messageItem.contains(usernameEl)) {
      if (event.ctrlKey) {
        removeMessage(messageItem, 'all');
        return;
      }
      const userId = usernameEl.dataset.userId;
      if (userId) {
        const url = `https://klavogonki.ru/u/#/${userId}/`;
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        addShakeEffect(usernameEl);
      }
    }

    if (messageTextEl && messageItem.contains(messageTextEl)) {
      if (event.ctrlKey) {
        removeMessage(messageItem, 'single');
        return;
      }
      const username = messageItem.querySelector('.message-username')?.textContent;
      const time = messageItem.querySelector('.message-time')?.textContent;
      const type = messageItem.dataset.type;

      if (type === 'private') {
        requestAnimationFrame(async () => {
          const foundGeneralChatMessage = await findGeneralChatMessage(messageTextEl.textContent, username, true);
          if (foundGeneralChatMessage) {
            hidePanelsAfterMessageFound();
          }
        });
        return;
      }

      // For mention messages: search in general chat first, then chat logs if not found
      const foundGeneralChatMessage = await findGeneralChatMessage(messageTextEl.textContent, username, true);
      if (foundGeneralChatMessage) {
        hidePanelsAfterMessageFound();
      } else {
        // If message not found in general chat, try chat logs (only for mention messages)
        let previousElement = messageTextEl.parentElement.previousElementSibling;
        while (previousElement && !previousElement.classList.contains('date-item')) {
          previousElement = previousElement.previousElementSibling;
        }
        if (previousElement) {
          await showChatLogsPanel(previousElement.dataset.date);
          const messageTextForSearch = messageTextEl.textContent;
          requestAnimationFrame(() => {
            let tries = 0;
            const maxTries = 10;
            const interval = setInterval(async () => {
              const foundChatLogsMessage = await findChatLogsMessage(messageTextForSearch, username, true);
              if (foundChatLogsMessage) {
                clearInterval(interval);
              } else if (++tries >= maxTries) {
                clearInterval(interval);
                const chatLogsPanel = document.querySelector('.chat-logs-panel');
                triggerTargetElement(chatLogsPanel, 'hide');
                showMessagesPanel();
              }
            }, 200);
          });
        }
      }
    }
  });
}