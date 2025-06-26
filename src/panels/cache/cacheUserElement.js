import { getRandomEmojiAvatar } from "../../helpers/helpers.js";
import { getDataById } from "../../helpers/apiData.js";
import { updateVisitsEmoticon } from "./cacheHelpers.js";
import { rankOrder, rankColors } from "../../definitions.js";

/**
 * Creates a user element for the cache panel
 * @param {string} userId - The user ID
 * @param {Object} userData - The user data object
 * @returns {Object} Object containing userElement, sortData, and registered date
 */
export function createCachePanelUserElement(userId, userData) {
  const userElement = document.createElement('div');
  userElement.className = 'user-item';

  const avatarElement = document.createElement('div');
  avatarElement.className = 'avatar';
  const avatarTimestamp = userData.avatarTimestamp;
  const bigAvatarUrl = `/storage/avatars/${userId}_big.png`;
  if ((avatarTimestamp && avatarTimestamp !== '00') || (userData.avatar && Object.keys(userData.avatar).length)) {
    const imgElement = document.createElement('img');
    imgElement.src = `${bigAvatarUrl}?updated=${avatarTimestamp}`;
    imgElement.alt = `${userData.login}'s avatar`;
    imgElement.style.objectFit = 'cover';
    avatarElement.appendChild(imgElement);
  } else {
    avatarElement.innerHTML = getRandomEmojiAvatar();
  }

  const userDataElement = document.createElement('div');
  userDataElement.className = 'user-data';

  const loginContainer = document.createElement('div');
  loginContainer.className = 'login-container';

  const presentMarker = document.createElement('span');
  // Define marker first as gray
  presentMarker.className = 'present-marker waiting';

  const sortData = {
    isOnline: null,
    ratingLevel: userData.ratingLevel,
    cars: userData.cars,
    friends: userData.friends,
    bestSpeed: userData.bestSpeed || 0,
    order: rankOrder[userData.rank] || 10
  };

  if (typeof getDataById === 'function') {
    getDataById(userId, 'isOnline').then(isOnline => {
      presentMarker.classList.remove('waiting');
      presentMarker.className = `present-marker ${isOnline ? 'online' : 'offline'}`;
      sortData.isOnline = isOnline;
    }).catch(() => {
      console.error(`Failed to fetch online status for user ${userId}`);
      presentMarker.classList.remove('waiting');
      presentMarker.className = 'present-marker offline';
      sortData.isOnline = false;
    });
  }

  loginContainer.appendChild(presentMarker);

  const loginElement = document.createElement('a');
  loginElement.className = 'login';
  loginElement.textContent = userData.login;
  loginElement.href = `https://klavogonki.ru/profile/${userId}`;

  loginContainer.appendChild(loginElement);

  if (userData.visits !== undefined) {
    const visitsElement = document.createElement('span');
    visitsElement.className = `visits ${userData.tracked ? 'tracked' : 'untracked'}`;
    visitsElement.textContent = userData.visits;
    visitsElement.dataset.userId = userId;
    updateVisitsEmoticon(visitsElement);
    loginContainer.appendChild(visitsElement);
  }

  userDataElement.appendChild(loginContainer);

  const rankElement = document.createElement('div');
  rankElement.className = 'rank';
  rankElement.textContent = userData.rank || 'N/A';
  rankElement.style.color = rankColors[userData.rank] || 'white';
  userDataElement.appendChild(rankElement);

  const registeredElement = document.createElement('div');
  registeredElement.className = 'registered';
  registeredElement.textContent = userData.registered || 'N/A';
  userDataElement.appendChild(registeredElement);

  const createMetricElement = (className, color, icon, value, title, url) => {
    const element = document.createElement('span');
    element.className = className;
    element.style.color = color;
    element.innerHTML = `${icon}${value || 0}`;
    element.style.cursor = 'pointer';
    element.dataset.url = url;
    return element;
  };

  const userMetrics = document.createElement('div');
  userMetrics.className = "user-metrics";
  userMetrics.append(
    createMetricElement(
      'best-speed',
      'cyan',
      '🚀',
      userData.bestSpeed,
      'Best speed',
      `https://klavogonki.ru/u/#/${userId}/stats/normal/`
    ),

    createMetricElement(
      'rating-level',
      'gold',
      '⭐',
      userData.ratingLevel,
      'Rating level',
      `https://klavogonki.ru/top/rating/today?s=${userData.login}`
    ),

    createMetricElement(
      'cars-count',
      'lightblue',
      '🚖',
      userData.cars,
      'Cars count',
      `https://klavogonki.ru/u/#/${userId}/car/`
    ),

    createMetricElement(
      'friends-count',
      'lightgreen',
      '🤝',
      userData.friends,
      'Friends count',
      `https://klavogonki.ru/u/#/${userId}/friends/list/`
    )
  );

  userElement.append(avatarElement, userDataElement, userMetrics);

  return {
    userElement,
    sortData,
    registered: userData.registered
  };
}