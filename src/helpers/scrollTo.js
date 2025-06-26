import { addShakeEffect } from "../animations.js";

// Scrolls the specified container to the bottom if the user has scrolled close enough
export function scrollToBottom(containerType = 'generalMessages', customScrollThreshold = 600) {
  const containerSelectors = {
    generalMessages: '.messages-content',
    chatlogsMessages: '.chat-logs-container',
    personalMessages: '.messages-container-wrapper'
  };

  const containerSelector = containerSelectors[containerType];
  if (!containerSelector) return;

  const container = document.querySelector(containerSelector);
  if (!container) return;

  if (typeof scrollToBottom.firstTime === 'undefined') scrollToBottom.firstTime = true;

  if (scrollToBottom.firstTime) {
    container.scrollTop = container.scrollHeight;
    scrollToBottom.firstTime = false;
  } else {
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom <= customScrollThreshold) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

// Function to scroll messages to the middle of the parent container
export async function scrollToMiddle(parent, element) {
  const { top, height } = element.getBoundingClientRect();
  const { top: parentTop, height: parentHeight } = parent.getBoundingClientRect();
  const parentMiddle = parentTop + parentHeight / 2;
  const scrollOffset = top - parentMiddle + height / 2;
  parent.scrollBy({
    top: scrollOffset,
    behavior: 'smooth'
  });
  await new Promise(resolve => setTimeout(resolve, 500));
  parent.style.scrollBehavior = 'auto';
  addShakeEffect(element);
}