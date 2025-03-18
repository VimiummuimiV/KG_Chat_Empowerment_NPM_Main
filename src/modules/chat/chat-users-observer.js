import { enterSVG, leaveSVG } from "../icons.js"; // icons

import {
  debounce,
  getChatElements,
  logUserAction,
  getUserGender
} from "../helpers.js"; // helpers

import { debounceTimeout } from "../definitions.js"; // definitions
import { isInitializedChat } from "../../main.js"; // main
import { addJumpEffect, addPulseEffect } from "../animations.js"; // animations
import { showUserAction } from "../notifications.js"; // notifications
import { refreshUserList } from "./chat-userlist.js"; // chat userlist
import { userAction } from "../voice-engine.js"; // voice engine
import { settingsState } from "../panels/settings/settings.js"; // settings
const { usersToTrack } = settingsState;

const userList = getChatElements().userList.general;

// Initialize user tracking map
let userMap = new Map(); // Store as [userId]: {userName, ...}
let prevUserCount = 0;
let isAnimated = false;

/**
 * Updates the given user count element with the count, adjusting the font size based on the number of digits.
 * @param {HTMLElement} element - The DOM element displaying the user count.
 * @param {number} count - The user count.
 */
export function updateUserCount(element, count) {
  if (!element) return; // Exit if the element doesn't exist.
  const digits = count.toString().length;
  element.textContent = count;
  element.style.fontSize = Math.max(24 - (digits - 1) * 2, 12) + 'px';
}

// Function to animate user count change
export function animateUserCount(actualUserCount, userCountElement) {
  let count = 0;
  const speed = 20;

  const userCountIncrement = () => {
    if (count <= actualUserCount) {
      const progress = Math.min(count / (actualUserCount || 1), 1); // Handle zero case
      updateUserCount(userCountElement, count++);
      userCountElement.style.filter = `grayscale(${100 - progress * 100}%)`;
      setTimeout(userCountIncrement, speed);
    } else {
      addPulseEffect(userCountElement);
      addJumpEffect(userCountElement);
      isAnimated = true;
    }
  };

  setTimeout(userCountIncrement, speed);
}

// Mutation Observer for new users
const chatUsersObserver = new MutationObserver(debounce((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      const soundSwitcher = document.querySelector('#voice, #beep, #silence');
      const isSilence = soundSwitcher && soundSwitcher.id === 'silence';
      const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');
      const userCountElement = document.querySelector('.participant-count');

      if (chatHidden) {
        if (userCountElement) {
          // If the chat is hidden, update the user count to 0 and exit early
          userCountElement.style.filter = "grayscale(100%)";
          userCountElement.textContent = "0";
        }
        return;
      }

      // Build current user map
      const newUsers = new Map(
        Array.from(userList.children)
          .map(child => {
            const nameElement = child.querySelector('.name');
            const userId = nameElement?.getAttribute('data-user');
            const userName = nameElement?.textContent?.trim();
            return userId ? [userId, { userName }] : null;
          })
          .filter(Boolean) // Remove null entries
      );

      if (!isInitializedChat) return;

      if (!isAnimated) {
        if (userCountElement && Number(userCountElement.textContent) === 0) {
          animateUserCount(newUsers.size, userCountElement);
        }
        newUsers.forEach((value, key) => userMap.set(key, value));
        setTimeout(() => {
          isAnimated = true;
        }, 2000);
        return; // Skip processing until the animation done
      }

      // Detect users who entered (exist in newUsers but not in userMap)
      let entered = [...newUsers].filter(([userId]) => !userMap.has(userId))
        .map(([userId, data]) => ({ userId, ...data }));

      // Detect users who left (exist in userMap but not in newUsers)
      let left = [...userMap].filter(([userId]) => !newUsers.has(userId))
        .map(([userId, data]) => ({ userId, userName: data.userName }));

      // Reassign userMap instead of clearing and repopulating it
      userMap = new Map(newUsers);

      // User count management
      const currentCount = userMap.size;
      if (currentCount !== prevUserCount && isAnimated) {
        if (userCountElement) {  // Ensure userCountElement exists before modifying it
          updateUserCount(userCountElement, currentCount);
          userCountElement.style.filter = currentCount > 0 ? 'none' : 'grayscale(100%)';
          addPulseEffect(userCountElement);
        }
      }

      // Common logic for processing both entered and left users
      function processUserAction(user, actionType) {
        const { userName, userId } = user;
        const userGender = getUserGender(userName);
        const isTracked = usersToTrack.some(u => u.name === userName && u.state === 'thawed');

        showUserAction(userName, actionType === "enter" ? enterSVG : leaveSVG, actionType === "enter");
        refreshUserList(userName, actionType);
        logUserAction(userId, actionType);

        if (!isSilence && isTracked) {
          userAction(userName, actionType, userGender);
        }
      }

      // Process entries
      entered.forEach(newUser => processUserAction(newUser, "enter"));

      // Process exits
      left.forEach(oldUser => processUserAction(oldUser, "leave"));


      prevUserCount = currentCount; // Update previous count for next mutation
    }
  });
}, debounceTimeout));

// Define a function to start the observer
export function startChatUserObserver() {
  // Make sure the user list is available before starting the observer
  if (userList) { chatUsersObserver.observe(userList, { childList: true }); }
  else { console.warn('User list not found!'); }
}
