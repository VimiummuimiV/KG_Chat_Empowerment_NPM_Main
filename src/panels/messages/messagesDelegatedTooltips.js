import { createCustomTooltip } from "../../components/tooltip.js";
import { calibrateToMoscowTime } from "./messagesHelpers.js";

// Create custom tooltips for various message elements (time, username, text)
export function setupMessagesTooltips(cachedMessagesPanel) {
  createCustomTooltip('.message-time', cachedMessagesPanel, (el) => ({
    en: `
      [Click] Open chatlog at ${calibrateToMoscowTime(el.textContent)}
      [Shift + Click] Copy chatlogs URL to clipboard
      [Ctrl + Click] Remove all messages starting from ${calibrateToMoscowTime(el.textContent)}
    `,
    ru: `
      [Клик] Открыть чатлог в ${calibrateToMoscowTime(el.textContent)}
      [Shift + Клик] Скопировать ссылку на чатлог
      [Ctrl + Клик] Удалить все сообщения начиная с ${calibrateToMoscowTime(el.textContent)}
    `
  }), true);

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

  createCustomTooltip('.message-text', cachedMessagesPanel, (el) => ({
    en: `
      [Click] Search for this message
      [Ctrl + Click] Remove only this message
    `,
    ru: `
      [Клик] Найти это сообщение
      [Ctrl + Клик] Удалить только это сообщение
    `
  }), true);
}