// No SVG import needed for simple span
import { getChatElements } from "./chatDomUtils.js";
import { settingsState } from "../panels/settings/settings.js";

// Retrieve tracked user IDs from settings
const trackedUserIds = new Set(settingsState.usersToTrack.map(user => String(user.id)));

/**
 * Adds a visual marker before tracked usernames in chat messages.
 * @param {('all'|'latest')} mode - 'all' to process all messages, 'latest' for only the latest message.
 */
export function addTrackedIconsToUsernames(mode = 'all') {
  const { allMessages, latestMessage } = getChatElements();

  // Helper to add marker to a single message
  function addMarkerToMessage(message) {
    const usernameElement = message.querySelector('.username');
    if (!usernameElement) return;
    // Find the innermost <span data-user="ID"> inside .username
    const userSpan = usernameElement.querySelector('span[data-user]');
    const userId = userSpan ? userSpan.getAttribute('data-user') : null;
    if (!userId || !trackedUserIds.has(String(userId))) return;
    // Prevent duplicate marker
    if (usernameElement.parentElement && usernameElement.parentElement.querySelector('.tracked-marker')) return;

    // Create a simple span marker before the username (no text content)
    const marker = document.createElement('span');
    marker.className = 'tracked-marker';
    // Get computed color from usernameElement and assign as background-color
    const computedColor = window.getComputedStyle(usernameElement).color;
    marker.style.backgroundColor = computedColor;
    usernameElement.parentNode.insertBefore(marker, usernameElement);
  }

  if (mode === 'latest') {
    if (latestMessage) addMarkerToMessage(latestMessage);
  } else {
    allMessages.forEach(addMarkerToMessage);
  }
}