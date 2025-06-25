import {
  trackedSVG,
  ignoredSVG,
  moderatorSVG
} from "../icons.js"; // icons

import {
  myUserId,
  profileBaseUrl,
  state
} from "../definitions.js"; // definitions

// Define dynamic variables
let {
  fetchedUsers
} = state;

import { settingsState } from "../panels/settings/settings.js" // settings
const { usersToTrack, ignored, moderator } = settingsState

import {
  // helpers
  getRandomEmojiAvatar,
  // helpers definitions
  isCtrlKeyPressed
} from "../helpers.js"; // helpers

import { getUserProfileData } from "../helpers/userProfileData.js";

import { createCustomTooltip } from "../tooltip.js"; // tooltip
import { updateUserCountText } from "../panels/cache/cache.js"; // cache panel
import { isInitializedChat } from "../../main.js";
import { addShakeEffect } from "../animations.js"; // animations
import { insertPrivate } from "./chat-workers.js"; // chat workers
import { loadProfileIntoIframe } from "../helpers/iframeProfileLoader.js"; // iframe profile loader

// Function to get rank information (class, color, and icon) based on status title in English
export function getRankInfo(mainTitle) {
  const statusData = {
    'Экстракибер': { class: 'extra', icon: '🚀', color: '#06B4E9' },
    'Кибергонщик': { class: 'cyber', icon: '🤖', color: '#5681ff' },
    'Супермен': { class: 'superman', icon: '👊', color: '#B543F5' },
    'Маньяк': { class: 'maniac', icon: '🔪', color: '#DA0543' },
    'Гонщик': { class: 'racer', icon: '⚡️️', color: '#FF8C00' },
    'Профи': { class: 'profi', icon: '️💼️', color: '#C1AA00' },
    'Таксист': { class: 'driver', icon: '🚖️', color: '#2DAB4F' },
    'Любитель': { class: 'amateur', icon: '🍆️', color: '#61B5B3' },
    'Новичок': { class: 'newbie', icon: '🐥', color: '#AFAFAF' }
  };

  const defaultData = { class: 'unknown', icon: '❓', color: '#000000' };
  const rankInfo = statusData[mainTitle] || defaultData;

  if (rankInfo.class === defaultData.class) {
    console.log(`Class not found for status title: ${mainTitle}. Using default class: ${defaultData.class}`);
  }

  return rankInfo;
}

function createCircularProgress(percentage, color, isRevoked) {
  const svgUrl = "http://www.w3.org/2000/svg";
  const size = 20;
  const center = size / 2;
  const strokeWidth = 2;
  const radius = center - strokeWidth;
  const diameter = radius * 2;
  const randomString = Math.random().toString(36).substring(2, 22);
  const scaleMultiplier = !isRevoked && percentage === 0 ? 0.6 : 1;

  const svg = document.createElementNS(svgUrl, "svg");
  Object.entries({
    width: size, height: size, viewBox: `0 0 ${size} ${size}`, xmlns: svgUrl
  }).forEach(([k, v]) => svg.setAttribute(k, v));
  svg.classList.add("circularProgress");

  if (isRevoked || percentage === 0) {
    if (!isRevoked) {
      const outerCircle = document.createElementNS(svgUrl, "circle");
      Object.entries({
        cx: center, cy: center, r: radius, fill: "none", stroke: color, "stroke-width": strokeWidth
      }).forEach(([k, v]) => outerCircle.setAttribute(k, v));
      outerCircle.classList.add("outerCircle");
      svg.appendChild(outerCircle);
    }

    const scale = (size / 24) * scaleMultiplier;
    const offset = center - 12 * scale;
    const closeIconGroup = document.createElementNS(svgUrl, "g");
    closeIconGroup.setAttribute("transform", `translate(${offset}, ${offset}) scale(${scale})`);
    closeIconGroup.classList.add("closeIconGroup");

    const path = document.createElementNS(svgUrl, "path");
    Object.entries({
      d: "M18.364 5.636a1 1 0 0 1 0 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12l-4.95-4.95a1 1 0 0 1 1.414-1.414L12 10.586l4.95-4.95a1 1 0 0 1 1.414 0z",
      fill: color
    }).forEach(([k, v]) => path.setAttribute(k, v));

    closeIconGroup.appendChild(path);
    svg.appendChild(closeIconGroup);
  } else {
    const defs = document.createElementNS(svgUrl, "defs");
    defs.classList.add("defs");

    const clipPath = document.createElementNS(svgUrl, "clipPath");
    clipPath.setAttribute("id", `clipInner-${randomString}`);
    clipPath.classList.add("clipPath");

    const clipRect = document.createElementNS(svgUrl, "rect");
    Object.entries({
      x: center - radius, y: center - radius, width: diameter, height: 0, transform: `rotate(180, ${center}, ${center})`
    }).forEach(([k, v]) => clipRect.setAttribute(k, v));
    clipRect.classList.add("clipRect");

    const animate = document.createElementNS(svgUrl, "animate");
    Object.entries({
      attributeName: "height",
      from: 0,
      to: diameter * (percentage / 100),
      begin: "indefinite",
      dur: "1s",
      fill: "freeze",
      calcMode: "spline",
      keySplines: "0.4 0 0.2 1", // Fast start, smooth stop
      keyTimes: "0;1"
    }).forEach(([k, v]) => animate.setAttribute(k, v));
    animate.classList.add("animateProfileProgress");

    clipRect.appendChild(animate);
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);

    const outerCircle = document.createElementNS(svgUrl, "circle");
    Object.entries({
      cx: center, cy: center, r: radius, fill: "none", stroke: color, "stroke-width": strokeWidth
    }).forEach(([k, v]) => outerCircle.setAttribute(k, v));
    outerCircle.classList.add("outerCircle");
    svg.appendChild(outerCircle);

    const innerCircle = document.createElementNS(svgUrl, "circle");
    Object.entries({
      cx: center, cy: center, r: radius, fill: color, "clip-path": `url(#clipInner-${randomString})`
    }).forEach(([k, v]) => innerCircle.setAttribute(k, v));
    innerCircle.classList.add("innerCircle");
    svg.appendChild(innerCircle);
  }

  return svg.outerHTML;
}

/**
 * Calculates the percentage of a given number within its nearest range.
 * The function dynamically determines the range based on the input value.
 *
 * @param {number} value - The input value to calculate the percentage for.
 * @returns {number} - The percentage of the input value within its identified range.
 */
function calculatePercentage(value) {
  // Determine the lower bound of the range (this is smart, not hardcoded)
  const lowerBound = Math.floor(value / 100) * 100; // Nearest lower multiple of 100
  const upperBound = lowerBound + 100; // Nearest upper multiple of 100

  // Calculate the percentage within the identified range
  const percentage = ((value - lowerBound) / (upperBound - lowerBound)) * 100;

  return percentage;
}

// Function to create a user element with avatar, name, and profile link based on user details
function createUserChatElement(userId, mainTitle, userName, bestSpeed, isRevoked) {
  const avatarTimestamp = fetchedUsers?.[userId]?.avatarTimestamp;

  // Ensure the bigAvatarUrl is only constructed if avatarTimestamp is not '00'
  const bigAvatarUrl = avatarTimestamp !== '00' ? `/storage/avatars/${userId}_big.png?updated=${avatarTimestamp}` : '';

  const newUserElement = document.createElement('div');
  // Get rank information (class, color, icon)
  const rankInfo = getRankInfo(mainTitle);
  const rankClass = rankInfo.class; // Rank class
  const rankColor = rankInfo.color; // Rank color
  const rankIcon = rankInfo.icon; // Rank icon (emoji)

  newUserElement.classList.add(`user${userId}`, rankClass); // Assign the rank class

  const newAvatarElement = document.createElement('div');
  newAvatarElement.classList.add('avatar');

  // Only create and append an image element if avatarTimestamp is not '00'
  if (avatarTimestamp !== '00') {
    const avatarImage = document.createElement('img');
    avatarImage.src = bigAvatarUrl;
    newAvatarElement.appendChild(avatarImage);
  } else {
    newAvatarElement.style.fontSize = '1.8rem';
    // Insert a random SVG icon instead of an image when avatarTimestamp is '00'
    newAvatarElement.innerHTML = getRandomEmojiAvatar();
  }

  const newNameElement = document.createElement('a');
  newNameElement.classList.add('name');
  createCustomTooltip(newNameElement, {
    en: 'Send private message',
    ru: 'Отправить приватное сообщение'
  });
  newNameElement.dataset.user = userId;
  newNameElement.textContent = userName;

  newNameElement.style.setProperty('color', rankColor, 'important');

  const newProfileElement = document.createElement('a');
  newProfileElement.classList.add('profile');
  const title = `${rankIcon} ${mainTitle} - ${bestSpeed}`;
  createCustomTooltip(newProfileElement, title);
  newProfileElement.target = '_blank';
  newProfileElement.href = `/profile/${userId}/`;
  let circularProgress = createCircularProgress(calculatePercentage(bestSpeed), rankColor, isRevoked);
  // Use circular progress element for profile navigation from new chat user list
  newProfileElement.innerHTML = circularProgress;
  // Start animation after element is in DOM
  setTimeout(() => {
    const animateElement = newProfileElement.querySelector('.animateProfileProgress');
    if (animateElement) animateElement.beginElement();
  }, 10);
  // Add event listener click with Hold Ctrl Key to open profile into iframe
  newProfileElement.addEventListener('click', function (event) {
    event.preventDefault();
    if (isCtrlKeyPressed) {
      // Open the profile in a new tab
      window.open(profileBaseUrl + userId, '_blank');
    } else {
      // Load the profile into the iframe
      loadProfileIntoIframe(profileBaseUrl + userId);
    }
  });

  // Construct the URL for the messaging interface between two users
  const messageInProfile = `${profileBaseUrl}${myUserId}/messages/${userId}/`;

  // Attach a click event listener to the newNameElement element
  newNameElement.addEventListener('click', function (event) {
    // Check if both Ctrl and Shift keys are pressed during the click event
    if (event.ctrlKey && event.shiftKey) {
      // If both keys are pressed, open the messaging URL in a new tab
      const newTab = window.open(messageInProfile, '_blank');
      if (newTab) newTab.focus(); // Attempt to make the new tab active
    }
    // Check if only the Ctrl key is pressed
    else if (event.ctrlKey) {
      // If Ctrl is pressed, load the messaging interface URL into the iframe
      loadProfileIntoIframe(messageInProfile);
    }
    // If neither Ctrl nor Shift is pressed, initiate a private chat message
    else {
      // The insertPrivate function handles sending a private message to the specified user
      insertPrivate(userId);
    }
  });

  newUserElement.appendChild(newAvatarElement);
  newUserElement.appendChild(newNameElement);
  newUserElement.appendChild(newProfileElement);

  // Check if there is a user in 'usersToTrack' array by their name and state
  const userToTrack = usersToTrack.find((user) =>
    user.name === userName && user.state === 'thawed'
  );

  if (userToTrack) {
    const trackedIcon = document.createElement('div');
    createCustomTooltip(trackedIcon, {
      en: 'Tracked user',
      ru: 'Отслеживаемый пользователь'
    });
    trackedIcon.classList.add('tracked');
    trackedIcon.innerHTML = trackedSVG;
    newUserElement.appendChild(trackedIcon);
  }

  // Check if the user is in the ignore list
  const isIgnoredUser = ignored.includes(userName);

  // Create and hide a message element if the user is in ignored
  if (isIgnoredUser) {
    const ignoredIcon = document.createElement('div');
    createCustomTooltip(ignoredIcon, {
      en: 'Ignored user',
      ru: 'Игнорируемый пользователь'
    });
    ignoredIcon.classList.add('ignored');
    ignoredIcon.innerHTML = ignoredSVG;
    newUserElement.appendChild(ignoredIcon);
  }

  // Check if there is an <img> element with a src attribute containing the word "moderator" inside the <ins> element
  const hasModeratorIcon = document.querySelector(`.userlist-content ins.user${userId} img[src*="moderator"]`);

  // Check if the user is in the moderator list
  const isModerator = moderator.includes(userName);

  // If a moderator icon is found or the current user is in the moderator array, append the moderator icon.
  if (hasModeratorIcon || isModerator) {
    const moderatorIcon = document.createElement('div');
    createCustomTooltip(moderatorIcon, {
      en: 'Moderator',
      ru: 'Модератор'
    });
    moderatorIcon.classList.add('moderator');
    moderatorIcon.innerHTML = moderatorSVG; // Assuming 'moderatorSVG' contains the SVG for the icon
    newUserElement.appendChild(moderatorIcon);
  }

  return newUserElement;
}

// Function to update users in the custom chat
export async function refreshUserList(retrievedLogin, actionType) {
  try {
    // Get the original user list container
    const originalUserListContainer = document.querySelector('.userlist-content');

    // Get or create the user list container
    let userListContainer = document.querySelector('.chat-user-list');
    if (!userListContainer) {
      userListContainer = document.createElement('div');
      userListContainer.classList.add('chat-user-list');

      // Find the element with the class "userlist"
      const userlistElement = document.querySelector('.userlist');

      // Append the userListContainer to the userlistElement if found
      if (userlistElement) {
        userlistElement.appendChild(userListContainer);
      }
    }

    // Define the rank order
    const rankOrder = ['extra', 'cyber', 'superman', 'maniac', 'racer', 'profi', 'driver', 'amateur', 'newbie'];

    // Create an object to store subparent elements for each rank class
    const rankSubparents = {};

    // Check if subparent elements already exist, if not, create them
    rankOrder.forEach(rankClass => {
      const existingSubparent = userListContainer.querySelector(`.rank-group-${rankClass}`);
      if (!existingSubparent) {
        rankSubparents[rankClass] = document.createElement('div');
        rankSubparents[rankClass].classList.add(`rank-group-${rankClass}`);
        userListContainer.appendChild(rankSubparents[rankClass]);
      } else {
        rankSubparents[rankClass] = existingSubparent;
      }
    });

    // Create a set to store existing user IDs in the updated user list
    const existingUserIds = new Set();

    // Iterate over each user element in the original user list
    for (const userElement of originalUserListContainer.querySelectorAll('ins')) {
      const nameElement = userElement.querySelector('.name');
      const userId = nameElement.getAttribute('data-user');
      const userName = nameElement.textContent;

      // Check if the user already exists in the updated user list
      if (!existingUserIds.has(userId)) {
        try {
          // Retrieve the user's profile data
          const { rank: mainTitle, login, registeredDate, bestSpeed, ratingLevel, friends, cars, avatarTimestamp } = await getUserProfileData(userId);

          // If the user data is not already stored in the fetchedUsers object
          if (!fetchedUsers[userId]) {
            // Set rank, login, registeredDate, bestSpeed, ratingLevel, friends, cars, and avatarTimestamp
            fetchedUsers[userId] = {
              rank: mainTitle,
              login,
              registered: registeredDate,
              bestSpeed,
              ratingLevel,
              friends,
              cars,
              avatarTimestamp
            };
          } else {
            // Update the user's data
            fetchedUsers[userId].rank = mainTitle;
            fetchedUsers[userId].login = login;
            fetchedUsers[userId].registered = registeredDate;
            fetchedUsers[userId].bestSpeed = bestSpeed;
            fetchedUsers[userId].ratingLevel = ratingLevel;
            fetchedUsers[userId].friends = friends;
            fetchedUsers[userId].cars = cars;
            fetchedUsers[userId].avatarTimestamp = avatarTimestamp;
          }

          // Logging user action (enter or leave) using the formatted time
          if (retrievedLogin === userName) {
            if (actionType === 'enter') {
              fetchedUsers[userId].visits = (fetchedUsers[userId].visits || 0) + 1;
              fetchedUsers[userId].tracked = usersToTrack.some(u => u.name === retrievedLogin);
            }
          }

          // Get the rank info from getRankInfo, which now returns an object with class, color, and icon
          const { class: rankClass } = getRankInfo(mainTitle);  // Destructure the returned object to get the rank class

          // Check if the user with the same ID already exists in the corresponding rank group
          const existingUserElement = rankSubparents[rankClass].querySelector(`.user${userId}`);
          if (!existingUserElement) {
            const newUserElement = createUserChatElement(userId, mainTitle, userName, bestSpeed, userElement.classList.contains('revoked'));
            // Add the user to the corresponding rank group
            rankSubparents[rankClass].appendChild(newUserElement);
            // Make sure the mutation observer for the new users changed flag to false to make it work
            if (isInitializedChat) addShakeEffect(newUserElement); // Add shake effect on entered users on chat ready state
          }

          // Update existing user IDs
          existingUserIds.add(userId);
        } catch (error) {
          console.error(`Error fetching profile summary for user ${userId}:`, error);
        }
      }
    }

    // Additional removal logic based on your provided code
    userListContainer.querySelectorAll('.chat-user-list [class^="user"]').forEach(userElement => {
      const userId = userElement.querySelector('.name').getAttribute('data-user');
      if (!existingUserIds.has(userId)) {
        userElement.remove();
      }
    });

    // Sorting logic (applied after all users are created)
    Object.values(rankSubparents).forEach(rankGroup =>
      [...rankGroup.children]
        .sort((a, b) =>
          (fetchedUsers[b.querySelector('.name')?.getAttribute('data-user')]?.bestSpeed || 0) -
          (fetchedUsers[a.querySelector('.name')?.getAttribute('data-user')]?.bestSpeed || 0)
        )
        .forEach(el => rankGroup.appendChild(el))
    );

    // Update localStorage outside the if conditions
    localStorage.setItem('fetchedUsers', JSON.stringify(fetchedUsers));

    // Call updateUserCountText to refresh user count display
    updateUserCountText();

  } catch (error) {
    console.error('Error refreshing user list:', error);
  }
}