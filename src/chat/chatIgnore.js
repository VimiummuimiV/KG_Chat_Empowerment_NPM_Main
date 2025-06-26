import { getChatElements } from "./chatDomUtils.js";
import { settingsState } from "../panels/settings/settings.js";
const { ignored } = settingsState;

// Function to convert Cyrillic characters to Latin
function convertCyrillicToLatin(input) {
  const cyrillicToLatinMap = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
    'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': 'y', // 'ъ' maps to 'y'
    'Ы': 'Y', 'Ь': 'i', // 'ь' maps to 'i'
    'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': 'y', // 'ъ' maps to 'y'
    'ы': 'y', 'ь': 'i', // 'ь' maps to 'i'
    'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  // Convert the input string to Latin using the mapping
  return input.split('').map(char => cyrillicToLatinMap[char] || char).join('');
}

// Function to convert Russian usernames
export function convertRussianUsernameToLatin(username) {
  // Use the conversion function on the username
  return convertCyrillicToLatin(username);
}

// ---- Chat ignored messages remover ----
export function removeIgnoredUserMessages() {
  const { allMessages } = getChatElements(); // Get all messages from getChatElements

  allMessages.forEach(message => {
    const usernameElement = message.querySelector('.username'); // Adjust selector if needed
    const username = usernameElement?.textContent?.replace(/[<>]/g, '') || null;
    const messageText = message.textContent || '';

    // Hide message if the sender is ignored
    if (username && ignored.includes(username)) {
      const latinUsername = `from-${convertRussianUsernameToLatin(username)}`;
      message.classList.add('ignored-user', latinUsername);
      message.style.display = 'none';
      return;
    }

    // Hide message if it is addressed to an ignored user (e.g., "username," or "username ")
    let addressedUsername = null;
    if (/^[^\s,]+,/.test(messageText)) {
      addressedUsername = messageText.split(',')[0].trim();
    } else if (/^[^\s]+ /.test(messageText)) {
      addressedUsername = messageText.split(' ')[0].trim();
    }
    if (addressedUsername && ignored.includes(addressedUsername)) {
      const latinAddressedUsername = `to-${convertRussianUsernameToLatin(addressedUsername)}`;
      message.classList.add('ignored-user', latinAddressedUsername);
      message.style.display = 'none';
      return;
    }

    // Hide message if it contains any ignored username anywhere in the text
    if (ignored.some(ignoredUser => messageText.includes(ignoredUser))) {
      ignored.forEach(ignoredUser => {
        if (messageText.includes(ignoredUser)) {
          const latinIgnored = `to-${convertRussianUsernameToLatin(ignoredUser)}`;
          message.classList.add('ignored-user', latinIgnored);
        }
      });
      message.style.display = 'none';
    }
  });
}
