import {
  decodeURL,
  isEncodedURL,
  isTrustedDomain,
  scrollToBottom
} from "../helpers"; // helpers

const emojis = { image: '🎥', domain: '🖥️', untrusted: '💀️️' };
const allowedVideoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];

const isAllowedVideoExtension = url => {
  const ext = url.match(/\.([^?#.]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() || '';
  return { allowed: allowedVideoExtensions.includes(ext), extension: ext };
};

// Global variable for the shared YouTube player instance.
let sharedYouTubePlayer = null;
// Global variable to track the currently active YouTube preview placeholder.
let activeYouTubePlaceholder = null;

// Returns the shared YouTube iframe, creating it if necessary.
function getSharedYouTubePlayer() {
  if (!sharedYouTubePlayer) {
    sharedYouTubePlayer = document.createElement('iframe');
    sharedYouTubePlayer.classList.add("video-container");
    sharedYouTubePlayer.allowFullscreen = true;
    // Simplified allow attribute to reduce unsupported warnings.
    sharedYouTubePlayer.setAttribute("allow", "fullscreen");
  }
  return sharedYouTubePlayer;
}

// Renders the YouTube preview thumbnail for the given placeholder.
function renderYouTubePreview(placeholder, videoId, videoType, containerType) {
  placeholder.innerHTML = "";
  const thumb = document.createElement('img');
  thumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  thumb.alt = videoType;
  thumb.classList.add("youtube-thumb");
  placeholder.appendChild(thumb);
  // Only call scrollToBottom here with both parameters
  scrollToBottom(containerType, 600);
}

export function convertVideoLinksToPlayer(containerType) {
  // Ensure containerType is explicitly handled
  if (!containerType) {
    console.warn("containerType parameter is required");
    return;
  }

  const selectors = {
    generalMessages: '.messages-content div',
    chatlogsMessages: '.chat-logs-container',
    personalMessages: '.messages-container-wrapper'
  };

  // Make sure containerType exists in our selectors object
  if (!selectors[containerType]) {
    console.warn(`Invalid containerType: ${containerType}`);
    return;
  }

  const container = document.querySelector(selectors[containerType]);
  if (!container) return;

  const links = container.querySelectorAll("a:not(.skipped):not(.processed-video)");
  if (!links.length) return;

  links.forEach(link => {
    const url = link.href;
    if (!url) return;

    const videoInfo = getVideoInfo(url);
    if (!videoInfo) return;

    link.classList.add("media");
    const { isTrusted, domain } = isTrustedDomain(url);

    if (!isTrusted) {
      link.classList.add("skipped");
      link.textContent = `${emojis.image} ${videoInfo.videoType} ${emojis.domain} Hostname (${domain}) ${emojis.untrusted} Untrusted`;
      link.addEventListener("click", e => {
        if (!link.classList.contains("processed-video")) {
          e.preventDefault();
          link.classList.remove("skipped");
          processVideoLink(link, url, domain, videoInfo, containerType);
        }
      });
      return;
    }

    processVideoLink(link, url, domain, videoInfo, containerType);
  });

  function processVideoLink(link, url, domain, videoInfo, containerType) {
    const { youtubeMatch, videoType, videoId } = videoInfo;
    const videoCheck = isAllowedVideoExtension(url);
    if (!youtubeMatch && !videoCheck.allowed) return;

    link.classList.add("processed-video");

    // Create a wrapper element.
    const wrapper = document.createElement('div');
    wrapper.classList.add("video-wrapper");

    // Update link text and title.
    link.textContent = `${emojis.image} ${videoType} ${emojis.domain} Hostname (${domain})`;
    link.title = isEncodedURL(url) ? decodeURL(url) : url;
    link.style.display = 'inline-flex';

    if (youtubeMatch) {
      // Create a placeholder for the YouTube video.
      const placeholder = document.createElement('div');
      placeholder.classList.add("youtube-placeholder");
      // Store video info for later re-rendering.
      placeholder.dataset.videoId = videoId;
      placeholder.dataset.videoType = videoType;
      placeholder.dataset.containerType = containerType; // Store containerType for later use

      // Render the preview thumbnail.
      renderYouTubePreview(placeholder, videoId, videoType, containerType);

      // Add a click listener to load the shared player with autoplay.
      placeholder.addEventListener("click", () => {
        // If another placeholder is active, revert it back to preview.
        if (activeYouTubePlaceholder && activeYouTubePlaceholder !== placeholder) {
          const prevVideoId = activeYouTubePlaceholder.dataset.videoId;
          const prevVideoType = activeYouTubePlaceholder.dataset.videoType;
          const prevContainerType = activeYouTubePlaceholder.dataset.containerType;
          renderYouTubePreview(activeYouTubePlaceholder, prevVideoId, prevVideoType, prevContainerType);
        }
        // Set this placeholder as the active one.
        activeYouTubePlaceholder = placeholder;

        const player = getSharedYouTubePlayer();
        // Add autoplay parameter.
        player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        // Replace the placeholder content with the shared player.
        placeholder.innerHTML = "";
        placeholder.appendChild(player);
      });

      link.parentNode.insertBefore(wrapper, link);
      wrapper.append(link, placeholder);
    } else {
      // For non–YouTube videos, create a new video element.
      const embed = document.createElement('video');
      embed.classList.add("video-container");
      embed.src = url;
      embed.controls = true;

      link.parentNode.insertBefore(wrapper, link);
      wrapper.append(link, embed);
    }
  }

  function getVideoInfo(url) {
    // Check for YouTube URL patterns.
    const youtubeMatch = url.match(/(?:shorts\/|live\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      const videoType = url.includes('shorts/') ? 'Shorts' :
        url.includes('live/') ? 'Live' :
          url.includes('watch?v=') ? 'Watch' :
            url.includes('youtu.be/') ? 'Share' : 'YouTube';
      return { youtubeMatch: true, videoId, videoType };
    }

    // Check if the URL ends with a supported video extension.
    const extension = url.split('.').pop().toLowerCase();
    if (allowedVideoExtensions.includes(extension)) {
      return { youtubeMatch: false, videoType: `Video (${extension.toUpperCase()})` };
    }
    return false;
  }
}