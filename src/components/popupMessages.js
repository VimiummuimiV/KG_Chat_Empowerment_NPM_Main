import { actionSVG, userSVG, clockSVG } from "../icons.js";

// Set the maximum number of popup messages to display globally
const maxPopupMessagesCount = 10;

// Define an object to store the hue for each username
const usernameHueMap = {};
// Increase step for noticeable color changes
const hueStep = 15;

// Define the function to show popup messages when the main chat is hidden by hotkeys Ctrl + Space (only)
export function showPopupMessage() {
  // Check if the key 'shouldShowPopupMessage' exists and has a value of true
  const shouldShowPopupMessage = localStorage.getItem('shouldShowPopupMessage');

  // Stop execution if shouldShowPopupMessage is false
  if (shouldShowPopupMessage !== 'true') {
    return;
  }

  // Get the last message in the chat
  const latestMessage = document.querySelector('.messages-content p:last-of-type');

  if (latestMessage) {
    // Extract elements for time and username from the latest message
    const time = latestMessage.querySelector('.time');
    const username = latestMessage.querySelector('.username');

    const nodes = Array.from(latestMessage.childNodes);
    const elements = nodes.map(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        return { type: 'text', value: node.nodeValue.replace(/ /g, '\u00A0') }; // Replace spaces with Unicode non-breaking space
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === 'a' && node.classList.contains('private')) {
          return { type: 'text', value: '📢\u00A0' };
        }
        if (node.tagName.toLowerCase() === 'span' && node.classList.contains('private')) {
          return { type: 'text', value: node.textContent.replace(/ /g, '\u00A0') };
        }
        if (node.tagName.toLowerCase() === 'img') {
          return { type: 'img', title: node.getAttribute('title') };
        }
        if (node.tagName.toLowerCase() === 'a') {
          return { type: 'anchor', href: node.getAttribute('href') };
        }
      }
    }).filter(Boolean);

    // Extract relevant data from the time and username elements
    const cleanTime = time.textContent.replace(/[\[\]]/g, '');
    const cleanUsername = username.textContent.replace(/[<>]/g, '');

    // Check if the hue for this username is already stored
    let hueForUsername = usernameHueMap[cleanUsername];

    // If the hue is not stored, generate a new random hue with the specified step
    if (!hueForUsername) {
      hueForUsername = Math.floor(Math.random() * (360 / hueStep)) * hueStep;
      // Store the generated hue for this username
      usernameHueMap[cleanUsername] = hueForUsername;
    }

    // Create or get the main container for all messages
    let popupMessagesContainer = document.querySelector('.popup-messages-container');
    if (!popupMessagesContainer) {
      popupMessagesContainer = document.createElement('div');
      popupMessagesContainer.classList.add('popup-messages-container');
      document.body.appendChild(popupMessagesContainer);
    }

    // Check if the total number of messages in the container exceeds the maximum
    if (popupMessagesContainer.childElementCount >= maxPopupMessagesCount) {
      // Get the oldest message
      const oldestMessage = popupMessagesContainer.firstChild;

      // Apply a CSS class to initiate the fade-out animation
      oldestMessage.classList.add('fade-out');

      // After the animation duration, remove the message from the DOM
      setTimeout(() => {
        popupMessagesContainer.removeChild(oldestMessage);
      }, 300); // Adjust the time to match your CSS animation duration
    }

    // Create a container div for each message
    const popupChatMessage = document.createElement('div');
    popupChatMessage.classList.add('popup-chat-message');
    // Apply the hue-rotate filter to the entire message container
    popupChatMessage.style.filter = `hue-rotate(${hueForUsername}deg)`;

    // Append time SVG icon before the time
    const timeIcon = document.createElement('div');
    timeIcon.classList.add('time-icon');
    timeIcon.innerHTML = clockSVG;

    // Append spans for each part with respective classes
    const timeElement = document.createElement('div');
    timeElement.classList.add('time');
    timeElement.textContent = cleanTime;

    // Append user SVG icon after the time
    const userIcon = document.createElement('div');
    userIcon.classList.add('user-icon');
    userIcon.innerHTML = userSVG;

    const usernameElement = document.createElement('div');
    usernameElement.classList.add('username');
    usernameElement.textContent = cleanUsername;

    // Append action SVG icon after the username
    const actionIcon = document.createElement('div');
    actionIcon.classList.add('action-icon');
    actionIcon.innerHTML = actionSVG;

    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    // Append elements to the message container
    popupChatMessage.appendChild(timeIcon);
    popupChatMessage.appendChild(timeElement);
    popupChatMessage.appendChild(userIcon);
    popupChatMessage.appendChild(usernameElement);
    popupChatMessage.appendChild(actionIcon);
    popupChatMessage.appendChild(messageElement);

    // Fill the message container with text, images, and anchors
    elements.forEach(element => {
      const elementContainer = document.createElement('div');

      if (element.type === 'text') {
        elementContainer.textContent = element.value;
      } else if (element.type === 'img') {
        elementContainer.innerHTML = `&nbsp;${element.title}&nbsp;`;
      } else if (element.type === 'anchor') {
        elementContainer.innerHTML = `&nbsp;${element.href}&nbsp;`;
      }

      messageElement.appendChild(elementContainer);
    });

    // Append the message container to the main container
    popupMessagesContainer.appendChild(popupChatMessage);
  }
}