import { getCurrentLanguage } from "../../helpers/helpers.js";

let lang = getCurrentLanguage();

const icons = {
  'first': '🙌',
  'crossed': '❌',
  'check': '✅',
  'stop': '🛑'
};

export function getUserChatDuration(username, actionTime) {
  // Retrieve stored user data and find the target user by login
  const user = Object.values(JSON.parse(localStorage.getItem('fetchedUsers') || '[]'))
    .find(u => u?.login === username);
  if (!user) return
  (lang === 'en')
    ? `${icons.crossed} User "${username}" not found`
    : `${icons.crossed} Пользователь "${username}" не найден`;

  const actionLog = user.actionLog || [];
  const current = actionLog.find(entry => entry.timestamp === actionTime);
  if (!current) return
  (lang === 'en')
    ? `${icons.crossed} Action not found at ${actionTime}`
    : `${icons.crossed} Действие не найдено в ${actionTime}`; 

  const actionIndex = actionLog.indexOf(current);
  if (actionIndex === 0) return (lang === 'en')
    ? `${icons.first} ${username}'s first action`
    : `${icons.first} ${username} зашёл впервые`;

  // Find the most recent action before the current one that has a different type
  const prev = actionLog.slice(0, actionIndex).reverse().find(a => a.type !== current.type);
  if (!prev) return (lang === 'en')
    ? `${icons.crossed} No valid previous action found for ${actionTime}`
    : `${icons.crossed} Не найдено предыдущего действия для ${actionTime}`;

  // Calculate the duration between the two timestamps
  const duration = calculateDuration(prev.timestamp, current.timestamp);
  return current.type === 'leave'
    ? (lang === 'en')
      ? `${icons.stop} ${username} left the chat after ${duration}`
      : `${icons.stop} ${username} покинул чат спустя ${duration}`
    : (lang === 'en')
      ? `${icons.check} ${username} stayed in chat for ${duration}`
      : `${icons.check} ${username} остался в чате на ${duration}`;
}

function calculateDuration(start, end) {
  const toSeconds = t => t.split(':').reduce((acc, val, i) =>
    acc + val * [3600, 60, 1][i], 0); // Convert HH:MM:SS to total seconds

  const diff = Math.abs(toSeconds(end) - toSeconds(start)); // Get absolute difference in seconds

  return [
    Math.floor(diff / 3600), // Hours
    Math.floor((diff % 3600) / 60), // Minutes
    diff % 60 // Seconds
  ].map(n => n.toString().padStart(2, '0')).join(':'); // Format as HH:MM:SS
}

export function isVisibleInContainer(el, container) {
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return (
    elRect.top >= containerRect.top &&
    elRect.bottom <= containerRect.bottom
  );
}