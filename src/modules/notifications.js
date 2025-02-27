// definitions
import {
  dynamicChatNotificationTimeout,
  usersToTrack
} from "./definitions";

// helpers
import {
  getUserChatDuration,
  shouldEnableSetting,
  scrollMessagesToBottom,
  getCurrentTimeFormatted
} from "./helpers";

// tooltip
import { createCustomTooltip } from "./tooltip";

// Creates the action icon element
function createActionIcon(iconType) {
  const actionIcon = document.createElement('div');
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
  const staticChatNotification = document.createElement('div');
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
  const dynamicChatNotification = document.createElement('div');
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

// Main function which now calls the appropriate notification function(s)
export function showUserAction(user, iconType, presence) {
  // Check if the user is tracked and in the correct state
  const isTrackedUser = usersToTrack.some(
    (trackedUser) => trackedUser.name === user && trackedUser.state === 'thawed'
  );

  const shouldShowStatic = isTrackedUser && shouldEnableSetting('notifications', 'static');
  const shouldShowDynamic = shouldEnableSetting('notifications', 'dynamic');

  // If neither notification is enabled, exit early.
  if (!shouldShowStatic && !shouldShowDynamic) return;

  // Get current time formatted as [HH:MM:SS]
  const time = getCurrentTimeFormatted();

  if (shouldShowStatic && isTrackedUser) {
    createStaticNotification(user, iconType, time, presence, 'generalChat');
    scrollMessagesToBottom();
  }

  if (shouldShowDynamic) {
    createDynamicNotification(user, iconType, time, presence);
  }
}