// icons
import {
  chevronsUpSVG,
  chevronUpSVG,
  chevronDownSVG,
  chevronsDownSVG
} from './icons.js';

// definitions
import {
  mentionKeywords,
  emojiFaces,
  trustedDomains,
  state
} from './definitions.js';

// Define dynamic variables
let {
  panelsEvents,
  bigImageEvents,
  isCtrlKeyPressed,
  isAltKeyPressed,
  lastFocusedIframeTextarea,
  lastEmojiAvatar
} = state;

// Helper function to update key states
const setKeyState = (key, value) => {
  if (key === 'Control') isCtrlKeyPressed = value;
  if (key === 'Alt') isAltKeyPressed = value;
};

// Listen for keydown and keyup events
['keydown', 'keyup'].forEach(eventType =>
  document.addEventListener(eventType, event => setKeyState(event.key, eventType === 'keydown'))
);

// Reset key states when focus or blur events occur
['blur', 'focus'].forEach(eventType =>
  document.addEventListener(eventType, () => {
    if (isCtrlKeyPressed || isAltKeyPressed) {
      console.log(`${isCtrlKeyPressed ? 'Ctrl ' : ''}${isAltKeyPressed ? 'Alt ' : ''}key was true`);
      isCtrlKeyPressed = false;
      isAltKeyPressed = false;
    }
  })
);

export function addPulseEffect(element) {
  element.classList.add('pulse-effect');
  setTimeout(() => {
    element.classList.remove('pulse-effect');
  }, 500);
}

// Function to remove all event listeners from the panel
export function removeAllPanelEventListeners() {
  Object.values(panelsEvents).forEach((handler) => {
    document.removeEventListener('keydown', handler);
  });

  // Remove all keys without reassigning the object
  Object.keys(panelsEvents).forEach((key) => delete panelsEvents[key]);
}

export function addBigImageEventListeners() {
  Object.entries(bigImageEvents).forEach(([event, handler]) => {
    document.addEventListener(event, handler);
  })
}

export function removeBigImageEventListeners() {
  Object.entries(bigImageEvents).forEach(([event, handler]) => {
    document.removeEventListener(event, handler);
  })
}

// Function to remove the previous panel if it exists
export function removePreviousPanel() {
  removeAllPanelEventListeners();
  const existingPanel = document.querySelector('.popup-panel');
  if (existingPanel) existingPanel.remove();
}

// Function to update button opacity
export function updateScrollButtonOpacity({ container, buttons }) {
  const tolerance = 3,
    isAtTop = container.scrollTop === 0,
    isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - tolerance;

  [buttons.fullScrollUpButton, buttons.partialScrollUpButton].forEach(button => {
    button.style.opacity = isAtTop ? '0.3' : '1';
    button.style.pointerEvents = isAtTop ? 'none' : 'auto';
  });

  [buttons.fullScrollDownButton, buttons.partialScrollDownButton].forEach(button => {
    button.style.opacity = isAtBottom ? '0.3' : '1';
    button.style.pointerEvents = isAtBottom ? 'none' : 'auto';
  });
}

// Function to update the visibility of the scroll buttons container
export function updateScrollButtonsVisibility({ container, scrollButtonsContainer }) {
  if (container.scrollHeight > container.clientHeight) {
    scrollButtonsContainer.style.display = 'flex';
  } else {
    scrollButtonsContainer.style.display = 'none';
  }
}

// Function to create scroll buttons for a container
export function createScrollButtons(container) {
  const scrollButtonsContainer = document.createElement('div');
  scrollButtonsContainer.className = 'scroll-buttons-container';

  const fullScrollUpButton = document.createElement('div');
  fullScrollUpButton.innerHTML = chevronsUpSVG;
  fullScrollUpButton.title = 'Scroll Up (Full)';

  const partialScrollUpButton = document.createElement('div');
  partialScrollUpButton.innerHTML = chevronUpSVG;
  partialScrollUpButton.title = 'Scroll Up (Partial)';

  const partialScrollDownButton = document.createElement('div');
  partialScrollDownButton.innerHTML = chevronDownSVG;
  partialScrollDownButton.title = 'Scroll Down (Partial)';

  const fullScrollDownButton = document.createElement('div');
  fullScrollDownButton.innerHTML = chevronsDownSVG;
  fullScrollDownButton.title = 'Scroll Down (Full)';

  const buttons = {
    fullScrollUpButton,
    partialScrollUpButton,
    partialScrollDownButton,
    fullScrollDownButton
  };

  Object.values(buttons).forEach(button => {
    button.classList.add("large-button", "scroll-button");
    scrollButtonsContainer.appendChild(button);
  });

  function scrollContainer(direction, isFullScroll) {
    const scrollAmount = isFullScroll ? container.scrollHeight : container.clientHeight;
    container.scrollBy({
      top: direction === 'up' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    updateScrollButtonOpacity({ container, buttons });
  }

  fullScrollUpButton.addEventListener('click', () => scrollContainer('up', true));
  partialScrollUpButton.addEventListener('click', () => scrollContainer('up', false));
  partialScrollDownButton.addEventListener('click', () => scrollContainer('down', false));
  fullScrollDownButton.addEventListener('click', () => scrollContainer('down', true));

  updateScrollButtonOpacity({ container, buttons });
  updateScrollButtonsVisibility({ container, scrollButtonsContainer });

  container.addEventListener('scroll', () => {
    updateScrollButtonOpacity({ container, buttons });
    updateScrollButtonsVisibility({ container, scrollButtonsContainer });
  });

  return { scrollButtonsContainer };
}

export const debounce = (func, delay = 300) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Adjust element visibility with smooth opacity transition
export function adjustVisibility(element, action, opacity) {
  if (!element) return; // Exit if element doesn't exist

  // Force reflow to ensure initial state is recognized
  void element.offsetHeight;

  element.style.transition = 'opacity 0.3s'; // Apply smooth transition for both show and hide
  element.style.opacity = action === 'show' ? opacity : '0'; // Set target opacity

  // If hiding, wait for transition to finish before removing the element
  if (action === 'hide') {
    element.addEventListener('transitionend', () => {
      if (element.style.opacity === '0') element.remove(); // Remove only when opacity reaches 0
    }, { once: true }); // Ensure the event runs only once
  }
}

// Function to create and fade the dimming element
export function triggerDimmingElement(action) {
  // Check if the dimming element already exists
  let dimming = document.querySelector('.dimming-background');
  // Check if the scaled thumbnail already exists
  let scaledThumbnail = document.querySelector('.scaled-thumbnail');

  // If the action is 'hide' and the dimming element doesn't exist, return
  if (action === 'hide' && !dimming) return;

  // Create the dimming element only if it doesn't exist
  if (!dimming) {
    dimming = document.createElement('div');
    dimming.classList.add('dimming-background');

    // Append the dimming element to the body
    document.body.appendChild(dimming);

    // Add click event listener to remove the dimming element and the upper element
    dimming.addEventListener('click', function () {
      // First, check for .popup-panel, then check for previousElementSibling
      const elementToRemove = document.querySelector('.popup-panel') || dimming.previousElementSibling;
      if (elementToRemove) adjustVisibility(elementToRemove, 'hide', 0); // Fade out and remove element
      triggerDimmingElement('hide');
      if (scaledThumbnail) removeBigImageEventListeners(); // Remove all bigImage event listeners
    });
  }

  // Adjust the visibility of an element with a dimming effect, setting opacity to 0.5
  adjustVisibility(dimming, action, 0.5);

  // If the action is 'hide', check for and remove the .scaled-thumbnail using triggerTargetElement
  if (action === 'hide') {
    if (scaledThumbnail) {
      removeBigImageEventListeners(); // Remove all bigImage event listeners
      triggerTargetElement(scaledThumbnail, 'hide'); // Use triggerTargetElement to fade out and remove the scaled-thumbnail
    }
  }
}

// Function to gradually fade a target element to show or hide it
export function triggerTargetElement(element, action) {
  if (!element) return; // Return if the element does not exist

  // Adjust the visibility of a specific element, setting opacity to 1 (fully visible)
  adjustVisibility(element, action, 1);

  // Add a double click event listener to hide the element
  element.addEventListener('dblclick', (event) => {
    // Check if any panel is open
    const isPanelOpen = document.querySelector('.popup-panel');
    // If any panel is open and the double-clicked target is the scaled image, do not hide the dimming element
    if (!isPanelOpen || !event.target.closest('.scaled-thumbnail')) {
      triggerDimmingElement('hide'); // Hide the dimming element on double click, unless the target is a scaled image and a panel is open
    }

    triggerTargetElement(element, 'hide'); // Always hide the target element on double click
  });
}

// Function to check if a URL is valid and contains encoded characters
export function isValidEncodedURL(url) {
  const urlPattern = /^https?:\/\//; // Regex pattern to check if the value is a URL
  const encodedPattern = /%[0-9A-Fa-f]{2}/; // Regex pattern to check if the URL is encoded
  return urlPattern.test(url) && encodedPattern.test(url);
}

// Function to decode a URL and replace spaces with underscores
export function decodeURL(url) {
  const [base] = url.split('#'); // Split at the '#' symbol and take the base part
  return decodeURIComponent(base).replace(/ /g, '_'); // Decode and replace spaces with underscores
}

export function processEncodedLinks(type) {
  // Select the appropriate container based on the 'type' parameter
  document.querySelector(({
    generalMessages: ".messages-content div", // General messages container
    chatlogsMessages: ".chat-logs-container", // Chat logs container
    personalMessages: ".messages-container-wrapper" // Personal messages container
  })[type])?.querySelectorAll('a:not(.media):not(.decoded)').forEach(link => { // Select all <a> links that haven't been decoded yet
    try {
      // Ensure the link is a valid encoded URL before decoding
      if (isValidEncodedURL(link.href)) {
        let decoded = decodeURL(link.href); // Decode the URL
        link.href = link.textContent = decoded; // Set the decoded URL as both the link href and text content
        link.classList.add('decoded'); // Mark the link as decoded by adding the 'decoded' class
      }
    } catch (error) {
      // If an error occurs during the decoding process, log the error and the link's href
      console.error('Error decoding link:', error, link.href); // Log error and link.href for debugging
    }
  });
}

// Creates and manages an iframe modal for profile content
export const loadProfileIntoIframe = (url) => {
  // Create iframe element and configure basic attributes
  const profileIframe = document.createElement('iframe');
  profileIframe.classList.add('profile-iframe-container');
  profileIframe.src = url;

  document.body.appendChild(profileIframe);
  adjustVisibility(profileIframe, 'show', 1);

  // Cleanup function for removing the iframe and event listeners
  const removeIframe = () => {
    adjustVisibility(profileIframe, 'hide', 0);
    document.removeEventListener('keydown', handleEvents);
    document.removeEventListener('mousedown', handleEvents);
  };

  // Unified event handler for closure interactions
  const handleEvents = (event) => {
    // Spacebar handling: prevent default closure when textarea is focused
    if (event.type === 'keydown' && event.code === 'Space') {
      if (lastFocusedIframeTextarea) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      removeIframe();
    }
    // Close iframe when clicking outside
    if (event.type === 'mousedown' && !profileIframe.contains(event.target)) {
      removeIframe();
    }
  };

  // Attach global event listeners for closure triggers
  document.addEventListener('keydown', handleEvents);
  document.addEventListener('mousedown', handleEvents);

  // Configure iframe content interactions after load
  profileIframe.onload = () => {
    try {
      const iframeWindow = profileIframe.contentWindow;
      const iframeDoc = iframeWindow.document;

      // Track focused textareas within iframe
      iframeDoc.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'TEXTAREA') {
          lastFocusedIframeTextarea = e.target;
        }
      });

      // Clear textarea focus tracking when leaving input
      iframeDoc.addEventListener('focusout', () => {
        setTimeout(() => {  // Delay to check new active element
          if (!iframeDoc.activeElement || iframeDoc.activeElement.tagName !== 'TEXTAREA') {
            lastFocusedIframeTextarea = null;
          }
        }, 0);
      });

      // Attach internal iframe closure triggers
      iframeWindow.addEventListener('keydown', handleEvents);
      iframeWindow.addEventListener('dblclick', removeIframe);

      // Monitor DOM changes for automatic closure conditions
      new MutationObserver((mutations, observer) => {
        // Close iframe when specific UI elements are removed
        if (mutations.some(m => [...m.removedNodes].some(n =>
          n.nodeType === 1 && (n.classList.contains('dimming-background') || n.classList.contains('cached-users-panel'))
        ))) {
          removeIframe();
          observer.disconnect();
        }
      }).observe(document.body, { childList: true, subtree: true });

    } catch (error) {
      // Handle cross-origin policy restrictions
      console.warn("Unable to access iframe contents:", error);
    }
  };
};

// Helper function to get a random emoji avatar
export function getRandomEmojiAvatar() {
  let newEmoji;
  do {
    newEmoji = emojiFaces[Math.floor(Math.random() * emojiFaces.length)];
  } while (newEmoji === lastEmojiAvatar);

  lastEmojiAvatar = newEmoji;
  return newEmoji;
}

// Helper to fetch JSON and validate response
export async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
}

// Helper function to get Exact user ID by username via the search API
export async function getExactUserIdByName(userName) {
  // Define the search API URL
  const searchApiUrl = `https://klavogonki.ru/api/profile/search-users?query=${userName}`;

  // Get search results from the API
  const searchResults = await fetchJSON(searchApiUrl);

  // Ensure search results exist and contain data
  if (!searchResults.all?.length) throw new Error(`User ${userName} not found.`);

  // Return the ID of the user with the exact matching login
  const user = searchResults.all.find(user => user.login === userName);
  if (!user) throw new Error(`Exact match for user ${userName} not found.`);

  return user.id;
}

// Helper function to get all user IDs by username via the search API
export async function getUserIDsByName(userName) {
  const searchApiUrl = `https://klavogonki.ru/api/profile/search-users?query=${userName}`;
  const searchResults = await fetchJSON(searchApiUrl);

  const foundUsers = searchResults.all; // Get all search results
  if (!foundUsers || foundUsers.length === 0) throw new Error(`User ${userName} not found.`);

  // Return an array of user IDs
  return foundUsers.map(user => user.id);
}

// Function to validate required user data
function validateUserData(user) {
  const requiredFields = ['rank', 'login', 'registered', 'bestSpeed', 'ratingLevel', 'friends', 'cars', 'avatarTimestamp'];
  return user && typeof user === 'object' && requiredFields.every(field => user?.[field] !== undefined);
}

// Function to convert seconds to a human-readable date format
function convertSecondsToDate(seconds) {
  const date = new Date(seconds * 1000);
  return date.toISOString().slice(0, 19).replace('T', ' '); // Converts to 'YYYY-MM-DD HH:mm:ss' format
}

// Function to convert sec and usec to the 'updated' timestamp
function convertToUpdatedTimestamp(sec, usec) {
  // Create the full timestamp by combining sec and usec (in microseconds)
  return sec.toString() + Math.floor(usec / 1000).toString();
}

// Function to get profile summary and registration data
export async function getUserProfileData(userId, useLocalStorage = true) {
  return new Promise(async (resolve, reject) => {
    let cachedUserInfo = useLocalStorage ? JSON.parse(localStorage.getItem('fetchedUsers')) || {} : {};
    const user = cachedUserInfo[userId];

    // Validate if user data exists and has the required properties
    if (useLocalStorage && validateUserData(user)) {
      // If all data is cached, resolve with the cached data
      resolve({
        rank: user.rank,
        login: user.login,
        registeredDate: user.registered,
        bestSpeed: user.bestSpeed,
        ratingLevel: user.ratingLevel,
        friends: user.friends, // Use cached friends count
        cars: user.cars, // Use cached cars count
        avatar: user.avatar, // Get avatar availability state
        avatarTimestamp: user.avatarTimestamp // Cached avatar timestamp
      });
    } else {
      try {
        // Fetch profile summary and registered date
        const summaryApiUrl = `https://klavogonki.ru/api/profile/get-summary?id=${userId}`;
        const profileApiUrl = `https://klavogonki.ru/api/profile/get-index-data?userId=${userId}`;

        // Fetch both profile summary and registration data in parallel
        const [summaryResponse, profileResponse] = await Promise.all([
          fetch(summaryApiUrl),
          fetch(profileApiUrl),
        ]);

        // Check if both responses are successful
        if (!summaryResponse.ok || !profileResponse.ok) {
          throw new Error('Failed to fetch data from one of the APIs.');
        }

        const summaryData = await summaryResponse.json();
        const profileData = await profileResponse.json();

        if (
          summaryData?.user?.login &&
          summaryData.title &&
          profileData?.stats?.registered
        ) {
          // Extract the relevant data
          const rank = summaryData.title;
          const login = summaryData.user.login;
          const registered = profileData.stats.registered.sec
            ? convertSecondsToDate(profileData.stats.registered.sec)
            : 'Invalid Date';

          // Extract new fields
          const bestSpeed = profileData.stats.best_speed || 0; // Default to 0 if undefined
          const ratingLevel = profileData.stats.rating_level || 0; // Default to 0 if undefined
          const friends = profileData.stats.friends_cnt || 0; // Extract friends count
          const cars = profileData.stats.cars_cnt || 0; // Extract cars count

          // Extract sec and usec from user.avatar, with null check
          const avatar = summaryData.user?.avatar || null; // Default to null if undefined or not present
          const sec = summaryData.user.avatar?.sec || 0; // Default to 0 if undefined or null
          const usec = summaryData.user.avatar?.usec || 0; // Default to 0 if undefined or null
          const avatarTimestamp = convertToUpdatedTimestamp(sec, usec); // Combine sec and usec to get avatar timestamp

          // Cache the fetched data if useLocalStorage is true, excluding the avatar
          if (useLocalStorage) {
            cachedUserInfo[userId] = {
              rank: rank,
              login: login,
              registered: registered,
              bestSpeed: bestSpeed,
              ratingLevel: ratingLevel,
              friends: friends, // Cache friends count
              cars: cars, // Cache cars count
              avatar: avatar,
              avatarTimestamp: avatarTimestamp // Cache avatar timestamp
            };

            // Update localStorage with the new cached data
            localStorage.setItem('fetchedUsers', JSON.stringify(cachedUserInfo));
          }

          // Resolve with the combined data
          resolve({
            rank: rank,
            login: login,
            registeredDate: registered,
            bestSpeed: bestSpeed,
            ratingLevel: ratingLevel,
            friends: friends,
            cars: cars,
            avatar: avatar, // Return avatar for current session
            avatarTimestamp: avatarTimestamp // Include avatar timestamp in the result
          });
        } else {
          throw new Error('Invalid data format received from the API.');
        }
      } catch (error) {
        console.error(`Error fetching user profile data for ${userId}:`, error);
        reject(error);
      }
    }
  });
}

// Helper function to convert time string to single hours
export function convertToSingleHours(timeString) {
  const [hours, minutes = 0, seconds = 0] = timeString.split(':').map(Number);
  return hours + minutes / 60 + seconds / 3600;
}

// Function to refresh or manually clear fetched users and reset the timer
// @param {boolean} isManual - If true, clears cache unconditionally; if false, clears based on threshold (default is false)
// @param {number} thresholdHours - Time threshold in hours for automatic cache clearing (default is 24 hours)
export function refreshFetchedUsers(isManual = false, thresholdHours = 24) {
  // Retrieve the last clear time from localStorage
  const lastClearTime = localStorage.getItem('lastClearTime');
  const timeElapsed = lastClearTime ? (new Date().getTime() - lastClearTime) / (1000 * 60 * 60) : Infinity;

  // If clearing manually or the time threshold has been reached, clear the cache
  if (isManual || timeElapsed >= thresholdHours) {
    // Clear the fetchedUsers from localStorage
    localStorage.removeItem('fetchedUsers');

    // Reset the in-memory fetchedUsers object
    fetchedUsers = {};

    // Reset the timer by updating 'lastClearTime' and 'nextClearTime'
    const nextClearTime = new Date().getTime() + thresholdHours * 60 * 60 * 1000;
    localStorage.setItem('lastClearTime', new Date().getTime().toString());
    localStorage.setItem('nextClearTime', nextClearTime.toString());
  }
}

export function getUserChatDuration(username, actionTime) {
  // Retrieve stored user data and find the target user by login
  const user = Object.values(JSON.parse(localStorage.getItem('fetchedUsers') || '[]'))
    .find(u => u?.login === username);
  if (!user) return `❌ User "${username}" not found`;

  const actionLog = user.actionLog || [];
  const current = actionLog.find(entry => entry.timestamp === actionTime);
  if (!current) return `Action not found at ${actionTime}`;

  const actionIndex = actionLog.indexOf(current);
  if (actionIndex === 0) return `🙌 ${username}'s first action`;

  // Find the most recent action before the current one that has a different type
  const prev = actionLog.slice(0, actionIndex).reverse().find(a => a.type !== current.type);
  if (!prev) return `❌ No valid previous action found for ${actionTime}`;

  // Calculate the duration between the two timestamps
  const duration = calculateDuration(prev.timestamp, current.timestamp);
  return current.type === 'leave'
    ? `🛑 ${username} stayed in chat for ${duration}`
    : `✅ ${username} was absent for ${duration}`;
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

// Function to check if a specific setting should be enabled based on localStorage settings
export function shouldEnableSetting(settingType, specificType) {
  const toggleData = JSON.parse(localStorage.getItem('toggle')) || []; // Retrieve toggle settings or default to empty array

  // Define toggle names for different setting types
  const toggleNames = {
    notifications: {
      static: 'showChatStaticNotifications',
      dynamic: 'showGlobalDynamicNotifications'
    },
    sound: {
      presence: 'enableBeepOnChatJoinLeave',
      gTTS: 'switchToGoogleTTSEngine'
    }
  };

  const settingName = toggleNames[settingType];

  if (!settingName || !settingName[specificType]) return false;

  // Check if the specified setting toggle is set to 'yes'
  return toggleData.some(toggle =>
    toggle.name === settingName[specificType] && toggle.option === 'yes'
  );
}

// Track if the user has loaded messages for the first time
let firstTime = true;
// The distance from the bottom at which we should trigger auto-scrolling
const scrollThreshold = 600;

// Scrolls the specified container to the bottom if the user has scrolled close enough
export function scrollMessagesToBottom(containerType = 'generalMessages') {
  // Define a mapping for container types to their respective selectors
  const containerSelectors = {
    generalMessages: '.messages-content', // For general chat
    chatlogsMessages: '.chat-logs-container', // For chat logs
    personalMessages: '.messages-container-wrapper' // For personal messages panel
  };

  // Get the container based on the passed containerType
  const containerSelector = containerSelectors[containerType];

  // If the container selector is not defined, return
  if (!containerSelector) return;

  // Get the container element
  const container = document.querySelector(containerSelector);
  if (!container) return; // Return if the container doesn't exist

  // If it's the user's first time loading messages, auto-scroll to the bottom
  if (firstTime) {
    container.scrollTop = container.scrollHeight;
    firstTime = false;
  } else {
    // Calculate how far the user is from the bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    // If the user is close enough to the bottom, auto-scroll to the bottom
    if (distanceFromBottom <= scrollThreshold) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

// Function to scroll messages to the middle of the parent container
export async function scrollMessagesToMiddle(parent, element) {
  const { top, height } = element.getBoundingClientRect(); // Get the position and height of the found element
  const { top: parentTop, height: parentHeight } = parent.getBoundingClientRect(); // Get the position and height of the parent

  // Calculate the middle position of the parent container
  const parentMiddle = parentTop + parentHeight / 2;

  // Determine how far to scroll to center the found element
  const scrollOffset = top - parentMiddle + height / 2;

  // Scroll to the found element to center it within the parent
  parent.scrollBy({
    top: scrollOffset,
    behavior: 'smooth'
  });

  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for the scroll to complete
  parent.style.scrollBehavior = 'auto'; // Reset scroll behavior
  addShakeEffect(element); // Add a shake effect to the found element
}

// Helper function to get current time formatted as [HH:MM:SS]
export function getCurrentTimeFormatted() {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Checks if a given URL belongs to a trusted domain.
 * @param {string} url - The URL to check.
 * @returns {{isTrusted: boolean, domain: string}} - Whether the domain is trusted and the extracted domain.
 */
export function isTrustedDomain(url) {
  try {
    const parsedURL = new URL(url);
    const hostnameParts = parsedURL.hostname.toLowerCase().split('.');
    const domain = hostnameParts.length > 2 ? hostnameParts.slice(-2).join('.') : parsedURL.hostname;
    return { isTrusted: trustedDomains.includes(domain), domain };
  } catch (error) {
    console.error("Error in isTrustedDomain:", error.message);
    return { isTrusted: false, domain: url }; // Return original URL as domain in case of error
  }
}

export function highlightMentionWords(containerType = 'generalMessages') {
  const containerSelectors = {
    generalMessages: {
      container: '.messages-content div',
      messageElement: 'p',
      exclude: ['.time', '.username'] // Add exclusion list
    },
    chatlogsMessages: {
      container: '.chat-logs-container',
      messageElement: '.message-text'
    },
    personalMessages: {
      container: '.messages-container',
      messageElement: '.message-text'
    }
  };

  const config = containerSelectors[containerType];
  if (!config) {
    console.error('Invalid container type');
    return;
  }

  const containers = document.querySelectorAll(config.container);
  const globalProcessed = new WeakSet();

  containers.forEach((container) => {
    const messages = container.querySelectorAll(config.messageElement);

    messages.forEach((message) => {
      const processingQueue = [
        ...message.querySelectorAll('.private'),
        ...message.querySelectorAll('.system-message'),
        message
      ];

      processingQueue.forEach((element) => {
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip processed nodes and protected elements
              if (globalProcessed.has(node)) return NodeFilter.FILTER_SKIP;

              // Check if node is inside excluded elements
              const parent = node.parentElement;
              if (parent.closest('.mention, .time, .username')) {
                return NodeFilter.FILTER_SKIP;
              }

              // Additional exclusion for generalMessages
              if (containerType === 'generalMessages' && parent.closest(config.exclude.join(','))) {
                return NodeFilter.FILTER_SKIP;
              }

              return NodeFilter.FILTER_ACCEPT;
            }
          },
          false
        );

        const nodes = [];
        let currentNode;
        while ((currentNode = walker.nextNode())) {
          nodes.push(currentNode);
        }

        nodes.forEach((node) => {
          if (!globalProcessed.has(node)) {
            processNode(node);
            globalProcessed.add(node);
          }
        });
      });
    });
  });

  function processNode(node) {
    const regex = /[\s]+|[^\s\wа-яА-ЯёЁ]+|[\wа-яА-ЯёЁ]+/g;
    const words = node.textContent.match(regex);
    if (!words) return;

    const fragment = document.createDocumentFragment();

    words.forEach((word) => {
      if (mentionKeywords.map(alias => alias.toLowerCase()).includes(word.toLowerCase())) {
        const mentionSpan = document.createElement('span');
        mentionSpan.className = 'mention';
        mentionSpan.textContent = word;
        fragment.appendChild(mentionSpan);
      } else {
        fragment.appendChild(document.createTextNode(word));
      }
    });

    node.parentNode.replaceChild(fragment, node);
  }
}

/**
 * Updates total and new personal message counts near the personal messages button.
 * - Increments new message count only when total message count increases.
 * - Manages visibility and pulse effects for the new message indicator.
 */
export function updatePersonalMessageCounts() {
  const totalCountElement = document.querySelector('.personal-messages-button .total-message-count');
  const newCountElement = document.querySelector('.personal-messages-button .new-message-count');
  if (!totalCountElement || !newCountElement) return; // Exit if elements are missing

  const personalMessages = JSON.parse(localStorage.getItem('personalMessages')) || {};
  const totalCount = Object.keys(personalMessages).length;

  let newCount = Number(localStorage.getItem('newMessagesCount')) || 0;
  if (totalCount > previousTotalCount) {
    newCount++;
    localStorage.setItem('newMessagesCount', newCount);
    addPulseEffect(newCountElement); // Apply pulse effect for new messages
    addJumpEffect(newCountElement, 50, 50); // Apply jump effect for new messages
  }

  // Update counts in the UI
  totalCountElement.textContent = totalCount;
  newCountElement.textContent = newCount;

  // Manage visibility of the new message indicator
  newCountElement.style.visibility = newCount > 0 ? 'visible' : 'hidden';

  // Apply pulse effect if total count changes
  if (totalCount !== previousTotalCount) addPulseEffect(totalCountElement);

  previousTotalCount = totalCount; // Update previous count
}