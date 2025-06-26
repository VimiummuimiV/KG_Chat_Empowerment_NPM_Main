import { stopParserIfRunning } from './helpers.js';

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

// Function to gradually fade a target element to show or hide it
export function triggerTargetElement(element, action) {
  if (!element) return; // Return if the element does not exist

  // Adjust the visibility of a specific element, setting opacity to 1 (fully visible)
  adjustVisibility(element, action, 1);

  // Add a double-click event listener to hide the element
  element.addEventListener('dblclick', (event) => {
    const isPanelOpen = document.querySelector('.popup-panel');

    // Condition to allow hiding when double-clicked on:
    // 1. The element itself
    // 2. Direct children (one level down)
    // 3. Children of direct children (two levels down)
    const isElementOrDirectChild =
      event.target === element ||
      event.target.parentElement === element ||
      (event.target.parentElement && event.target.parentElement.parentElement === element);

    // Only proceed if clicked on the element itself or its direct children (up to 2 levels)
    if (!isElementOrDirectChild) return;

    // If no panel is open or the clicked element is not within a scaled thumbnail, hide the dimming element
    if (!isPanelOpen || !event.target.closest('.scaled-thumbnail')) {
      triggerDimmingElement('hide');
    }

    // Hide the target element
    adjustVisibility(element, 'hide', 1);
  });
}

// Function to create and fade the dimming element
export function triggerDimmingElement(action) {
  // Only stop the chatlogs parser if the chatlogs panel is present and being closed
  const chatlogsPanel = document.querySelector('.chat-logs-panel');
  if (action === 'hide' && chatlogsPanel) {
    stopParserIfRunning();
  }

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

