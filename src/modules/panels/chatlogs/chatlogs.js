import "./chatlogs.scss" // chatlogs styles

import { convertImageLinksToImage } from "../../converters/image-converter.js"; // image converter
import { convertVideoLinksToPlayer } from "../../converters/video-converter.js"; // video converter

// icons
import {
  closeSVG,
  chatLogsSVG,
  calendarSVG,
  personalMessagesSVG,
  mediaMessagesSVG,
  clipboardSVG,
  toggleLeftSVG,
  toggleRightSVG,
  chevronLeftSVG,
  chevronRightSVG,
  shuffleSVG
} from "../../icons.js";

// helpers
import {
  removePreviousPanel,
  createScrollButtons,
  triggerDimmingElement,
  triggerTargetElement,
  processEncodedLinks,
  highlightMentionWords,
  scrollToMiddle,
  getExactUserIdByName,
  copyChatlogsUrlToClipboard
} from '../../helpers.js';

// definitions
import {
  today,
  state
} from '../../definitions.js';

import { addJumpEffect, addPulseEffect, addShakeEffect } from "../../animations.js"; // animations
import { settingsState } from "../../panels/settings/settings.js"; // settings
import { createCustomTooltip } from "../../tooltip.js";

const { ignored } = settingsState;

// Define dynamic variables
let {
  panelsEvents
} = state;

// Function to create the button for opening chat logs
export function createChatLogsButton(panel) {
  const showChatLogsButton = document.createElement('div');
  showChatLogsButton.classList.add("empowerment-button", "chat-logs-button");

  showChatLogsButton.style.position = 'relative';
  showChatLogsButton.style.zIndex = '1';
  showChatLogsButton.innerHTML = chatLogsSVG; // Add icon
  createCustomTooltip(showChatLogsButton, 'Show Chat Logs');

  showChatLogsButton.addEventListener('click', async function () {
    addPulseEffect(showChatLogsButton); // Add pulse effect
    await showChatLogsPanel();
  });

  panel.appendChild(showChatLogsButton);
}

// Function to fetch chat logs from the specified URL for a given date
const fetchChatLogs = async (date, messagesContainer) => {
  // Clear the messagesContainer if it exists
  messagesContainer && (messagesContainer.innerHTML = '');

  // Generate a random 20-digit number
  const randomParam = Math.floor(Math.random() * 10 ** 20);

  // Construct the URL to fetch chat logs for the specified date with the random parameter
  const url = `https://klavogonki.ru/chatlogs/${date}.html?rand=${randomParam}`;

  // Function to parse the HTML and extract chat log entries
  const parseChatLog = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    return [...doc.querySelectorAll('.ts')].map((timeElement) => {
      const usernameElement = timeElement.nextElementSibling;
      const messageNode = usernameElement?.nextSibling;

      const extractMessageText = (node) => {
        if (!node) return '';
        return [...node.childNodes].reduce((acc, child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            acc += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.tagName === 'A') {
              acc += child.getAttribute('href');
            } else if (child.tagName === 'BR') {
              return acc;
            }
          }
          return acc;
        }, '').trim();
      };

      if (usernameElement?.classList.contains('mn') && messageNode) {
        let messageText = '';

        if (messageNode.nodeType === Node.ELEMENT_NODE) {
          messageText = extractMessageText(messageNode);
        } else if (messageNode.nodeType === Node.TEXT_NODE) {
          const nextSibling = usernameElement.nextElementSibling;
          if (nextSibling && nextSibling.tagName === 'A') {
            messageText = `${messageNode.textContent.trim()} ${nextSibling.getAttribute('href')}`;
          } else {
            messageText = messageNode.textContent.trim();
          }
        }

        if (!messageText) {
          const combinedText = extractMessageText(usernameElement.nextSibling);
          messageText = combinedText;
        }

        return {
          time: timeElement.textContent.trim().replace(/[\[\]]/g, ''),
          username: usernameElement.textContent.trim().replace(/<|>/g, ''),
          message: messageText || null,
        };
      }

      // Handle case where username is not found, and instead, `mne` class is present (system message)
      const systemMessageElement = timeElement.nextElementSibling;
      if (systemMessageElement && systemMessageElement.classList.contains('mne')) {
        // Extract the text directly from the <font> element
        const messageText = systemMessageElement.textContent.trim();
        return {
          time: timeElement.textContent.trim().replace(/[\[\]]/g, ''),
          username: 'SYSTEM', // Set username as 'SYSTEM' for system messages
          message: messageText || null,
        };
      }

      return null;
    }).filter(Boolean);
  };

  try {
    // Fetch chat logs from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Get the HTML content
    const html = await response.text();

    // Limit the size of the HTML to 5KB
    const sizeLimitKB = 1000; // Set the size limit in KB
    const sizeLimitBytes = sizeLimitKB * 1024; // Convert KB to bytes
    const htmlContent = html.length > sizeLimitBytes ? html.slice(0, sizeLimitBytes) : html;

    // Parse the HTML and extract chat logs
    const chatlogs = parseChatLog(htmlContent);

    const limitReached = html.length > sizeLimitBytes;

    // Step 1: Remove consecutive duplicate messages
    const noSpamMessages = [];
    let lastMessage = null;

    for (const log of chatlogs) {
      const isDifferentMessage = log.message !== lastMessage?.message;
      const isDifferentUser = log.username !== lastMessage?.username;

      // Include the message if:
      // - It's the first message, or
      // - It's a different message or from a different user
      if (isDifferentMessage || isDifferentUser) {
        noSpamMessages.push(log);
        lastMessage = log;
      }
    }

    // Step 2: Filter out messages from ignored users
    const finalChatlogs = noSpamMessages.filter((log) => !ignored.includes(log.username));

    // Return the filtered chat logs, size of HTML, URL, and info
    return {
      chatlogs: finalChatlogs,
      url: url,
      size: htmlContent.length,
      info: limitReached,
      error: null,
    }
  } catch (error) {
    // Handle other errors (e.g., parsing errors)
    return {
      chatlogs: [],
      url: url,
      size: 0,
      error: error.message,
    }
  }
}

const minDate = '2012-02-12'; // Define the minimum date

function getRandomDateInRange() {
  const startDate = new Date(minDate); // Start date
  const endDate = new Date(); // Current date

  // Calculate the difference in milliseconds
  const dateDifference = endDate - startDate;

  // Generate a random number of milliseconds between 0 and dateDifference
  const randomMilliseconds = Math.floor(Math.random() * dateDifference);

  // Create a random date by adding the random milliseconds to the start date
  const randomDate = new Date(startDate.getTime() + randomMilliseconds);

  // Format the date to 'YYYY-MM-DD' using Intl.DateTimeFormat
  const formattedDate = new Intl.DateTimeFormat('en-CA').format(randomDate);

  return formattedDate;
}

// Function to get user ID by username (with caching in localStorage)
async function getUserId(username) {
  const userIdsCache = JSON.parse(localStorage.getItem('userIdsCache') || '{}');

  // If the user ID is cached, return it
  if (userIdsCache[username]) return userIdsCache[username];

  try {
    // Fetch the user ID
    const userId = await getExactUserIdByName(username);
    if (userId) {
      userIdsCache[username] = userId;
      localStorage.setItem('userIdsCache', JSON.stringify(userIdsCache));
      return userId;
    }
  } catch (error) {
    console.error(`Error fetching user ID for ${username}:`, error);
  }

  return null; // Return null if no user found
}

// Initialize the visibility state for media and mention messages
let visibleMessages = { media: false, mention: false };

// Function to reset the visibleMessages object
const resetVisibleMessages = () => { visibleMessages = { media: false, mention: false }; };

// Function to toggle the visibility of message items based on the given selector
async function toggleMessagesVisibility(selector) {
  // Determine if the selector is 'media' or 'mention' and update visibility states
  const isMedia = selector === 'media';
  const isMention = selector === 'mention';

  // Update the visibility state: toggle the selected type and reset the other
  visibleMessages = {
    media: isMedia ? !visibleMessages.media : false, // Toggle media visibility
    mention: isMention ? !visibleMessages.mention : false // Toggle mention visibility
  };

  // Iterate over all message items and apply the corresponding visibility rules
  document.querySelectorAll('.message-item').forEach(item => {
    // Check if the message item contains media or mention content
    const hasMediaClass = item.querySelector('.media');
    const hasMentionClass = item.querySelector('.mention');

    // Case: Showing only media elements (when 'media' is toggled)
    if (visibleMessages.media) {
      item.style.contentVisibility = hasMediaClass ? 'visible' : 'hidden'; // Show/hide based on media class
      item.style.fontSize = hasMediaClass ? '' : '0'; // Adjust font size based on visibility
    }
    // Case: Showing only mention elements (when 'mention' is toggled)
    else if (visibleMessages.mention) {
      item.style.contentVisibility = hasMentionClass ? 'visible' : 'hidden'; // Show/hide based on mention class
      item.style.fontSize = hasMentionClass ? '' : '0'; // Adjust font size based on visibility
    }
    // Case: Show all messages when neither 'media' nor 'mention' is toggled
    else {
      item.style.contentVisibility = 'visible'; // Ensure the message is visible
      item.style.fontSize = ''; // Reset font size to default
    }
  });
}

//   Function to display the chat logs panel
// Load initially with default date or date given by personal messages panel with parameter date
export async function showChatLogsPanel(personalMessagesDate) {
  // Check if the panel already exists
  const existingPanel = document.querySelector('.chat-logs-panel');
  if (existingPanel) {
    existingPanel.remove(); // Remove the settings panel
    triggerDimmingElement('hide');
    return; // Return immediately to prevent further execution
  }

  // Remove any previous panel before creating a new one
  removePreviousPanel();

  // Create a container div with class 'chat-logs-panel'
  const chatLogsPanel = document.createElement('div');
  chatLogsPanel.className = 'chat-logs-panel popup-panel';

  // Create a container div for the panel header
  const panelHeaderContainer = document.createElement('div');
  panelHeaderContainer.className = 'panel-header';

  // Create a container div with class 'panel-control-buttons'
  const panelControlButtons = document.createElement('div');
  panelControlButtons.className = 'panel-control-buttons';

  // Create a container div for the search input
  const chatlogsSearchContainer = document.createElement('div');
  chatlogsSearchContainer.className = 'search-for-chatlogs-messages';

  // Create the input field for searching users
  const chatlogsSearchInput = document.createElement('input');
  chatlogsSearchInput.className = 'chatlogs-search-input';
  chatlogsSearchInput.type = 'text';
  createCustomTooltip(chatlogsSearchInput, `
    [Ctrl + Click] clear input and reset filtered items
    [Valid date + Enter] load chat logs for the date in input field (e.g. 2023-10-01, 2023:10:01, 231001, 2310, 2310:01)
    `
  );

  // Append search input to the search container
  chatlogsSearchContainer.appendChild(chatlogsSearchInput);
  // Append the search container to the panel header container
  panelHeaderContainer.appendChild(chatlogsSearchContainer);

  // Add input event listener to filter items as the user types
  chatlogsSearchInput.addEventListener('input', () => filterItems(chatlogsSearchInput.value));

  // Clears the input when the left mouse button (LMB) is clicked while holding the Ctrl key
  // Also updates the filtered items accordingly
  chatlogsSearchInput.addEventListener('click', (event) => {
    if (event.ctrlKey) {
      chatlogsSearchInput.value = '';
      // Call the function to update the filtered items based on the cleared input
      filterItems(chatlogsSearchInput.value);
    }
  });

  // Add keydown event listener to handle date format and validity check
  chatlogsSearchInput.addEventListener('keydown', async (event) => {
    const inputValue = chatlogsSearchInput.value;

    if (event.key === 'Enter') {
      let normalizedDate = inputValue;

      // Handle 8-digit and 6-digit date formats
      if (/^\d{8}$/.test(inputValue)) {
        normalizedDate = inputValue.length === 6 ? '20' + inputValue : inputValue;
        normalizedDate = normalizedDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      } else if (/^\d{6}$/.test(inputValue)) {
        normalizedDate = '20' + inputValue.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3');
      }

      // Check if the normalized input matches either 'yyyy:mm:dd' or 'yyyy-mm-dd' format
      const isValidFormat = /^\d{2,4}[:\-]\d{2}[:\-]\d{2}$/.test(normalizedDate.replace(/:/g, '-'));

      // Check if the normalized date is a valid date
      const isValidDate = isValidFormat && !isNaN(new Date(normalizedDate.replace(/:/g, '-')).getTime());

      if (isValidDate) {
        await loadChatLogs(normalizedDate); // Load chat logs for the determined date
        showDateInput(dateInput);
      } else {
        alert('Please enter a valid date.\n\nValid formats include:\n' +
          '1. yyyy-mm-dd\n' +
          '2. yyyy:mm:dd\n' +
          '3. yy-mm-dd\n' +
          '4. yy:mm:dd\n' +
          '5. yyyymmdd\n' +
          '6. yymmdd\n\n');
      }

      // Clear the input value after processing the "Enter" key
      chatlogsSearchInput.value = '';
    }
  });

  // Focus on the search input using requestAnimationFrame
  function focusOnSearchField() { requestAnimationFrame(function () { chatlogsSearchInput.focus(); }); } focusOnSearchField();

  // Create a date input toggle with similar styles as the close button
  const dateInputToggle = document.createElement('div');
  dateInputToggle.className = "large-button panel-header-date-button";
  dateInputToggle.innerHTML = calendarSVG;

  // Function to toggle visibility of an element
  function toggleDateInputVisibility(element) {
    element.style.display = element.style.display === 'none' ? 'flex' : 'none';
  }

  // Function to show the date input if it is currently hidden
  function showDateInput(element) {
    if (element.style.display === 'none') element.style.display = 'flex';
  }

  // Toggle the visibility of the date input when the toggle is clicked
  dateInputToggle.addEventListener('click', () => {
    toggleDateInputVisibility(dateInput);
  });

  // Create the date input field
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'chatlogs-date-input';
  dateInput.style.display = "none";

  // Append the date button and input field to the control buttons container
  panelControlButtons.appendChild(dateInputToggle);
  panelControlButtons.appendChild(dateInput);

  // Create a toggle mention messages component
  const toggleMentionMessages = document.createElement('div');
  toggleMentionMessages.className = "large-button toggle-mention-messages-button";
  // Set the inner HTML of the toggle component with a suitable SVG or text
  toggleMentionMessages.innerHTML = personalMessagesSVG;
  createCustomTooltip(toggleMentionMessages, 'Toggle Mention Messages');

  // Add a click event listener to toggle the visibility of messages without mentions
  toggleMentionMessages.addEventListener('click', async () => {
    await toggleMessagesVisibility('mention');
  });

  // Create a new div element for the toggle mention messages counter
  const toggleMentionMessagesCounter = document.createElement('div');
  // Assign a class name to the element
  toggleMentionMessagesCounter.className = 'toggle-mention-messages-counter';
  toggleMentionMessagesCounter.textContent = '0'; // Set as default value before assign

  // Append the counter inside the toggleMentionMessages component
  toggleMentionMessages.appendChild(toggleMentionMessagesCounter);
  // Append the toggle mention messages component to the control panel
  panelControlButtons.appendChild(toggleMentionMessages);

  // Create a toggle media messages component
  const toggleMediaMessages = document.createElement('div');
  toggleMediaMessages.className = "large-button panel-header-toggle-media-messages";
  // Set the inner HTML of the toggle component with a suitable SVG or text
  toggleMediaMessages.innerHTML = mediaMessagesSVG;
  createCustomTooltip(toggleMediaMessages, 'Toggle Media Messages');
  // Apply common styles to the component
  // applyHeaderButtonStyles(toggleMediaMessages, 'darkslategray');

  // Add a click event listener to toggle the visibility of media messages
  toggleMediaMessages.addEventListener('click', async () => {
    await toggleMessagesVisibility('media');
  });

  // Create a new div element for the toggle media messages counter
  const toggleMediaMessagesCounter = document.createElement('div');
  // Assign a class name to the element
  toggleMediaMessagesCounter.className = 'toggle-media-messages-counter';
  toggleMediaMessagesCounter.textContent = '0'; // Set as default value before assign

  // Append the counter inside the toggleMediaMessages component
  toggleMediaMessages.appendChild(toggleMediaMessagesCounter);

  // Append the toggle media messages component to the control panel
  panelControlButtons.appendChild(toggleMediaMessages);

  // Function to update the media and mention counters
  function updateMediaAndMentionCounters() {
    // Update the media counter
    toggleMediaMessagesCounter.textContent = document.querySelectorAll('.chat-logs-container .media').length;
    // Update the mention counter
    toggleMentionMessagesCounter.textContent = document.querySelectorAll('.chat-logs-container .mention').length;
  }

  // Create a copy chatlogs button element
  const copyChatLogsUrl = document.createElement('div');
  copyChatLogsUrl.className = "large-button panel-header-copy-button";
  // Set the inner HTML of the copy chat logs element with the clipboard SVG
  copyChatLogsUrl.innerHTML = clipboardSVG;
  createCustomTooltip(copyChatLogsUrl, `
    [Click] to copy Chat Logs Url
    [Ctrl + Click] to save Chat Logs with title
    [Shift + Click] to show/hide saved Chat Logs
  `);

  // Helper function to extract date from the URL
  const extractDateFromUrl = (url) => {
    const chatlogsDateRegex = /(\d{4}-\d{2}-\d{2})/;
    const match = url.match(chatlogsDateRegex);
    return match ? match[1] : null; // Return the date if match is found, else return null
  };

  // Function to create and populate chat log links
  function createChatLogLinks(savedChatlogs, chatLogsLinksContainer) {
    // Check if the container exists and return if not
    if (!chatLogsLinksContainer) return;
    // Clear the container before repopulating it
    chatLogsLinksContainer.replaceChildren();

    savedChatlogs.forEach(({ url, title }) => {
      const date = extractDateFromUrl(url); // Extract date from URL

      // Create the wrapper container for each link
      const logWrapper = document.createElement('div');
      logWrapper.classList.add('saved-chatlog-url-wrapper');

      // Create the log link element
      const logLink = document.createElement('a');
      logLink.classList.add('saved-chatlog-url');
      logLink.textContent = date; // Display the date
      logLink.href = url; // Store the URL in the href attribute

      logLink.addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent the default link behavior

        if (event.ctrlKey) {
          const urlToRemove = event.target.href;
          // Find the exact match in the savedChatlogs array and remove it
          const updatedChatlogs = savedChatlogs.filter(log => log.url !== urlToRemove);

          // If there was a change, update localStorage and remove the link
          if (updatedChatlogs.length !== savedChatlogs.length) {
            savedChatlogs = updatedChatlogs;
            localStorage.setItem('savedChatlogs', JSON.stringify(savedChatlogs));
            const targetLink = event.target;
            targetLink.closest('.saved-chatlog-url-wrapper').remove(); // Remove the wrapper
          }
        } else {
          // Handle when Ctrl is not pressed
          await loadChatLogs(date);
        }
      });

      // Create the title element
      const logTitle = document.createElement('span');
      logTitle.classList.add('saved-chatlog-url-title');
      logTitle.textContent = title || '➕'; // Display the title (or an empty string if none provided)

      // Add click event listener to the title
      logTitle.addEventListener('click', () => {
        const newTitle = prompt('Enter a new title for this chat log:', logTitle.textContent);

        if (newTitle !== null && newTitle !== logTitle.textContent) {
          // Update the title displayed on the page
          logTitle.textContent = newTitle;

          // Find the log by URL in the savedChatlogs array and update its title
          const logIndex = savedChatlogs.findIndex(log => log.url === url);
          if (logIndex !== -1) {
            savedChatlogs[logIndex].title = newTitle; // Update the title in the saved object
            localStorage.setItem('savedChatlogs', JSON.stringify(savedChatlogs)); // Save the updated list to localStorage
          }
        }
      });

      // Append the elements to the wrapper
      logWrapper.appendChild(logLink);
      logWrapper.appendChild(logTitle);

      // Append the wrapper to the container
      chatLogsLinksContainer.appendChild(logWrapper);
    });
  }

  // Add a click event listener to copy chatLogsUrlForCopy to the clipboard
  copyChatLogsUrl.addEventListener('click', (event) => {
    let chatLogsLinksContainer = document.querySelector('.saved-chatlog-container');

    !chatLogsLinksContainer && !event.shiftKey && addJumpEffect(copyChatLogsUrl, 0, 0);

    if (chatLogsLinksContainer && !event.ctrlKey && !chatLogsLinksContainer.contains(event.target)) {
      chatLogsLinksContainer.remove();
    }

    let savedChatlogs = JSON.parse(localStorage.getItem('savedChatlogs')) || [];

    if (event.ctrlKey && !event.target.closest('.saved-chatlog-url')) {
      const currentUrlDate = extractDateFromUrl(chatLogsUrlForCopy);
      if (!currentUrlDate) return;

      // Ask for title input
      const title = prompt('Enter a title for this chat log:', '➕');

      // Check if the URL with the same date already exists
      const urlExists = savedChatlogs.some(log => extractDateFromUrl(log.url) === currentUrlDate);

      if (!urlExists) {
        // Add the new URL and title if no match was found for the date
        savedChatlogs.push({ url: chatLogsUrlForCopy, title: title || '➕' });

        // Sort the saved URLs based on the date extracted from the URL
        savedChatlogs.sort((a, b) => {
          const dateA = extractDateFromUrl(a.url);
          const dateB = extractDateFromUrl(b.url);
          return new Date(dateA) - new Date(dateB);
        });

        // Store the updated list back in localStorage
        localStorage.setItem('savedChatlogs', JSON.stringify(savedChatlogs));
      }
      createChatLogLinks(savedChatlogs, chatLogsLinksContainer);
    } else if (event.shiftKey) {
      if (savedChatlogs.length > 0 && !chatLogsLinksContainer) {
        chatLogsLinksContainer = document.createElement('div');
        chatLogsLinksContainer.classList.add('saved-chatlog-container');
        createChatLogLinks(savedChatlogs, chatLogsLinksContainer);

        copyChatLogsUrl.appendChild(chatLogsLinksContainer);
      }
    } else {
      navigator.clipboard.writeText(chatLogsUrlForCopy)
        .catch(err => console.error('Failed to copy: ', err));
    }
  });

  panelControlButtons.appendChild(copyChatLogsUrl);

  // Retrieve `shouldShowActiveUsers` from localStorage or set it to 'shown' if it doesn't exist
  const shouldShowActiveUsers = localStorage.getItem('shouldShowActiveUsers') || (localStorage.setItem('shouldShowActiveUsers', 'shown'), 'shown');

  // Create a toggle active users button
  const toggleActiveUsers = document.createElement('div');
  toggleActiveUsers.className = "large-button panel-header-toggle-button";
  updateActiveUsersToggle(shouldShowActiveUsers); // Set initial SVG based on stored state

  // Function to update the toggle button's SVG and title based on current state
  function updateActiveUsersToggle(state) {
    toggleActiveUsers.innerHTML = state === 'shown' ? toggleLeftSVG : toggleRightSVG; // Toggle between SVGs
    createCustomTooltip(toggleActiveUsers, state === 'shown' ? 'Hide User List' : 'Show User List');
  }

  // Function to toggle active users and update localStorage, SVG, and title
  function toggleActiveUsersState() {
    const newState = localStorage.getItem('shouldShowActiveUsers') === 'shown' ? 'hidden' : 'shown'; // Determine new state
    localStorage.setItem('shouldShowActiveUsers', newState); // Update localStorage
    updateActiveUsersToggle(newState); // Update the displayed SVG and title

    if (newState === 'shown') {
      // Call renderActiveUsers to update the display of active users based on their message counts
      renderActiveUsers(usernameMessageCountMap, chatLogsPanel);
    } else {
      // Remove the active users container if the state is hidden
      const activeUsersContainer = chatLogsPanel.querySelector('.active-users');
      if (activeUsersContainer) {
        chatLogsPanel.removeChild(activeUsersContainer);
      }
    }
  }

  // Add click event to toggle active users
  toggleActiveUsers.addEventListener('click', toggleActiveUsersState);

  // Append the toggle active users to the panel control buttons
  panelControlButtons.appendChild(toggleActiveUsers);

  // Create and style the chevron left button
  const oneDayBackward = document.createElement('div');
  oneDayBackward.className = "large-button panel-header-one-day-back-button";
  oneDayBackward.innerHTML = chevronLeftSVG; // Assuming you have chevronLeftSVG defined
  createCustomTooltip(oneDayBackward, 'Previous Day');

  // Create and style the chevron right button
  const oneDayForward = document.createElement('div');
  oneDayForward.className = "large-button panel-header-one-day-forward-button";
  oneDayForward.innerHTML = chevronRightSVG; // Assuming you have chevronRightSVG defined
  createCustomTooltip(oneDayForward, 'Next Day');

  // Create and style the shuffle button
  const randomDay = document.createElement('div');
  randomDay.className = "large-button panel-header-shuffle-button";
  randomDay.innerHTML = shuffleSVG; // Assuming you have shuffleSVG defined
  createCustomTooltip(randomDay, 'Random Date');

  // Function to get current date or fallback to today's date
  function getEffectiveDate() {
    return dateInput.value ? new Date(dateInput.value) : new Date(); // Use dateInput value or today's date
  }

  // Function to update the date input and title
  const updateDateInputAndTitle = (newDate) => {
    dateInput.value = newDate; // Update the date input
    createCustomTooltip(dateInputToggle, `Current date: ${newDate}`);
  };

  // Event listener for the chevron left button
  oneDayBackward.addEventListener('click', async () => {
    const currentDate = getEffectiveDate(); // Get the effective date
    currentDate.setDate(currentDate.getDate() - 1); // Go one day back
    await loadChatLogs(currentDate); // Load chat logs for the updated date
    showDateInput(dateInput);
    focusOnSearchField();
    resetVisibleMessages();
  });

  // Event listener for the chevron right button
  oneDayForward.addEventListener('click', async () => {
    const currentDate = getEffectiveDate(); // Get the effective date
    currentDate.setDate(currentDate.getDate() + 1); // Go one day forward
    await loadChatLogs(currentDate); // Load chat logs for the updated date
    showDateInput(dateInput);
    focusOnSearchField();
    resetVisibleMessages();
  });

  // Event listener for the shuffle button
  randomDay.addEventListener('click', async () => {
    const randomDate = getRandomDateInRange(); // Get a random date
    await loadChatLogs(randomDate); // Load chat logs for the random date
    showDateInput(dateInput);
    focusOnSearchField();
    resetVisibleMessages();
  });

  // Append buttons to the control buttons container
  panelControlButtons.appendChild(oneDayBackward);
  panelControlButtons.appendChild(oneDayForward);
  panelControlButtons.appendChild(randomDay);

  // Create a close button with the provided SVG icon
  const closePanelButton = document.createElement('div');
  closePanelButton.className = "large-button panel-header-close-button";
  closePanelButton.innerHTML = closeSVG;
  createCustomTooltip(closePanelButton, 'Close panel');

  // Add a click event listener to the close panel button
  closePanelButton.addEventListener('click', () => {
    // Fade out the chat logs panel when the close button is clicked
    triggerTargetElement(chatLogsPanel, 'hide');
    triggerDimmingElement('hide');
  });

  // Append close button to control buttons, and control buttons to header
  panelControlButtons.appendChild(closePanelButton);
  panelHeaderContainer.appendChild(panelControlButtons);

  // Create a container for the chat logs
  const chatLogsContainer = document.createElement('div');
  chatLogsContainer.className = 'chat-logs-container';

  // Append the header and chat logs container to the chat logs panel
  chatLogsPanel.appendChild(panelHeaderContainer);
  chatLogsPanel.appendChild(chatLogsContainer);

  // Append the chat logs panel to the body
  document.body.appendChild(chatLogsPanel);

  // Create and append scroll buttons
  const { scrollButtonsContainer } = createScrollButtons(chatLogsContainer);
  chatLogsPanel.appendChild(scrollButtonsContainer);

  // Fade in the chat logs panel and dimming background
  triggerTargetElement(chatLogsPanel, 'show');
  triggerDimmingElement('show');

  // Define an object to store the hue for each username
  const usernameHueMap = {};
  const hueStep = 15;
  let lastDisplayedUsername = null; // Variable to track the last displayed username
  // Initialize a map to track message counts for unique usernames
  const usernameMessageCountMap = new Map();
  // Store the current chat logs URL for clipboard copy.
  let chatLogsUrlForCopy = ''; // Store the current chat logs URL for copying

  // Function to load the total message count into the placeholder without replacing the existing text
  function loadTotalMessageCount() {
    if (chatLogsContainer.childElementCount > 0) {
      chatlogsSearchInput.placeholder += ` | Total messages: ${chatLogsContainer.childElementCount}`;
    }
  }

  // Function to load and display chat logs into the container
  const loadChatLogs = async (date) => {
    // Normalize date input to 'yyyy-mm-dd' format, supporting 'yyyy:mm:dd' format as well
    const normalizeDate = date => /^\d{4}:\d{2}:\d{2}$/.test(date) ? date.replace(/:/g, '-') : date;
    // Normalize and format the date
    const formattedDate = new Intl.DateTimeFormat('en-CA').format(new Date(normalizeDate(date)));

    // Check if the provided date is out of bounds (less than minDate or greater than today)
    if (formattedDate < minDate || formattedDate > today) {
      alert(formattedDate < minDate ? `The selected date cannot be earlier than ${minDate}.` : "You cannot load a future date.");
      return; // Exit the function if the date is invalid
    }

    // Call the updateDateInputAndTitle function with the formattedDate
    updateDateInputAndTitle(formattedDate);

    // Fetch chat logs and pass the chatLogsContainer as the parent container
    const { chatlogs, url, size, info, error } = await fetchChatLogs(formattedDate, chatLogsContainer);

    // Convert size to KB
    const sizeInKB = (size / 1024).toFixed(2);

    // Set placeholder for size in KB, info, or error
    chatlogsSearchInput.placeholder = error ? `Error: ${error}` : (info ? `Limit reached: ${sizeInKB} KB` : info || `Size: ${sizeInKB} KB`);

    // Assign the fetched URL to the chatLogsUrlForCopy variable
    chatLogsUrlForCopy = url;

    // Clear previous counts
    usernameMessageCountMap.clear();

    chatlogs.forEach(async ({ time, username, message }) => {
      // Update message count for each unique username
      usernameMessageCountMap.set(username, (usernameMessageCountMap.get(username) || 0) + 1);

      // Create a container for each message
      const messageContainer = document.createElement('div');
      messageContainer.classList.add('message-item');

      // Create time element
      const timeElement = document.createElement('span');
      timeElement.className = 'message-time';
      // Update the timeElement's text content with the adjusted time
      timeElement.textContent = time;

      // Create username element
      const usernameElement = document.createElement('span');
      usernameElement.className = 'message-username';
      usernameElement.textContent = username; // Use the original username for display

      // Check if the hue for this username is already stored
      let hueForUsername = usernameHueMap[username]; // Use the original username as the key

      // If the hue is not stored, generate a new random hue with the specified step
      if (!hueForUsername) {
        hueForUsername = Math.floor(Math.random() * (210 / hueStep)) * hueStep; // Limit hue to a maximum of 210
        // Store the generated hue for this username
        usernameHueMap[username] = hueForUsername; // Store hue using the original username as the key
      }

      // Apply the hue color to the username element
      usernameElement.style.color = `hsl(${hueForUsername}, 80%, 50%)`;

      // Create message text element
      const messageTextElement = document.createElement('span');
      messageTextElement.className = 'message-text';

      // Replace smiley codes with <img> tags, and then wrap links with <a> tags
      messageTextElement.innerHTML = message
        // Replace smiley codes like :word: with <img> tags
        .replace(/:(?=\w*[a-zA-Z])(\w+):/g,
          (_, word) => `<img src="/img/smilies/${word}.gif" alt=":${word}:" title=":${word}:" class="smile">`
        )
        // Wrap http and https links with <a> tags
        .replace(/(https?:\/\/[^\s]+)/gi,
          (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        );

      // Apply margin for the first message of a new user
      messageContainer.style.marginTop = lastDisplayedUsername !== username ? '0.6em' : '';

      // Update the last displayed username
      lastDisplayedUsername = username;

      // Append elements to the message container
      messageContainer.appendChild(timeElement);
      messageContainer.appendChild(usernameElement);
      messageContainer.appendChild(messageTextElement);

      // Append the message container to the chat logs container
      chatLogsContainer.appendChild(messageContainer);
    });

    // Call renderActiveUsers to update the display of active users based on their message counts
    renderActiveUsers(usernameMessageCountMap, chatLogsPanel, chatlogsSearchInput);

    requestAnimationFrame(() => {
      convertImageLinksToImage('chatlogsMessages');
      convertVideoLinksToPlayer('chatlogsMessages');
      processEncodedLinks('chatlogsMessages'); // Decodes links within the chat logs section.
      highlightMentionWords('chatlogsMessages');
      chatLogsContainer.scrollTop = chatLogsContainer.scrollHeight; // Scroll to the very bottom

      // Update the media and mention counters
      updateMediaAndMentionCounters();
      // Call the function to load the total message count once
      loadTotalMessageCount();
      // Call the filter function with the updated input value
      chatlogsSearchInput.value.length > 0 && filterItems(chatlogsSearchInput.value);
    });

  };

  // Renders the active users based on their message counts from the provided map
  function renderActiveUsers(usernameMessageCountMap, parentContainer, searchField) {
    // Check if active users should be shown
    if (localStorage.getItem('shouldShowActiveUsers') === 'shown') {
      // Check if the activeUsers container already exists
      let activeUsers = parentContainer.querySelector('.active-users');

      // If it doesn't exist, create it
      if (!activeUsers) {
        activeUsers = document.createElement('div');
        activeUsers.className = 'active-users';

        // Append the newly created activeUsers container to the parent container
        parentContainer.appendChild(activeUsers);
      }

      // Sort usernames by message count in descending order
      const sortedUsernames = Array.from(usernameMessageCountMap.entries())
        .sort(([, countA], [, countB]) => countB - countA); // Sort in descending order

      // Clear previous user list in the activeUsers container
      activeUsers.innerHTML = ''; // Clear previous user list

      // Append sorted users to the activeUsers container
      sortedUsernames.forEach(([username, count]) => {
        // Create a user element
        const userElement = document.createElement('div');
        userElement.className = 'active-user-item';

        // Create nickname element
        const nicknameElement = document.createElement('span');
        nicknameElement.className = 'active-user-name';
        nicknameElement.textContent = username;

        // Fetch the color for the username from the hue map
        const userHue = usernameHueMap[username] || 0; // Fallback to 0 if hue not found
        nicknameElement.style.color = `hsl(${userHue}, 80%, 50%)`; // Apply the hue color

        // Create message count element
        const messageCountElement = document.createElement('span');
        messageCountElement.className = 'active-user-messages-count';
        messageCountElement.textContent = count;
        messageCountElement.style.color = `hsl(${userHue}, 80%, 50%)`; // Apply the hue color
        messageCountElement.style.backgroundColor = `hsla(${userHue}, 80%, 50%, 0.2)`;

        // Append elements to user element
        userElement.appendChild(messageCountElement);
        userElement.appendChild(nicknameElement);

        // Append user element to activeUsers container
        activeUsers.appendChild(userElement);
      });
    }
  }

  // Load chat logs based on the provided date or default to today's date
  const dateToLoad = personalMessagesDate || today; // Use personalMessagesDate if available
  await loadChatLogs(dateToLoad); // Load chat logs for the determined date
  // Check if personalMessagesDate is given as parameter or null to show the date input field
  if (personalMessagesDate) showDateInput(dateInput); // Show the date input field

  // Set the max attribute to today's date
  dateInput.max = today; // Set the maximum value to today's date
  // Set the min attribute to '2012-02-12'
  dateInput.min = minDate; // Assign the minimum date
  dateInput.value = dateToLoad; // Set the value to the date to load
  createCustomTooltip(dateInputToggle, `Current date: ${dateToLoad}`); // Create a tooltip for the date input toggle

  // Add an event listener for the date input change
  dateInput.addEventListener('change', async (event) => {
    const selectedDate = event.target.value; // Get the selected date
    await loadChatLogs(selectedDate); // Load chat logs for the selected date
    createCustomTooltip(dateInputToggle, `Current date: ${selectedDate}`); // Update the tooltip with the selected date
  });

  // Retrieves details from message items including usernames and message text.
  function getMessageDetails(messageItems) {
    // Cache message details including text, username, and message content
    return messageItems.map(item => {
      const usernameElement = item.querySelector('.message-username');
      const username = usernameElement ? usernameElement.textContent.toLowerCase().trim() : ''; // Get username text, if available
      const messageTextElement = item.querySelector('.message-text');
      const messageText = messageTextElement ? messageTextElement.textContent.toLowerCase().trim() : ''; // Get message text, if available
      return { username, messageText };
    });
  }

  // Filters message items based on the provided query and displays matching messages.
  function filterItems(query) {
    // If the query contains only digits, hyphens, or colons, do nothing
    if (/^[\d-:]+$/.test(query.trim())) return;

    // Helper function to replace underscores and hyphens with spaces and convert to lowercase
    function normalizeText(text) {
      return text.replace(/[_-]/g, ' ').toLowerCase(); // Replaces _ and - with spaces
    }

    // Normalize query by removing underscores and hyphens, then trimming spaces
    const queryWithoutSymbols = normalizeText(query).trim();

    // Retrieve message items within the filterItems function
    const messageItems = Array.from(document.querySelectorAll('.chat-logs-container > .message-item'));

    const messageDetails = getMessageDetails(messageItems); // Get the message details
    const isEmptyQuery = !queryWithoutSymbols;

    // Split query by commas and trim parts
    const queryParts = queryWithoutSymbols.split(',').map(part => part.trim()).filter(Boolean);

    // Count matching usernames
    const matchingUsernamesCount = queryParts.filter(part =>
      messageDetails.some(detail => normalizeText(detail.username) === part)
    ).length;

    // Determine if User Mode is active (2 or more matching usernames)
    const isUserMode = matchingUsernamesCount >= 2;

    // Filter message items based on the query
    messageItems.forEach((item, index) => {
      const messageContainer = item.closest('.message-item'); // Get the closest message item container
      const messageDetailsItem = messageDetails[index];

      let shouldDisplay = false;

      // Normalize underscores and hyphens in the username and message text
      const normalizedUsername = normalizeText(messageDetailsItem.username);
      const normalizedMessageText = normalizeText(messageDetailsItem.messageText);

      if (isEmptyQuery) {
        // Display all messages if the query is empty
        shouldDisplay = true;
      } else if (isUserMode) {
        // User Mode: Match only by username
        shouldDisplay = queryParts.some(part => normalizedUsername === part);
      } else {
        // Simple Mode: Treat the entire query (including commas) as part of the text search
        shouldDisplay = normalizedUsername.includes(queryWithoutSymbols) ||
          normalizedMessageText.includes(queryWithoutSymbols);
      }

      // Toggle visibility based on shouldDisplay using content visibility and font size
      messageContainer.style.contentVisibility = shouldDisplay ? 'visible' : 'hidden';
      // Set font size to 0 for hidden messages to maintain layout or remove the font size property
      messageContainer.style.fontSize = shouldDisplay ? '' : '0';
    });
  }

  // Define the event handler function for chat logs panel
  panelsEvents.handleChatLogsKeydown = (event) => { // Assign the function to the object
    if (event.key === 'Escape') {
      triggerTargetElement(chatLogsPanel, 'hide');
      triggerDimmingElement('hide');
      document.removeEventListener('keydown', panelsEvents.handleChatLogsKeydown); // Remove the event listener
    }
  };

  // Attach the event listener
  document.addEventListener('keydown', panelsEvents.handleChatLogsKeydown);

  // Delegated event listeners for all message actions in chatLogsContainer
  chatLogsPanel.addEventListener('click', async (event) => {
    if (event.target.closest('a')) return;
    const messageItem = event.target.closest('.message-item');
    const timeElement = event.target.closest('.message-time');
    const usernameElement = event.target.closest('.message-username');
    const messageTextElement = event.target.closest('.message-text');
    if (messageItem) {
      if (timeElement) {
        const date = dateInput.value;
        const time = timeElement.textContent;
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          copyChatlogsUrlToClipboard(date, time, timeElement);
          return;
        }
        const url = `https://klavogonki.ru/chatlogs/${date}.html#${time}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (usernameElement) {
        const username = usernameElement.textContent;
        const userId = await getUserId(username);
        if (userId) {
          const url = `https://klavogonki.ru/u/#/${userId}/`;
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          addShakeEffect(usernameElement);
        }
        return;
      }
      if (messageTextElement) {
        await scrollToMiddle(chatLogsContainer, messageItem);
        return;
      }
      // Default: scroll to middle on message item click
      await scrollToMiddle(chatLogsContainer, messageItem);
    }
  });

  // Create custom tooltips for message elements
  createCustomTooltip('.message-time', chatLogsPanel, (el) => `
    [Click] Open chatlog at ${el.textContent}
    [Shift + Click] Copy chatlogs URL to clipboard
  `, true);

  // Create custom tooltips for username elements
  createCustomTooltip('.message-username', chatLogsPanel, (el) => `
    [Click] Open ${el.textContent} profile
  `, true);

  // Create custom tooltips for message text elements
  createCustomTooltip('.message-text', chatLogsPanel, (el) => `
    [Click] Scroll message to the middle of the chat logs
  `, true);

  // Delegated event listeners for active users
  chatLogsPanel.addEventListener('click', (event) => {
    const userElement = event.target.closest('.active-user-item');
    if (userElement) {
      const nicknameElement = userElement.querySelector('.active-user-name');
      const username = nicknameElement?.textContent;
      if (!username) return;
      const currentValue = chatlogsSearchInput.value.trim();
      const usernameEntry = event.ctrlKey ? `, ${username}` : username;
      chatlogsSearchInput.value = (currentValue === username)
        ? ''
        : (event.ctrlKey && !currentValue.includes(username))
          ? currentValue + usernameEntry
          : username;
      filterItems(chatlogsSearchInput.value);
    }
  });

  // Create custom tooltips for active user names in the active users list
  createCustomTooltip('.active-user-name', chatLogsPanel, (el) => `
    [Click] to filter messages by ${el.textContent}
    [Repeat Click] to clear ${el.textContent} from the search input
    [Ctrl + Click] to add additional username to the search input
  `, true);

  // Delegation-based custom tooltip for saved chatlog links
  createCustomTooltip('.saved-chatlog-url', chatLogsPanel, (el) => `
    [Click] Load chat logs for ${el.textContent}
    [Ctrl + Click] Remove this saved chat log
    [Middle Click] Open in new tab
  `, true);

  // Delegation-based custom tooltip for saved chatlog titles
  createCustomTooltip('.saved-chatlog-url-title', chatLogsPanel, (el) => `
    [Click] Edit title for this chat log
  `, true);
}
