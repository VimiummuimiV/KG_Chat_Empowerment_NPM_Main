// helpers
import { convertToSingleHours } from "./helpers.js";

export const debounceTimeout = 300;
// Define the base URL for user profiles
export const profileBaseUrl = "https://klavogonki.ru/u/#/";
// Actual nickname to use it as an exclusion for the message beep and voice notifications
export const myNickname = document.querySelector('.userpanel .user-block .user-dropdown .name span').textContent;
// Extract the user ID from the href attribute of the mail link for chat, direct profile, or messaging navigation
export const myUserId = document.querySelector('a.drop-btn.mail')?.href?.match(/\/u\/#\/(\d+)\/messages\//)?.[1];
// create today's date in the format 'YYYY-MM-DD'
export const today = new Intl.DateTimeFormat('en-CA').format(new Date());

export const emojiFaces = [
  // People Emojis (Facial expressions)
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆',
  '😉', '😊', '😋', '😎', '😏', '😐', '😑', '😒',
  '😓', '😔', '😕', '😖', '😗', '😘', '😙', '😚',
  '😜', '😝', '😛', '🤑', '🤗', '🤔', '🤐', '🤨',
  '😣', '😥', '😮', '🤯', '😳', '😱', '😨', '😰',
  '😢', '🤪', '😵', '😲', '🤤', '😷', '🤒', '🤕',
  '🤢', '🤧', '😇', '🥳', '🥺', '😬', '😴', '😌',
  '🤥', '🥴', '🥵', '🥶', '🤧', '🤭', '🤫', '😠',
  '😡', '😳', '😞', '😟', '😕',

  // Cat Emojis (Expressive faces of cats)
  '🐱', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',

  // Other Animal Emojis (Various animals' faces)
  '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
  '🙈', '🙉', '🙊', '🐔', '🦄'
];

export let state = {
  lastFocusedIframeTextarea: null,
  bigImageEvents: {},
  panelsEvents: {},
  // Remove the extra closing parenthesis after getItem('fetchedUsers')
  fetchedUsers: JSON.parse(localStorage.getItem('fetchedUsers')) || {}
};

// Timeout before the dynamicChatNotification should be removed
export const dynamicChatNotificationTimeout = 5000;

const defaultCacheRefreshThresholdHours = 24;
export const cacheRefreshThresholdHours = convertToSingleHours(
  localStorage.getItem('cacheRefreshThresholdHours') ||
  (localStorage.setItem('cacheRefreshThresholdHours', defaultCacheRefreshThresholdHours), defaultCacheRefreshThresholdHours)
);

// List of trusted domains
export const trustedDomains = [
  'klavogonki.ru',
  'youtube.com', // youtube main
  'youtu.be', // youtube share
  'imgur.com',
  'pikabu.ru',
  'userapi.com', // vk.com
  'ibb.co', // imgbb.com
  'yaplakal.com',
  'freepik.com'
];
