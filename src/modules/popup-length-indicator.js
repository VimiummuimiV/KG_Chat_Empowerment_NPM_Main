import { getChatElements } from "./helpers"; // helpers

// Select the input element and length popup container using the helper function
const { chatField, messagesContainer } = getChatElements();

const lengthPopup = document.createElement('div');
lengthPopup.className = 'length-field-popup';
messagesContainer.appendChild(lengthPopup);

// Initialize once at startup
const textMeasurementCanvas = document.createElement('canvas');
const textMeasurementContext = textMeasurementCanvas.getContext('2d');

let isPopupVisible = false;
let previousLength = 0;
let hidePopupTimeout;

// Function to update the color of the length popup
function updateLengthPopupColor(length) {
  if (!lengthPopup) {
    console.error('lengthPopup is not defined');
    return;
  }

  let textColor;

  // Determine color based on the length
  if (length === 0) {
    textColor = 'hsl(200, 20%, 50%)'; // Light Blue
  } else if (length >= 1 && length <= 90) {
    textColor = 'hsl(120, 100%, 40%)'; // Bright Green
  } else if (length > 90 && length <= 100) {
    const factor = (length - 90) / 10;
    const h = Math.round(120 + factor * (60 - 120)); // Interpolating hue
    textColor = `hsl(${h}, 100%, 40%)`;
  } else if (length > 100 && length <= 190) {
    textColor = 'hsl(60, 100%, 50%)'; // Bright Yellow
  } else if (length > 190 && length <= 200) {
    const factor = (length - 190) / 10;
    const h = Math.round(60 + factor * (30 - 60)); // Interpolating hue
    textColor = `hsl(${h}, 100%, 50%)`;
  } else if (length > 200 && length <= 250) {
    textColor = 'hsl(40, 100%, 50%)'; // Orange (Updated)
  } else if (length > 250 && length <= 300) {
    const factor = (length - 250) / 50;
    const h = Math.round(40 + factor * (0 - 40)); // Interpolating hue
    textColor = `hsl(${h}, 100%, 70%)`;
  } else {
    textColor = 'hsl(0, 100%, 70%)'; // Red (Updated)
  }

  // Apply the text color to the length popup
  lengthPopup.style.color = textColor;
}

// Then use them in your measurement function
function updatePopupMetrics(text) {
  // Get current font from input field
  const computedStyle = getComputedStyle(chatField);
  textMeasurementContext.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;

  // Measure text
  const textWidth = textMeasurementContext.measureText(text).width;

  // Calculate position
  const newLeft = chatField.offsetLeft + textWidth + 5;
  const maxLeft = chatField.offsetLeft + chatField.offsetWidth - lengthPopup.offsetWidth;
  lengthPopup.style.left = `${Math.min(newLeft, maxLeft)}px`;
}

// Only update content/position without animation
function updateLengthPopup(length) {
  let displayText;

  displayText = length > previousLength ? `${length} 🡆` :
    length < previousLength ? `🡄 ${length}` :
      `${length}`;

  lengthPopup.textContent = displayText;
  updateLengthPopupColor(length);
  previousLength = length;
}

function togglePopup(show) {
  if (isPopupVisible === show) return;
  lengthPopup.classList.toggle('bounce-in', show);
  lengthPopup.classList.toggle('bounce-out', !show);
  isPopupVisible = show;
  if (!show) setTimeout(() => lengthPopup.classList.remove('bounce-out'), 500);
}

function resetPopup() {
  updateLengthPopup(0);
  Object.assign(lengthPopup.style, { left: '0px', color: 'hsl(200, 20%, 50%)' });
}

// Define your event handler functions (they can be kept local)
function handleInputEvent() {
  clearTimeout(hidePopupTimeout);
  updateLengthPopup(chatField.value.length);
  updatePopupMetrics(chatField.value);
  togglePopup(true);
  hidePopupTimeout = setTimeout(() => togglePopup(false), 1000);
}

function handleKeydownEvent(e) {
  if (e.key !== 'Enter') return;
  resetPopup();
  togglePopup(true);
  hidePopupTimeout = setTimeout(() => togglePopup(false), 1000);
}

// Export an initialization function that sets up the events
export function initChatEvents() {
  chatField.addEventListener('input', handleInputEvent);
  chatField.addEventListener('keydown', handleKeydownEvent);
}
