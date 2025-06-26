import {
  chevronsUpSVG,
  chevronUpSVG,
  chevronDownSVG,
  chevronsDownSVG
} from "../icons.js";

import { createCustomTooltip } from "../components/tooltip.js";

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

export function createScrollButtons(container) {
  const scrollButtonsContainer = document.createElement('div');
  scrollButtonsContainer.className = 'scroll-buttons-container';

  const fullScrollUpButton = document.createElement('div');
  fullScrollUpButton.innerHTML = chevronsUpSVG;
  createCustomTooltip(fullScrollUpButton, {
    en: 'Scroll Up (Full)',
    ru: 'Прокрутить вверх (всё)'
  });

  const partialScrollUpButton = document.createElement('div');
  partialScrollUpButton.innerHTML = chevronUpSVG;
  createCustomTooltip(partialScrollUpButton, {
    en: 'Scroll Up (Partial)',
    ru: 'Прокрутить вверх (частично)'
  });

  const partialScrollDownButton = document.createElement('div');
  partialScrollDownButton.innerHTML = chevronDownSVG;
  createCustomTooltip(partialScrollDownButton, {
    en: 'Scroll Down (Partial)',
    ru: 'Прокрутить вниз (частично)'
  });

  const fullScrollDownButton = document.createElement('div');
  fullScrollDownButton.innerHTML = chevronsDownSVG;
  createCustomTooltip(fullScrollDownButton, {
    en: 'Scroll Down (Full)',
    ru: 'Прокрутить вниз (всё)'
  });

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

  // Initial setup
  updateScrollButtonOpacity({ container, buttons });
  updateScrollButtonsVisibility({ container, scrollButtonsContainer });

  // Monitor for scrollability changes
  const checkScrollability = () => {
    updateScrollButtonsVisibility({ container, scrollButtonsContainer });
    updateScrollButtonOpacity({ container, buttons });
  };

  // Listen for scroll events
  container.addEventListener('scroll', checkScrollability);

  // Create a ResizeObserver to detect container size changes
  const resizeObserver = new ResizeObserver(checkScrollability);
  resizeObserver.observe(container);

  // Create a MutationObserver to detect content changes
  const mutationObserver = new MutationObserver(checkScrollability);
  mutationObserver.observe(container, {
    childList: true,     // Watch for added/removed children
    subtree: true,       // Watch the entire subtree
    characterData: true, // Watch for text changes
    attributes: true     // Watch for attribute changes that might affect layout
  });

  // Function to clean up all observers
  const cleanup = () => {
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    container.removeEventListener('scroll', checkScrollability);
  };

  return {
    scrollButtonsContainer,
    cleanup  // Return cleanup function to allow proper disposal
  };
}
