import {
  debounce,
  animateUserCount,
  getChatElements,
  logUserAction,
  updateUserCount
} from "../helpers"; // helpers

import { debounceTimeout } from "../definitions"; // definitions
import { isInitializedChat } from "../../main";

const userList = getChatElements().userList.general;

// Initialize user tracking map
let userMap = new Map(); // Store as [userId]: {userName, ...}
let prevUserCount = 0;

let isAnimated = false;

// Mutation Observer for new users
const chatUsersObserver = new MutationObserver(debounce((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      const soundSwitcher = document.querySelector('#voice, #beep, #silence');
      const isSilence = soundSwitcher && soundSwitcher.id === 'silence';
      const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');
      const userCountElement = document.querySelector('.chat-user-count');

      if (chatHidden) {
        // If the chat is hidden, update the user count to 0 and exit early
        userCountElement.style.filter = "grayscale(100%)";
        userCountElement.textContent = "0";
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

      console.log(isInitializedChat);

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
        updateUserCount(userCountElement, currentCount);
        userCountElement.style.filter = currentCount > 0 ? 'none' : 'grayscale(100%)';
        addPulseEffect(userCountElement);
      }

      // Common logic for processing both entered and left users
      function processUserAction(user, actionType) {
        const { userName, userId } = user;
        const userGender = getUserGender(userName);
        const isTracked = usersToTrack.some(u => u.name === userName && u.state === 'thawed');

        showUserAction(userName, actionType === "enter" ? icons.enterSVG : icons.leaveSVG, actionType === "enter");
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