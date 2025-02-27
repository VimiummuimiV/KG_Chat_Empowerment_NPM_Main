// helpers && helpers definitions
import {
  // helpers
  addPulseEffect,
  removePreviousPanel,
  createScrollButtons,
  debounce,
  triggerDimmingElement,
  triggerTargetElement,
  getRandomEmojiAvatar,
  adjustVisibility,
  getUserIDsByName,
  getUserProfileData,
  refreshFetchedUsers,
  // helpers definitions
  isCtrlKeyPressed
} from './helpers.js';

// notifications
import {
  createStaticNotification
} from './notifications.js';

// icons
import {
  usersSVG,
  trashSVG,
  closeSVG,
  enterSVG,
  leaveSVG,
  userlistCacheSVG
} from './icons.js';

// definitions
import {
  cacheRefreshThresholdHours,
  debounceTimeout,
  profileBaseUrl,
  myUserId,
  state
} from './definitions.js';

// Array to store user IDs and their status titles
let fetchedUsers = JSON.parse(localStorage.getItem('fetchedUsers')) || {};

// Rank order mapping
const rankOrder = {
  'Экстракибер': 1,
  'Кибергонщик': 2,
  'Супермен': 3,
  'Маньяк': 4,
  'Гонщик': 5,
  'Профи': 6,
  'Таксист': 7,
  'Любитель': 8,
  'Новичок': 9
};

// Rank color mapping
const rankColors = {
  'Экстракибер': '#06B4E9', // Light Blue
  'Кибергонщик': '#5681ff', // Medium Blue
  'Супермен': '#B543F5', // Purple
  'Маньяк': '#DA0543', // Red
  'Гонщик': '#FF8C00', // Orange
  'Профи': '#C1AA00', // Yellow
  'Таксист': '#2DAB4F', // Green
  'Любитель': '#61B5B3', // Light Cyan
  'Новичок': '#AFAFAF' // Grey
};


// Global function to prepend an emoticon to the visits element in the cache panel.
function updateVisitsEmoticon(visitsElement) {
  // Convert content to number; exit if invalid
  const count = Number(visitsElement.textContent);
  if (isNaN(count)) return console.warn('Invalid visits count!');

  // Select emoticon: 0–10: 💧, 11–20: 💦, 21–30: 🌊, above 30: 🔥
  const emoticon = count <= 10 ? '💧' : count <= 20 ? '💦' : count <= 30 ? '🌊' : '🔥';

  visitsElement.textContent = `${emoticon} ${count}`;
}

// Function to display the cached user list panel
function showCachePanel() {
  // Check if the panel already exists
  const existingPanel = document.querySelector('.cached-users-panel');
  if (existingPanel) {
    existingPanel.remove(); // Remove the settings panel
    triggerDimmingElement('hide');
    return; // Return immediately to prevent further execution
  }

  // Remove any previous panel before creating a new one
  removePreviousPanel();

  // Initialize users by parsing fetched data or setting as empty object
  let users = fetchedUsers;

  // Create a container div with class 'cached-users-panel'
  const cachedUsersPanel = document.createElement('div');
  cachedUsersPanel.className = 'cached-users-panel popup-panel';

  // Define the event handler function for the cache panel
  state.panelsEvents.handleCacheKeydown = (event) => { // Assign the function to the object
    if (event.key === 'Escape') {
      triggerTargetElement(cachedUsersPanel, 'hide');
      triggerDimmingElement('hide');
      document.removeEventListener('keydown', state.panelsEvents.handleCacheKeydown); // Remove the event listener
    }
  };

  // Attach the event listener
  document.addEventListener('keydown', state.panelsEvents.handleCacheKeydown);

  // Create a container div with class 'panel-header'
  const panelHeaderContainer = document.createElement('div');
  panelHeaderContainer.className = 'panel-header';

  // Create a container div with class 'drop-time'
  const dropTime = document.createElement('div');
  dropTime.className = 'drop-time';

  // Create span with description for threshold time element
  const dropTimeThresholdDescription = document.createElement('span');
  dropTimeThresholdDescription.className = 'drop-time-threshold-description';
  dropTimeThresholdDescription.textContent = '🚧 Threshold';

  const dropTimeThreshold = document.createElement('span');
  dropTimeThreshold.className = 'drop-time-threshold';

  // Get the value from the localStorage key 'cacheRefreshThresholdHours'
  const storedThresholdTime = localStorage.getItem('cacheRefreshThresholdHours');
  // Update the innerHTML with the stored value (default to '00:00:00' if the key is not set)
  dropTimeThreshold.innerHTML = storedThresholdTime || '00:00:00';
  // Attach click event to the dropTimeThreshold element
  dropTimeThreshold.addEventListener('click', setCacheRefreshTime);

  // Create span with description for expiration time element
  const dropTimeExpirationDescription = document.createElement('span');
  dropTimeExpirationDescription.className = 'drop-time-expiration-description';
  dropTimeExpirationDescription.textContent = '💣 Countdown';

  const dropTimeExpiration = document.createElement('span');
  dropTimeExpiration.className = 'drop-time-expiration';

  // Function to prompt the user for a cache refresh time and update the content
  function setCacheRefreshTime() {
    let isValidInput = false;

    // Keep prompting the user until valid input is provided or they click "Cancel"
    while (!isValidInput) {
      // Prompt the user for a time
      const userInput = prompt('Enter a cache refresh time (e.g., HH, HH:mm, or HH:mm:ss):');

      // Get the dropTimeThreshold element
      const dropTimeThreshold = document.querySelector('.drop-time-threshold');

      // Validate the user input
      const timeRegex = /^([0-9]+|[01][0-9]|2[0-4])(:([0-5]?[0-9])(:([0-5]?[0-9]))?)?$/; // HH, HH:mm, or HH:mm:ss

      if (userInput === null) {
        // User clicked "Cancel," exit the loop
        isValidInput = true;
      } else if (timeRegex.test(userInput)) {
        // Valid input, extract hours and set default values for minutes and seconds if not provided
        const formattedInput = userInput.split(':');
        const hours = ('0' + formattedInput[0]).slice(-2);
        const minutes = ('0' + (formattedInput[1] || '00')).slice(-2);
        const seconds = ('0' + (formattedInput[2] || '00')).slice(-2);

        // Update the content of the dropTimeThreshold element
        dropTimeThreshold.textContent = `${hours}:${minutes}:${seconds}`;

        // Combine the values and store in localStorage with the key 'cacheRefreshThresholdHours'
        const formattedTime = `${hours}:${minutes}:${seconds}`;
        localStorage.setItem('cacheRefreshThresholdHours', formattedTime);

        // Remove fetchedUsers, lastClearTime, and nextClearTime keys
        localStorage.removeItem('fetchedUsers');
        localStorage.removeItem('lastClearTime');
        localStorage.removeItem('nextClearTime');

        // Reload the current page after (N) time after changing the cache threshold
        setTimeout(() => location.reload(), 1000);

        // Set isValidInput to true to exit the loop
        isValidInput = true;
      } else {
        // Alert the user for invalid input
        alert('Invalid time format. Please enter a valid time in the format HH, HH:mm, or HH:mm:ss.');
      }
    }
  }

  // Append the childs to the drop time parent element
  dropTime.appendChild(dropTimeThresholdDescription);
  dropTime.appendChild(dropTimeThreshold);
  dropTime.appendChild(dropTimeExpirationDescription);
  dropTime.appendChild(dropTimeExpiration);

  // Append the drop time element to the panel header container
  panelHeaderContainer.appendChild(dropTime);

  // Create a container div for the search input
  const cacheSearchContainer = document.createElement('div');
  cacheSearchContainer.className = 'search-for-cached-users';

  // Create the input field for searching users
  const cacheSearchInput = document.createElement('input');
  cacheSearchInput.className = 'cached-users-search-input';
  cacheSearchInput.type = 'text';

  // Append search input to the search container
  cacheSearchContainer.appendChild(cacheSearchInput);

  // Add click event listener to clear the search input by LMB click with Ctrl key pressed
  cacheSearchInput.addEventListener('click', () => isCtrlKeyPressed && (cacheSearchInput.value = ''));

  // Add event listener to listen for keydown events
  cacheSearchInput.addEventListener('keydown', async (event) => {
    const oldUsersContainer = document.querySelector('.old-users');
    const newUsersContainer = document.querySelector('.new-users');
    const fetchedUsersContainer = document.querySelector('.fetched-users');

    // Handle Backspace key
    if (event.key === 'Backspace' && event.target.value.length === 0) {
      oldUsersContainer.style.display = 'grid';
      newUsersContainer.style.display = 'grid';

      const searchResultsContainer = document.querySelector('.search-results');
      if (searchResultsContainer && fetchedUsersContainer) {
        fetchedUsersContainer.removeChild(searchResultsContainer);
      }
    }
    // Handle Enter key
    else if (event.key === 'Enter') {
      const inputValue = event.target.value.trim();

      // If input is empty, set it to 'user '
      if (inputValue.length === 0) {
        event.preventDefault(); // Prevent the default behavior
        event.target.value = 'user '; // Set input to 'user '
      }
    }
  });

  // Create a function to handle the search process
  const handleSearch = async (username) => {
    const oldUsersContainer = document.querySelector('.old-users');
    const newUsersContainer = document.querySelector('.new-users');
    const fetchedUsersContainer = document.querySelector('.fetched-users');

    if (username) {
      // Temporarily hide old and new user containers
      oldUsersContainer.style.display = 'none';
      newUsersContainer.style.display = 'none';

      // Find or create the search results container
      let searchResultsContainer = document.querySelector('.search-results');
      if (!searchResultsContainer) {
        searchResultsContainer = createUserContainer('search-results');
        fetchedUsersContainer.appendChild(searchResultsContainer); // Append if it's newly created
      } else {
        // Clear previous search results if the container already exists
        searchResultsContainer.innerHTML = null; // Clear existing elements
      }

      const userElements = []; // Initialize userElements array

      try {
        // Fetch user IDs by username
        const userIds = await getUserIDsByName(username);

        // Iterate over each user ID and retrieve profile data
        await Promise.all(userIds.map(async (userId) => {
          // Retrieve the user's profile data once
          const profileData = await getUserProfileData(userId, false); // Do not touch localStorage key "fetchedUsers"

          // Create user element data using the retrieved profile data
          const userData = {
            rank: profileData.rank, // Assign rank directly
            login: profileData.login,
            registered: profileData.registeredDate, // Set registered to registeredDate
            bestSpeed: profileData.bestSpeed,
            ratingLevel: profileData.ratingLevel,
            friends: profileData.friends,
            cars: profileData.cars,
            avatarTimestamp: profileData.avatarTimestamp,
            avatar: profileData.avatar // Include avatar in userData
          };

          // Create the user element with userId and userData
          const userElementData = createCachePanelUserElement(userId, userData);
          if (userElementData) {
            userElements.push(userElementData);
          }
        }));

        // Sort userElements by rank and best speed
        userElements.sort((a, b) =>
          a.order !== b.order ? a.order - b.order : b.bestSpeed - a.bestSpeed
        );

        // Append user elements to the search results container
        userElements.forEach(({ userElement }) => {
          searchResultsContainer.appendChild(userElement);
        });

        // Create and append the description for search results
        const searchDescription = createDescription(`Search Results for: ${username}`, 'search-results-description');
        searchResultsContainer.prepend(searchDescription); // Append description as the first element

      } catch (error) {
        console.error('Error fetching user profile:', error);

        // Create an error message element and append it to the container
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = `Error fetching user profile: ${error.message}`;
        searchResultsContainer.appendChild(errorMessage);
      }
    }
  };

  // Debounce the handleSearch function to prevent excessive calls
  cacheSearchInput.addEventListener(
    'input',
    debounce((event) => {
      const inputValue = event.target.value.trim();
      const searchMode = localStorage.getItem('cachePanelSearchMode');

      // Extract username if input starts with 'user ', or use input directly in 'fetch' mode
      const username = inputValue.startsWith('user ')
        ? inputValue.substring(5).trim()
        : (searchMode === 'fetch' ? inputValue : '');

      // Trigger search if a valid username exists
      if (username) handleSearch(username);
    }, debounceTimeout)
  );

  // Append the search container to the panel header container
  panelHeaderContainer.appendChild(cacheSearchContainer);

  // Use a mutation observer to wait for the element to appear in the DOM
  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.type === 'childList' && mutation.addedNodes.length > 0)) {
      const cachePanelSearchInput = document.querySelector('.cached-users-search-input');
      const cachePanelLogins = Array.from(document.querySelectorAll('.fetched-users .login'));

      // Fuzzy match scoring function
      const getFuzzyMatchScore = (query, text) => {
        let score = 0, queryIndex = 0;
        for (const char of text.toLowerCase()) {
          if (queryIndex < query.length && char === query[queryIndex].toLowerCase()) {
            score += 2; // Increment score for matching character
            queryIndex++; // Increment index for the next character
          }
        }
        return queryIndex === query.length ? score : 0;
      };

      // Filter items based on input query
      const filterItems = query => {
        cachePanelLogins.forEach(item => {
          const userContainer = item.closest('.user-item');
          userContainer.style.display = (!query || getFuzzyMatchScore(query, item.textContent) > 0) ? 'grid' : 'none';
        });
      };

      // Set focus to the search input field
      cachePanelSearchInput.focus();

      // Add input event listener to filter items as the user types
      cachePanelSearchInput.addEventListener('input', () => filterItems(cachePanelSearchInput.value.trim()));

      observer.disconnect();
    }
  });

  // Start observing the panel header container for changes
  observer.observe(panelHeaderContainer, { childList: true, subtree: true });

  // Create a container div with class 'panel-control-buttons'
  const panelControlButtons = document.createElement('div');
  panelControlButtons.className = 'panel-control-buttons';
  panelControlButtons.style.display = 'flex';

  // Create cache panel search mode button with the provided SVG icon
  const cachePanelSearchMode = document.createElement('div');
  cachePanelSearchMode.className = 'large-button user-mode-button';
  cachePanelSearchMode.innerHTML = usersSVG;

  // Set the initial value or existing for cachePanelSearchMode if it doesn't exist
  const currentSearchMode = localStorage.getItem('cachePanelSearchMode') || (localStorage.setItem('cachePanelSearchMode', 'cache'), 'cache');

  // Set the title dynamically
  cachePanelSearchMode.title = `Current active mode: ${currentSearchMode}`;

  // Function to update styles based on the current mode
  function updateStyles(mode) {
    const button = cachePanelSearchMode;

    // Toggle classes by removing and adding the appropriate class
    button.classList.toggle('cache-mode-button', mode === 'cache');
    button.classList.toggle('fetch-mode-button', mode !== 'cache');
  }

  // Initial mode setup based on the current mode
  updateStyles(currentSearchMode);

  // Add click event listener to the cache panel search mode button
  cachePanelSearchMode.addEventListener('click', () => {
    // Toggle between 'cache' and 'fetch' values
    const currentMode = localStorage.getItem('cachePanelSearchMode');
    const newMode = currentMode === 'cache' ? 'fetch' : 'cache';
    // Set new mode in localStorage
    localStorage.setItem('cachePanelSearchMode', newMode);
    // Update styles based on the new mode
    updateStyles(newMode);
    // Set the title dynamically based on the new mode
    cachePanelSearchMode.title = `Current active mode: ${newMode}`;
    // Optional: Log the current mode for debugging
    // console.log(`Current mode: ${newMode}`);
  });

  // Append the search mode button to the panel header container
  panelControlButtons.appendChild(cachePanelSearchMode);

  // Create a clear cache button with the provided SVG icon
  const clearCacheButton = document.createElement('div');
  clearCacheButton.className = 'large-button panel-header-clear-button';
  clearCacheButton.title = 'Clear cache';
  clearCacheButton.innerHTML = trashSVG;

  // Add a click event listener to the clear cache button
  clearCacheButton.addEventListener('click', () => {
    // Call the helper function to hide and remove the cachedUsersPanel
    hideCachePanel();
    // Clear the cache manually and reset the timer
    refreshFetchedUsers(true, cacheRefreshThresholdHours);

    // Set the user count element to 0
    const userCountElement = document.querySelector('.cache-panel-load-button .cache-user-count');
    if (userCountElement) userCountElement.textContent = '0'; // Set the user count to 0
  });

  // Append the clear cache button to the panel header container
  panelControlButtons.appendChild(clearCacheButton);

  // Create a close button with the provided SVG icon
  const closePanelButton = document.createElement('div');
  closePanelButton.className = 'large-button panel-header-close-button';
  closePanelButton.title = 'Close panel';
  closePanelButton.innerHTML = closeSVG;

  // Add a click event listener to the close panel button
  closePanelButton.addEventListener('click', () => {
    // Remove the cached-users-panel when the close button is clicked
    hideCachePanel();
  });

  // Append the close button to the panel header container
  panelControlButtons.appendChild(closePanelButton);

  // Append the panel control buttons element inside the panel header container
  panelHeaderContainer.appendChild(panelControlButtons);

  // Create a container div with class 'fetched-users'
  const fetchedUsersContainer = document.createElement('div');
  fetchedUsersContainer.className = 'fetched-users';

  // Function to create a user container with common styles
  function createUserContainer(isOldUser) {
    const userContainer = document.createElement('div');
    userContainer.className = 'users-container';
    // Add a modifier class based on whether it's an old or new user
    userContainer.classList.add(isOldUser ? 'old-users' : 'new-users');
    return userContainer;
  }

  // Create containers for old and new users
  const oldUsersContainer = createUserContainer(true);
  const newUsersContainer = createUserContainer(false);

  // Function to create a description with customizable text and class
  function createDescription(text, className) {
    const description = document.createElement('span');
    description.className = `description ${className}`; // Add common 'description' class with the specific className
    description.textContent = text;
    return description;
  }

  // Create descriptions
  const oldUsersDescription = createDescription('Active Users', 'old-users-description');
  const newUsersDescription = createDescription('New Registrations', 'new-users-description');

  // Append descriptions to their respective containers
  oldUsersContainer.appendChild(oldUsersDescription); // Append description to old users container
  newUsersContainer.appendChild(newUsersDescription); // Append description to new users container

  // Append containers to the fetchedUsersContainer
  fetchedUsersContainer.appendChild(oldUsersContainer);
  fetchedUsersContainer.appendChild(newUsersContainer);

  // Create an array to hold user elements
  const userElements = [];

  // Flag to control if action log processing should continue
  let shouldProcessActionLog = true;

  // Get current date for comparison
  const currentDate = new Date();

  // Helper function to check if registered date is within the last 24 hours
  const isNewUser = (registered) => {
    const registeredDate = new Date(registered);
    const timeDifference = currentDate - registeredDate; // Difference in milliseconds
    return timeDifference <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  };

  // This function creates a user element for the cache panel with detailed user information and metrics.
  const createCachePanelUserElement = (userId, userData) => {
    // Create the main container for the user.
    const userElement = document.createElement('div');
    userElement.className = 'user-item';

    // Create an avatar container.
    const avatarElement = document.createElement('div');
    avatarElement.className = 'avatar';

    // Handle avatar URL and display logic.
    const avatarTimestamp = fetchedUsers[userId]?.avatarTimestamp;
    const bigAvatarUrl = `/storage/avatars/${userId}_big.png`;

    if ((avatarTimestamp && avatarTimestamp !== '00') || (userData.avatar && Object.keys(userData.avatar).length > 0)) {
      const finalAvatarUrl = `${bigAvatarUrl}?updated=${avatarTimestamp}`;
      const imgElement = document.createElement('img');
      imgElement.src = finalAvatarUrl;
      imgElement.alt = `${userData.login}'s avatar`;
      imgElement.style.objectFit = 'cover';
      avatarElement.appendChild(imgElement);
    } else {
      // Display a random emoji avatar if no avatar is available.
      avatarElement.innerHTML = getRandomEmojiAvatar();
    }

    // Create the user data container and append login and rank elements.
    const userDataElement = document.createElement('div');
    userDataElement.className = 'user-data';

    // Create a container to hold the login and visits elements
    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-container';

    // Create the login element with a link to the user's profile
    const loginElement = document.createElement('a');
    loginElement.className = 'login';
    loginElement.textContent = userData.login;
    loginElement.href = `https://klavogonki.ru/profile/${userId}`;

    // Append the login element to the container
    loginContainer.appendChild(loginElement);

    // Define the URL for user profile messaging
    const profileUrl = profileBaseUrl + userId;
    const messageInProfile = `${profileBaseUrl}${myUserId}/messages/${userId}/`;

    // Attach a click event listener to the loginElement element
    loginElement.addEventListener('click', function (event) {
      event.preventDefault(); // Prevent the default link action

      // Check if both Ctrl and Shift keys are pressed during the click event
      if (event.ctrlKey && event.shiftKey) {
        const newTab = window.open(messageInProfile, '_blank'); // Open the messaging page in a new window
        if (newTab) newTab.focus(); // Attempt to make the new tab active
      }
      // Check if only the Ctrl key is pressed
      else if (event.ctrlKey) {
        loadProfileIntoIframe(messageInProfile); // Load the messaging profile into the iframe
      }
      // If Ctrl is not pressed, load the regular profile into the iframe
      else {
        loadProfileIntoIframe(profileUrl); // Load the regular profile into the iframe
      }
    });

    // Assuming 'userData' and 'userId' are available
    if (userData.visits !== undefined) {
      const visitsElement = document.createElement('span');
      visitsElement.className = 'visits';
      // Add dynamic class based on whether the user is tracked or untracked
      visitsElement.classList.add(userData.tracked ? 'tracked' : 'untracked');
      visitsElement.textContent = userData.visits;
      visitsElement.dataset.userId = userId;
      // Call the function to prepend an emoticon
      updateVisitsEmoticon(visitsElement);

      // Add the visitsElement to the fetchedUsersContainer
      loginContainer.appendChild(visitsElement);

      // Add click event listener to visitsElement
      visitsElement.addEventListener('click', (event) => {
        shouldProcessActionLog = true; // Set back to true to resume processing the action log
        const userId = visitsElement.dataset.userId; // Get the userId from the dataset
        const user = fetchedUsers[userId]; // Retrieve the user data
        const actionLog = user ? user.actionLog : null; // Access actionLog if user exists

        if (user) {
          // Check if the action log container already exists
          let actionLogContainer = document.querySelector('.action-log');
          if (!actionLogContainer) {
            // Create a container for the action log display if it doesn't exist
            actionLogContainer = document.createElement('div');
            actionLogContainer.className = 'action-log';

            // Append the action log container to the specific container (fetchedUsersContainer)
            fetchedUsersContainer.appendChild(actionLogContainer);
            adjustVisibility(actionLogContainer, 'show', 1);
          } else {
            // Clear all child elements using replaceChildren (it's an empty operation for now)
            actionLogContainer.replaceChildren();
          }

          if (actionLog && shouldProcessActionLog) {
            for (let index = 0; index < actionLog.length; index++) {
              if (!shouldProcessActionLog) break;
              const action = actionLog[index];
              if (typeof action !== "object" || action === null) continue;
              const { type, timestamp } = action;
              const userAction = userData?.login || "Unknown User";
              const actionIconType = type === 'enter' ? enterSVG : leaveSVG;
              const userPresence = type === 'enter';
              // Use IIFE to capture the current value of shouldProcessActionLog
              ((currentShouldProcess) => {
                setTimeout(() => {
                  if (currentShouldProcess) {
                    createStaticNotification(userAction, actionIconType, timestamp, userPresence, 'cachePanel');
                  }
                }, 10 * (index + 1));
              })(shouldProcessActionLog);
            }
          }

          const closeActionLog = (e) => {
            if (!actionLogContainer.contains(e.target) || e.code === 'Space') {
              if (e.code === 'Space') e.preventDefault(); // Prevent the default space key behavior
              adjustVisibility(actionLogContainer, 'hide', 0);
              shouldProcessActionLog = false;
              ['click', 'keydown'].forEach(event => document.removeEventListener(event, closeActionLog));
            }
          };

          ['click', 'keydown'].forEach(event => document.addEventListener(event, closeActionLog));

          // Prevent the click on visitsElement from propagating, so it doesn't close immediately
          event.stopPropagation();
        } else {
          console.error('User data not found');
        }
      });
    }

    // Append login container to user data element
    userDataElement.appendChild(loginContainer);

    const rankElement = document.createElement('div');
    rankElement.className = 'rank';
    rankElement.textContent = userData.rank || 'N/A';
    rankElement.style.color = rankColors[userData.rank] || 'white';

    // Append rank element to the user data element
    userDataElement.appendChild(rankElement);

    // Add a registered date element with hover behavior.
    const registeredElement = document.createElement('div');
    registeredElement.className = 'registered';
    registeredElement.textContent = userData.registered || 'N/A';

    let hoverTimer;
    const originalContent = registeredElement.textContent;

    registeredElement.addEventListener('mouseover', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        registeredElement.textContent = calculateTimeOnSite(userData.registered);
      }, 300);
    });

    registeredElement.addEventListener('mouseout', () => {
      clearTimeout(hoverTimer);
      registeredElement.textContent = originalContent;
    });

    // Append registered element to user data element
    userDataElement.appendChild(registeredElement);

    // Helper function to create metric elements (speed, rating, etc.).
    const createMetricElement = (className, color, icon, value, title, url) => {
      const element = document.createElement('span');
      element.className = className;
      element.style.color = color;
      element.innerHTML = `${icon}${value || 0}&nbsp;&nbsp;`;
      element.title = title;
      element.style.cursor = 'pointer';
      element.addEventListener('click', () => loadProfileIntoIframe(url));
      return element;
    };

    // Create individual metric elements for the user.
    const bestSpeedElement = createMetricElement(
      'best-speed',
      'cyan',
      '🚀',
      userData.bestSpeed,
      'Best speed',
      `https://klavogonki.ru/u/#/${userId}/stats/normal/`
    );

    const ratingLevelElement = createMetricElement(
      'rating-level',
      'gold',
      '⭐',
      userData.ratingLevel,
      'Rating level',
      `https://klavogonki.ru/top/rating/today?s=${userData.login}`
    );

    const carsElement = createMetricElement(
      'cars-count',
      'lightblue',
      '🚖',
      userData.cars,
      'Cars count',
      `https://klavogonki.ru/u/#/${userId}/car/`
    );

    const friendsElement = createMetricElement(
      'friends-count',
      'lightgreen',
      '🤝',
      userData.friends,
      'Friends count',
      `https://klavogonki.ru/u/#/${userId}/friends/list/`
    );

    // Group all metrics into a container.
    const userMetrics = document.createElement('div');
    userMetrics.className = 'user-metrics';

    // Append metrics elements into metrics wrapper
    userMetrics.append(bestSpeedElement, ratingLevelElement, carsElement, friendsElement);

    // Append all the groups of elements
    userElement.append(avatarElement, userDataElement, userMetrics);

    // Return the created user element and its relevant data.
    return {
      userElement,
      order: rankOrder[userData.rank] || 10,
      bestSpeed: userData.bestSpeed || 0,
      registered: userData.registered
    };
  };

  // Check if the current mode is 'cache'
  if (localStorage.getItem('cachePanelSearchMode') === 'cache') {
    // Iterate through each user
    Object.keys(users).forEach(async (userId) => {
      const userData = users[userId];
      const userElementData = createCachePanelUserElement(userId, userData);
      userElements.push(userElementData);
    });

    // Sort userElements by rank and best speed
    userElements.sort((a, b) =>
      // First by rank, then by speed
      a.order !== b.order ? a.order - b.order : b.bestSpeed - a.bestSpeed
    );

    // Distribute userElements into new or old users containers
    userElements.forEach(({ userElement, registered }) => {
      // Choose container
      const targetContainer = isNewUser(registered) ? newUsersContainer : oldUsersContainer;
      // Append userElement
      targetContainer.appendChild(userElement);
    });
  }

  // Append the panel-header container to the cached-users-panel
  cachedUsersPanel.appendChild(panelHeaderContainer);
  // Append the fetched-users container to the cached-users-panel
  cachedUsersPanel.appendChild(fetchedUsersContainer);
  // Append the cached-users-panel to the body
  document.body.appendChild(cachedUsersPanel);

  // Create and append scroll buttons
  const {
    scrollButtonsContainer
  } = createScrollButtons(fetchedUsersContainer);
  cachedUsersPanel.appendChild(scrollButtonsContainer);

  // Fade in the cached users panel
  triggerTargetElement(cachedUsersPanel, 'show');

  // Show the dimming background
  triggerDimmingElement('show');

  // Function to update the remaining time
  function updateRemainingTime() {
    const lastClearTime = localStorage.getItem('lastClearTime');
    const nextClearTime = localStorage.getItem('nextClearTime');
    const dropTimeExpiration = document.querySelector('.drop-time-expiration');

    if (lastClearTime && nextClearTime && dropTimeExpiration) {
      const currentTime = new Date().getTime();

      // Calculate the remaining time until the next cache clear
      const remainingTime = nextClearTime - currentTime;

      // If remaining time is zero or less, execute the refreshFetchedUsers function
      remainingTime <= 0
        ? refreshFetchedUsers(true, cacheRefreshThresholdHours)
        : updatedropTimeExpiration(dropTimeExpiration, remainingTime);
    }
  }

  // Create a mapping of seconds to clock emojis
  const emojiMap = {
    0: '🕛',
    5: '🕐',
    10: '🕑',
    15: '🕒',
    20: '🕓',
    25: '🕔',
    30: '🕕',
    35: '🕖',
    40: '🕗',
    45: '🕘',
    50: '🕙',
    55: '🕚',
  };

  // Function to update the drop-time-expiration span
  function updatedropTimeExpiration(dropTimeExpiration, remainingTime) {
    // Calculate hours, minutes, and seconds
    const hours = String(Math.floor(remainingTime / (60 * 60 * 1000))).padStart(2, '0');
    const minutes = String(Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000))).padStart(2, '0');
    const seconds = String(Math.floor((remainingTime % (60 * 1000)) / 1000)).padStart(2, '0');

    // Create the formatted time string
    const remainingTimeString = `${hours}:${minutes}:${seconds}`;

    // Determine the current seconds
    const parsedSeconds = parseInt(seconds, 10);

    // Use the parsed seconds to find the emoji index, moving one forward
    const nextInterval = Math.ceil(parsedSeconds / 5) * 5; // Move to the next 5-second mark
    const currentEmoji = emojiMap[nextInterval] || emojiMap[0]; // Default to 00 if not found

    // Update the drop-time-expiration span with the time and emoji
    dropTimeExpiration.textContent = `${remainingTimeString} ${currentEmoji}`;
  }

  // Call the function to update the remaining time every second
  setInterval(updateRemainingTime, 1000);

  // Initial update
  updateRemainingTime();
} // showCachePanel END

// Global function to smoothly hide and remove the cachedUsersPanel
function hideCachePanel() {
  const cachedUsersPanel = document.querySelector('.cached-users-panel');

  if (cachedUsersPanel) {
    // Call the fade function for the cachedUsersPanel
    triggerTargetElement(cachedUsersPanel, 'hide');
    // Call the fade function for the dimming element
    triggerDimmingElement('hide');
  }
} // hideCachePanel END

export function createCacheButton(panel) {
  // Create a new element with class 'cache-panel-load-button'
  const showUserListCacheButton = document.createElement('div');

  // Add the classes to the button
  showUserListCacheButton.classList.add("empowerment-button", "cache-panel-load-button");

  // Apply cache-specific styles
  showUserListCacheButton.style.position = 'relative';
  showUserListCacheButton.style.zIndex = '3';

  // Set the inner HTML with the icon (using the global variable or later fix)
  showUserListCacheButton.innerHTML = userlistCacheSVG; // Adjust this later as needed

  // Create the small indicator for user count
  const cacheUserCount = document.createElement('div');
  cacheUserCount.classList.add('cache-user-count');

  // Initially set the count based on localStorage
  const cacheUserCountValue = Object.keys(fetchedUsers).length;
  cacheUserCount.textContent = cacheUserCountValue;

  showUserListCacheButton.appendChild(cacheUserCount);

  // Assign a title to the button
  showUserListCacheButton.title = 'Show Cache Panel';

  // Add a click event listener to the button
  showUserListCacheButton.addEventListener('click', function () {
    // Add pulse effect for the button (ensure addPulseEffect is defined or imported)
    addPulseEffect(showUserListCacheButton);

    // Call showCachePanel to show the cache panel (ensure showCachePanel is defined or imported)
    showCachePanel();
  });

  // Append the button to the provided panel
  panel.appendChild(showUserListCacheButton);
}

// Function to update the user count displayed near the cache button based on localStorage
export function updateUserCountText() {
  const userCountElement = document.querySelector('.cache-panel-load-button .cache-user-count');
  if (!userCountElement) return; // Ensure the element exists

  // Get count from state instead of localStorage
  const newUserCount = Object.keys(fetchedUsers).length.toString();

  // Update the text content and add pulse effect if the count has changed
  if (newUserCount !== userCountElement.textContent) {
    userCountElement.textContent = newUserCount;
    addPulseEffect(userCountElement);
  }
}