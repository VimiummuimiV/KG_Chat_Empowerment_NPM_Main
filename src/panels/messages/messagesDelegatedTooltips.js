import { createCustomTooltip } from "../../components/tooltip.js";
import { calibrateToMoscowTime } from "./messagesHelpers.js";

// Create custom tooltips for various message elements (time, username, text)
export function setupMessagesTooltips(cachedMessagesPanel) {
  createCustomTooltip('.message-time', cachedMessagesPanel, (el) => {
    const type = el.closest('.message-item')?.dataset.type;
    const ctrlRemoveEn = `[Ctrl + Click] Remove all messages starting from ${calibrateToMoscowTime(el.textContent)}`;
    const ctrlRemoveRu = `[Ctrl + Клик] Удалить все сообщения начиная с ${calibrateToMoscowTime(el.textContent)}`;
    if (type === 'private') {
      return {
        en: ctrlRemoveEn,
        ru: ctrlRemoveRu
      };
    }
    // For mention and all others, show all lines
    return {
      en: `
        [Click] Open chatlog at ${calibrateToMoscowTime(el.textContent)}
        [Shift + Click] Copy chatlogs URL to clipboard
        ${ctrlRemoveEn}
      `,
      ru: `
        [Клик] Открыть чатлог в ${calibrateToMoscowTime(el.textContent)}
        [Shift + Клик] Скопировать ссылку на чатлог
        ${ctrlRemoveRu}
      `
    };
  }, true);

  createCustomTooltip('.message-username', cachedMessagesPanel, (el) => ({
    en: `
      [Click] Open ${el.textContent} profile
      [Ctrl + Click] Remove all messages from ${el.textContent} user
    `,
    ru: `
      [Клик] Открыть профиль ${el.textContent}
      [Ctrl + Клик] Удалить все сообщения пользователя ${el.textContent}
    `
  }), true);

  createCustomTooltip('.message-text', cachedMessagesPanel, (el) => {
    const type = el.closest('.message-item')?.dataset.type;
    const firstLine = {
      private: {
        en: '[Click] Find this message in general chat',
        ru: '[Клик] Найти это сообщение в общем чате'
      },
      mention: {
        en: '[Click] Find this message in general chat or chatlog',
        ru: '[Клик] Найти это сообщение в общем чате или чатлоге'
      }
    };
    if (type === 'private' || type === 'mention') {
      return {
        en: `${firstLine[type].en} [Ctrl + Click] Remove only this message`,
        ru: `${firstLine[type].ru} [Ctrl + Клик] Удалить только это сообщение`
      };
    }
    return;
  }, true);
}