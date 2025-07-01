import {
  saveChatlogToIndexedDB,
  readChatlogFromIndexedDB,
  getTotalChatlogsSizeCached
} from './chatlogsStorage.js';

import { getCurrentLanguage } from '../../helpers/helpers.js';
import { settingsState } from "../settings/settings.js";
import { randomParam } from './chatlogs.js';
import { today } from '../../definitions.js';

const { ignored } = settingsState;

// --- Chatlog HTML size limit (shared constant) ---
const CHATLOG_SIZE_LIMIT_KB = 1000;
const CHATLOG_SIZE_LIMIT_BYTES = CHATLOG_SIZE_LIMIT_KB * 1024;

const lang = getCurrentLanguage();

// Function to fetch chat logs from the specified URL for a given date
export const fetchChatLogs = async (date, messagesContainer) => {
  // Clear the messagesContainer if it exists
  messagesContainer && (messagesContainer.innerHTML = '');

  const url = `https://klavogonki.ru/chatlogs/${date}.html`;

  const skippedResult = {
    chatlogs: [],
    url: url,
    size: 0,
    error: null,
    info: lang === 'ru' ? 'Пропущено: слишком большой лог.' : 'Skipped: chatlog too large.',
    placeholder: lang === 'ru' ? 'Пропущено: слишком большой лог.' : 'Skipped: chatlog too large.'
  };

  const fetchUrl = `${url}?rand=${randomParam}`;

  // Try to use IndexedDB if available
  let html;
  let loadedFromIndexedDB = false;
  const entry = await readChatlogFromIndexedDB(date);
  if (entry) {
    if (entry.skipped) {
      return skippedResult;
    } else if (entry.html) {
      html = entry.html;
      loadedFromIndexedDB = true;
    }
  }

  if (!html) {
    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const reader = response.body.getReader();
      let receivedLength = 0;
      let chunks = [];
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (value) {
          receivedLength += value.length;
          if (receivedLength > CHATLOG_SIZE_LIMIT_BYTES) {
            reader.cancel();
            if (date !== today) {
              await saveChatlogToIndexedDB({ date, skipped: true, reason: 'too large' });
            }
            return skippedResult;
          }
          chunks.push(value);
        }
        done = streamDone;
      }
      let htmlUint8 = new Uint8Array(receivedLength);
      let position = 0;
      for (let chunk of chunks) {
        htmlUint8.set(chunk, position);
        position += chunk.length;
      }
      html = new TextDecoder('utf-8').decode(htmlUint8);
      if (date !== today) {
        await saveChatlogToIndexedDB({ date, html });
      }
    } catch (error) {
      return {
        chatlogs: [],
        url: fetchUrl,
        size: 0,
        error: error.message,
        info: null,
        placeholder: lang === 'ru' ? 'Ошибка при обработке логов.' : 'Error processing logs.'
      };
    }
  }

  // Function to parse the HTML and extract chat log entries
  const parseChatLog = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    return [...doc.querySelectorAll('.ts')].map((timeElement) => {
      const usernameElement = timeElement.nextElementSibling;
      const messageNode = usernameElement?.nextSibling;

      const extractMessageText = (node) => {
        if (!node) return '';
        return [...node.childNodes].reduce((acc, child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            acc += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.tagName === 'A') {
              acc += child.getAttribute('href');
            } else if (child.tagName === 'BR') {
              return acc;
            }
          }
          return acc;
        }, '').trim();
      };

      if (usernameElement?.classList.contains('mn') && messageNode) {
        let messageText = '';

        if (messageNode.nodeType === Node.ELEMENT_NODE) {
          messageText = extractMessageText(messageNode);
        } else if (messageNode.nodeType === Node.TEXT_NODE) {
          const nextSibling = usernameElement.nextElementSibling;
          if (nextSibling && nextSibling.tagName === 'A') {
            messageText = `${messageNode.textContent.trim()} ${nextSibling.getAttribute('href')}`;
          } else {
            messageText = messageNode.textContent.trim();
          }
        }

        if (!messageText) {
          const combinedText = extractMessageText(usernameElement.nextSibling);
          messageText = combinedText;
        }

        return {
          time: timeElement.textContent.trim().replace(/[\[\]]/g, ''),
          username: usernameElement.textContent.trim().replace(/<|>/g, ''),
          message: messageText || null,
        };
      }

      const systemMessageElement = timeElement.nextElementSibling;
      if (systemMessageElement && systemMessageElement.classList.contains('mne')) {
        const messageText = systemMessageElement.textContent.trim();
        return {
          time: timeElement.textContent.trim().replace(/[\[\]]/g, ''),
          username: 'SYSTEM',
          message: messageText || null,
        };
      }

      return null;
    }).filter(Boolean);
  };

  const htmlContent = html.length > CHATLOG_SIZE_LIMIT_BYTES ? html.slice(0, CHATLOG_SIZE_LIMIT_BYTES) : html;
  const chatlogs = parseChatLog(htmlContent);
  const limitReached = html.length > CHATLOG_SIZE_LIMIT_BYTES;

  // Step 1: Remove consecutive duplicate messages
  const noSpamMessages = [];
  let lastMessage = null;
  for (const log of chatlogs) {
    const isDifferentMessage = log.message !== lastMessage?.message;
    const isDifferentUser = log.username !== lastMessage?.username;
    if (isDifferentMessage || isDifferentUser) {
      noSpamMessages.push(log);
      lastMessage = log;
    }
  }
  // Step 2: Filter out messages from ignored users
  const finalChatlogs = noSpamMessages.filter((log) => !ignored.includes(log.username));

  // Return the filtered chat logs, size of HTML, URL, and info
  const sizeInKB = (htmlContent.length / 1024).toFixed(2);

  // --- Calculate total size of all chatlogs in IndexedDB ---
  const totalIndexedDBSizeKB = getTotalChatlogsSizeCached();

  // Format cache size for display (GB if >= 1024 MB, MB if >= 1024 KB, else KB)
  function formatCacheSize(sizeKB) {
    const num = parseFloat(sizeKB);
    if (isNaN(num)) return sizeKB;
    if (num >= 1024 * 1024) return (num / (1024 * 1024)).toFixed(2) + (lang === 'ru' ? ' ГБ' : ' GB');
    if (num >= 1024) return (num / 1024).toFixed(2) + (lang === 'ru' ? ' МБ' : ' MB');
    return num.toFixed(2) + (lang === 'ru' ? ' КБ' : ' KB');
  }

  let placeholder = lang === 'ru' ? `Размер: ${sizeInKB} КБ` : `Size: ${sizeInKB} KB`;
  if (limitReached) {
    placeholder += lang === 'ru' ? ' (Достигнут лимит файла)' : ' (File limit reached)';
  } else {
    placeholder += loadedFromIndexedDB ? (lang === 'ru' ? ' (Кэш)' : ' (Cache)') : '';
  }
  if (totalIndexedDBSizeKB !== null && !isNaN(totalIndexedDBSizeKB)) {
    const formattedCacheSize = formatCacheSize(totalIndexedDBSizeKB);
    placeholder += lang === 'ru' ? ` | Кэш: ${formattedCacheSize}` : ` | Cache: ${formattedCacheSize}`;
  }

  return {
    chatlogs: finalChatlogs,
    url: url,
    size: htmlContent.length,
    info: limitReached
      ? (lang === 'ru' ? 'Достигнут лимит размера файла.' : 'File size limit reached.')
      : (loadedFromIndexedDB ? (lang === 'ru' ? 'Загружено из кэша.' : 'Loaded from cache.') : null),
    error: null,
    placeholder
  }
}