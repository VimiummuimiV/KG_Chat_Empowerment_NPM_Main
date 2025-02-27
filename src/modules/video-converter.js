// helpers
import {
  decodeURL,
  isValidEncodedURL,
  scrollMessagesToBottom,
  isTrustedDomain
} from "./helpers";

const videoExtensionEmoji = '🎥';
const webDomainEmoji = '🖥️';
const untrustedEoji = '💀️️';

// List of allowed video extensions
const allowedVideoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];

/**
 * Checks if a given URL has an allowed video extension.
 * @param {string} url - The URL to check.
 * @returns {{allowed: boolean, extension: string}} - Indicates if the extension is allowed and returns the extension.
 */
function isAllowedVideoExtension(url) {
  // Shared extension extraction logic
  const getExtension = (str) =>
    (str.match(/\.([^?#.]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() || '');

  try {
    const extension = getExtension(url);
    return {
      allowed: allowedVideoExtensions.includes(extension),
      extension
    };
  } catch (error) {
    console.error("Error in isAllowedVideoExtension:", error.message);
    return {
      allowed: false,
      extension: getExtension(String(url)) // Handle non-string URLs
    };
  }
}

export function convertVideoLinksToPlayer(containerType) {
  // Define container selectors for different message types
  const containerSelectors = {
    generalMessages: '.messages-content div',
    chatlogsMessages: '.chat-logs-container',
    personalMessages: '.messages-container-wrapper'
  };

  // Get the container selector based on the provided type
  const containerSelector = containerSelectors[containerType];
  if (!containerSelector) {
    console.error('Invalid container type specified');
    return;
  }

  // Select the container element
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Find all unprocessed links inside the container
  const links = container.querySelectorAll("a:not(.skipped):not(.processed-video)");
  if (!links.length) return;

  links.forEach(link => {
    const url = link.href;
    if (!url) return;

    // Get video details using our helper function
    const videoInfo = getVideoInfo(url);
    if (!videoInfo) return;

    // Add media class if youtube or video
    link.classList.add("media");

    // Check if the link's href includes a trusted domain
    const { isTrusted, domain } = isTrustedDomain(url);

    // For untrusted domains, add classes and update text before waiting for a click
    if (!isTrusted) {
      link.classList.add("skipped");
      link.textContent = `${videoExtensionEmoji} ${videoInfo.videoType} ${webDomainEmoji} Hostname (${domain}) ${untrustedEoji} Untrusted`;
      link.addEventListener("click", e => {
        if (!link.classList.contains("processed-video")) {
          e.preventDefault();
          link.classList.remove("skipped");
          processVideoLink(link, url, domain, videoInfo);
        }
      });
      return;
    }

    // For trusted links, process immediately
    processVideoLink(link, url, domain, videoInfo);
  });

  function processVideoLink(link, url, domain, videoInfo) {
    const { youtubeMatch, videoType, videoId } = videoInfo;
    // Use the helper function to check for allowed video extensions
    const videoCheck = isAllowedVideoExtension(url);
    if (!youtubeMatch && !videoCheck.allowed) return;

    // Add media and processed-video classes (if not already added)
    link.classList.add("processed-video");

    // Create a wrapper div for better structure
    const wrapper = document.createElement('div');
    wrapper.classList.add("video-wrapper");

    // Create an appropriate embed element (iframe for YouTube, video for allowed formats)
    let embedElement = document.createElement(youtubeMatch ? 'iframe' : 'video');
    embedElement.classList.add("video-container");

    if (youtubeMatch) {
      // Update link text and set YouTube embed
      link.textContent = `${videoExtensionEmoji} ${videoType} ${webDomainEmoji} Hostname (${domain})`;
      embedElement.src = `https://www.youtube.com/embed/${videoId}`;
      embedElement.allowFullscreen = true;
    } else {
      // Update link text for MP4 videos
      link.textContent = `${videoExtensionEmoji} ${videoType} ${webDomainEmoji} Hostname (${domain})`;
      embedElement.src = url;
      embedElement.controls = true;
    }

    // Set link attributes and insert elements
    link.title = isValidEncodedURL(url) ? decodeURL(url) : url;
    link.style.display = 'inline-flex';
    link.parentNode.insertBefore(wrapper, link);
    wrapper.append(link, embedElement);

    // Scroll to the bottom of the container after processing links
    scrollMessagesToBottom(containerType);
  }

  // Helper function to get video information based on the URL
  function getVideoInfo(url) {
    const youtubeMatch = url.match(/(?:shorts\/|live\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);

    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      const videoType = url.includes('shorts/') ? 'Shorts' :
        url.includes('live/') ? 'Live' :
          url.includes('watch?v=') ? 'Watch' :
            url.includes('youtu.be/') ? 'Share' : 'YouTube';
      return { youtubeMatch: true, videoId, videoType };
    }

    // Check if it's an MP4 or other video format
    const extension = url.split('.').pop().toLowerCase();
    if (allowedVideoExtensions.includes(extension)) {
      return { youtubeMatch: false, videoType: `Video (${extension.toUpperCase()})` };
    }

    return false; // Return false if no match
  }
}