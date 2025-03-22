// definitions
import {
  dynamicChatNotificationTimeout
} from "./definitions";

import { settingsState } from "./panels/settings/settings.js"; // settings
const { usersToTrack } = settingsState;

// helpers
import {
  getUserChatDuration,
  shouldEnable,
  scrollToBottom,
  getCurrentTimeString
} from "./helpers";

// tooltip
import { createCustomTooltip } from "./tooltip";

// Creates the action icon element
function createActionIcon(iconType) {
  const actionIcon = document.createElement('span');
  actionIcon.classList.add('action-icon');
  actionIcon.style.margin = '0 4px';
  actionIcon.style.setProperty('border', 'none', 'important');
  actionIcon.innerHTML = iconType;
  return actionIcon;
}

// Function to create and display a static notification
export function createStaticNotification(user, iconType, time, presence, containerType) {
  // Define a mapping for container types to their respective selectors
  const containerSelectors = {
    generalChat: '.messages-content div', // For general chat notifications
    cachePanel: '.fetched-users .action-log' // For cache notifications
  };

  // Get the container based on the passed containerType
  const containerSelector = containerSelectors[containerType];

  // If the container selector is not defined, return
  if (!containerSelector) {
    console.error("Invalid or missing container. Please provide 'generalChat' or 'cachePanel'.");
    return;
  }

  const staticNotificationsContainer = document.querySelector(containerSelector);
  if (!staticNotificationsContainer) {
    console.error("Container not found in DOM.");
    return;
  }

  // Add a class to the container based on the container type
  staticNotificationsContainer.classList.add(
    containerType === 'generalChat'
      ? 'static-chat-notifications-container'
      : 'static-cache-notifications-container'
  );

  // Create the action icon based on the iconType provided
  const staticChatNotification = document.createElement('span');
  staticChatNotification.classList.add('static-chat-notification');

  // Add double-click listener to purge notifications only if using the generalChat container
  if (containerType === 'generalChat') {
    staticChatNotification.addEventListener('dblclick', () => {
      purgeStaticChatNotifications();
    });
  }

  // Create the user element
  const userElement = document.createElement('span');
  userElement.classList.add("action-user");
  userElement.textContent = user;

  // Create the action icon based on the iconType provided
  const actionIcon = createActionIcon(iconType);

  // Create the time element
  const timeElement = document.createElement('span');
  timeElement.classList.add("action-time");
  timeElement.textContent = time;

  // Append elements in order: user span, action icon, time span
  staticChatNotification.appendChild(userElement);
  staticChatNotification.appendChild(actionIcon);
  staticChatNotification.appendChild(timeElement);

  // Store username and time as data attributes for easy access later
  staticChatNotification.dataset.username = user;
  staticChatNotification.dataset.time = time;

  // Style based on presence
  if (presence) {
    staticChatNotification.classList.add('user-enter');
  } else {
    staticChatNotification.classList.add('user-left');
  }

  // Append the notification to the selected container
  staticNotificationsContainer.appendChild(staticChatNotification);

  // Use the custom tooltip when the user enters the static notification
  staticChatNotification.addEventListener('mouseover', () => {
    // Use dataset to get the username and time from the static notification
    const usernameData = staticChatNotification.dataset.username;
    const timeData = staticChatNotification.dataset.time;
    // Get the user chat duration and pass it to the custom tooltip
    const title = getUserChatDuration(usernameData, timeData);
    // Create and display the custom tooltip
    createCustomTooltip(staticChatNotification, title);
  });
}

// Function to create and animate a dynamic notification
function createDynamicNotification(user, iconType, time, presence) {
  let dynamicChatNotificationsContainer = document.querySelector('.dynamic-chat-notifications-container');
  // Create container if it doesn't exist
  if (!dynamicChatNotificationsContainer) {
    dynamicChatNotificationsContainer = document.createElement('div');
    dynamicChatNotificationsContainer.classList.add('dynamic-chat-notifications-container');
    document.body.appendChild(dynamicChatNotificationsContainer);
  }

  // Create the notification element
  const dynamicChatNotification = document.createElement('span');
  dynamicChatNotification.classList.add('dynamic-chat-notification');

  // Create user element
  const userElement = document.createElement('span');
  userElement.classList.add("action-user");
  userElement.textContent = user;

  // Create the action icon based on the iconType provided
  const actionIcon = createActionIcon(iconType);

  // Create time element
  const timeElement = document.createElement('span');
  timeElement.classList.add("action-time");
  timeElement.textContent = time;

  // Append elements in order: user span, action icon, time span
  dynamicChatNotification.appendChild(userElement);
  dynamicChatNotification.appendChild(actionIcon);
  dynamicChatNotification.appendChild(timeElement);

  // Store username and time as data attributes for easy access later
  dynamicChatNotification.dataset.username = user;
  dynamicChatNotification.dataset.time = time;

  // Set colorization based on presence
  if (presence) {
    dynamicChatNotification.classList.add('user-enter');
  } else {
    dynamicChatNotification.classList.add('user-left');
  }

  // Append to the container
  dynamicChatNotificationsContainer.appendChild(dynamicChatNotification);

  // Use the custom tooltip when the user enters the static notification
  dynamicChatNotification.addEventListener('mouseover', () => {
    // Use dataset to get the username and time from the static notification
    const usernameData = dynamicChatNotification.dataset.username;
    const timeData = dynamicChatNotification.dataset.time;
    // Get the user chat duration and pass it to the custom tooltip
    const title = getUserChatDuration(usernameData, timeData);
    // Create and display the custom tooltip
    createCustomTooltip(dynamicChatNotification, title);
  });

  // Animate: slide in, then slide out and remove
  setTimeout(() => {
    dynamicChatNotification.style.transform = 'translateX(0)';
    setTimeout(() => {
      dynamicChatNotification.style.transform = 'translateX(-100%)';
      setTimeout(() => {
        dynamicChatNotificationsContainer.removeChild(dynamicChatNotification);
      }, 300); // after slide-out animation
    }, dynamicChatNotificationTimeout);
  }, 300);
}

// Global queue and state for dynamic notifications
const notificationQueue = [];
let processingQueue = false;
const delayBetween = 500; // 500 ms delay

// Helper for pausing execution
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to process the queue one notification at a time
function processQueue() {
  if (notificationQueue.length === 0) {
    processingQueue = false;
    return;
  }
  processingQueue = true;
  const { user, iconType, time, presence } = notificationQueue.shift();
  createDynamicNotification(user, iconType, time, presence);
  setTimeout(processQueue, delayBetween);
}

// Enqueue a new dynamic notification
function enqueueNotification(user, iconType, time, presence) {
  notificationQueue.push({ user, iconType, time, presence });
  if (!processingQueue) {
    processQueue();
  }
}

// Main function updated to use the queue for dynamic notifications
export function showUserAction(user, iconType, presence) {
  // Check if the user is tracked and in the correct state
  const isTrackedUser = usersToTrack.some(
    (trackedUser) => trackedUser.name === user && trackedUser.state === 'thawed'
  );

  const shouldShowStatic = isTrackedUser && shouldEnable('notifications', 'static');
  const shouldShowDynamic = shouldEnable('notifications', 'dynamic');

  // Exit early if no notification type is enabled
  if (!shouldShowStatic && !shouldShowDynamic) return;

  // Get current time formatted as [HH:MM:SS]
  const time = getCurrentTimeString();

  // Show static notification if applicable
  if (shouldShowStatic && isTrackedUser) {
    createStaticNotification(user, iconType, time, presence, 'generalChat');
    scrollToBottom('generalMessages', 350);
  }

  // Instead of immediately creating a dynamic notification, enqueue it
  if (shouldShowDynamic) {
    enqueueNotification(user, iconType, time, presence);
  }
}

// NOTIFICATIONS TERMINATOR 

async function purgeStaticChatNotifications(
  removalDelay = 40,
  scrollDuration = 600,
  animationDuration = 140
) {
  const chat = document.querySelector(".messages-content");
  if (!chat) return;

  // Save original scroll behavior and set to smooth once
  const originalScrollBehavior = chat.style.scrollBehavior;
  chat.style.scrollBehavior = 'smooth';

  const elements = [...document.querySelectorAll('.static-chat-notification')].reverse();

  for (const el of elements) {
    const needsScroll = !isVisibleInContainer(el, chat);

    if (needsScroll) {
      // Smooth scroll to element
      chat.scrollTop = el.offsetTop - chat.offsetTop - chat.clientHeight / 2;
      await sleep(scrollDuration);
    }

    Object.assign(el.style, {
      transition: [
        `opacity ${animationDuration / 1000}s cubic-bezier(.3,.1,1,.1)`,
        `transform ${animationDuration / 1000}s cubic-bezier(0,.7,.3,0.95)`
      ].join(','),
      opacity: 0,
      transformOrigin: 'left',
      transform: 'translateX(8em) skewX(-20deg)'
    });

    // Wait for animation to complete before removal
    await sleep(animationDuration);
    el.remove();

    // Standard delay between elements
    await sleep(removalDelay);
  }

  // Final scroll to bottom only if needed
  const isAtBottom = chat.scrollHeight - chat.scrollTop <= chat.clientHeight;
  if (!isAtBottom) {
    chat.scrollTop = chat.scrollHeight;
    await sleep(scrollDuration);
  }

  // Restore original scroll behavior
  chat.style.scrollBehavior = originalScrollBehavior;
}

function isVisibleInContainer(el, container) {
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return (
    elRect.top >= containerRect.top &&
    elRect.bottom <= containerRect.bottom
  );
}
