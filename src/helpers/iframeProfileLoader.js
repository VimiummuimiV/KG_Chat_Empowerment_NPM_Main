import { adjustVisibility } from '../helpers/elementVisibility.js';

/**
 * Creates and manages an iframe modal for profile content.
 * @param {string} url - The profile URL to load in the iframe.
 */
export const loadProfileIntoIframe = (url) => {
  // Check if iframe already exists
  let profileIframe = document.querySelector('.profile-iframe-container');
  if (profileIframe) {
    profileIframe.src = url;
    return;
  }
  // Create iframe element and configure basic attributes
  profileIframe = document.createElement('iframe');
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
      if (window.lastFocusedIframeTextarea) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      removeIframe();
    }
    // Close iframe when clicking outside, but ignore clicks on .profile, .name, .login or their descendants
    if (event.type === 'mousedown' && !profileIframe.contains(event.target)) {
      let el = event.target;
      while (el && el !== document.body) {
        if (el.classList && (el.classList.contains('profile') || el.classList.contains('name') || el.classList.contains('login'))) {
          return; // Do not close if clicked on these elements or their descendants
        }
        el = el.parentElement;
      }
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

      // Track focused text areas within iframe
      iframeDoc.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'TEXTAREA') {
          window.lastFocusedIframeTextarea = e.target;
        }
      });

      // Clear textarea focus tracking when leaving input
      iframeDoc.addEventListener('focusout', () => {
        setTimeout(() => {
          if (!iframeDoc.activeElement || iframeDoc.activeElement.tagName !== 'TEXTAREA') {
            window.lastFocusedIframeTextarea = null;
          }
        }, 0);
      });

      // Attach internal iframe closure triggers
      iframeWindow.addEventListener('keydown', handleEvents);
      iframeWindow.addEventListener('dblclick', removeIframe);

      // Monitor DOM changes for automatic closure conditions
      new MutationObserver((mutations, observer) => {
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
