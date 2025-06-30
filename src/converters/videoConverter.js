import { isTrustedDomain } from "../helpers/helpers.js";
import { decodeURL, isEncodedURL } from "../helpers/urlUtils.js";
import { createCustomTooltip } from "../components/tooltip.js";
import { scrollToBottom } from "../helpers/scrollTo.js";

// Emoji icons for visual representation of video metadata
const emojis = {
  channel: '📺',
  title: '📹',
  type: '🎬️',
  domain: '🖥️',
  untrusted: '💀️️'
};

// List of supported video file extensions
const allowedVideoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];

// Check if a URL has an allowed video file extension
const isAllowedVideoExtension = url => {
  // Extract file extension using regex, defaulting to empty string if no match
  const ext = url.match(/\.([^?#.]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() || '';
  return {
    allowed: allowedVideoExtensions.includes(ext),
    extension: ext
  };
};

// Global variables for managing YouTube player state
let sharedYouTubePlayer = null; // Shared YouTube player instance
let activeYouTubePlaceholder = null; // Currently active YouTube preview placeholder

// Create or retrieve the shared YouTube player iframe
function getSharedYouTubePlayer() {
  if (!sharedYouTubePlayer) {
    // Create new iframe element for YouTube videos
    sharedYouTubePlayer = document.createElement('iframe');
    sharedYouTubePlayer.classList.add("video-container");
    sharedYouTubePlayer.allowFullscreen = true;
    // Set allow attribute to reduce browser warnings
    sharedYouTubePlayer.setAttribute("allow", "fullscreen");
  }
  return sharedYouTubePlayer;
}

// Fetch metadata for a YouTube video using oEmbed API
async function fetchYouTubeMetadata(videoId) {
  // Construct oEmbed URL for fetching video metadata
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    // Fetch metadata from YouTube
    const response = await fetch(oembedUrl);
    const data = await response.json();

    // Extract title and channel, provide defaults if not found
    const title = data.title || 'Title not found';
    const channel = data.author_name || 'Channel not found';

    return { title, channel };
  } catch (error) {
    // Log and handle metadata fetching errors
    console.error('Error fetching YouTube metadata:', error);
    return { title: 'Error', channel: 'Error' };
  }
}

// Render a preview for a YouTube video
async function renderYouTubePreview(infoContainer, placeholder, videoId, videoType, containerType) {
  // Clear existing content
  infoContainer.innerHTML = "";
  placeholder.innerHTML = "";

  // Fetch video metadata
  const metadata = await fetchYouTubeMetadata(videoId);

  // Create channel name element
  const channel = document.createElement('span');
  channel.classList.add("channel-name");
  channel.textContent = `${emojis.channel} ${metadata.channel}`;

  // Create video title element
  const title = document.createElement('span');
  title.classList.add("video-title");
  title.textContent = `${emojis.title} ${metadata.title}`;

  // Append channel and title to info container
  infoContainer.append(channel, title);

  // Create and add thumbnail image
  const thumb = document.createElement('img');
  thumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  thumb.alt = videoType;
  thumb.classList.add("youtube-thumb");
  placeholder.appendChild(thumb);

  // Wait for the thumbnail to load before scrolling
  thumb.addEventListener('load', () => {
    scrollToBottom(containerType, 600);
  });
}

// Extract video information from a URL
function getVideoInfo(url) {
  // Check for YouTube URL patterns
  const youtubeMatch = url.match(/(?:shorts\/|live\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);

  if (youtubeMatch) {
    // Extract video ID and determine video type
    const videoId = youtubeMatch[1];
    const videoType = url.includes('shorts/') ? 'Shorts' :
      url.includes('live/') ? 'Live' :
        url.includes('watch?v=') ? 'Watch' :
          url.includes('youtu.be/') ? 'Share' : 'YouTube';

    return { youtubeMatch: true, videoId, videoType };
  }

  // Check for supported video file extensions
  const extension = url.split('.').pop().toLowerCase();
  if (allowedVideoExtensions.includes(extension)) {
    return { youtubeMatch: false, videoType: `Video (${extension.toUpperCase()})` };
  }

  // Return false if no matching video type found
  return false;
}

// Main function to convert video links to players
export function convertVideoLinksToPlayer(containerType) {
  // Validate containerType parameter
  if (!containerType) {
    console.warn("containerType parameter is required");
    return;
  }

  // Supported container selectors
  const selectors = {
    generalMessages: '.messages-content div',
    chatlogsMessages: '.chat-logs-container',
    personalMessages: '.messages-container'
  };

  // Validate selector for given containerType
  if (!selectors[containerType]) {
    console.warn(`Invalid containerType: ${containerType}`);
    return;
  }

  // Find the container element
  const container = document.querySelector(selectors[containerType]);
  if (!container) return;

  // Find unprocessed links in the container
  const links = container.querySelectorAll("a:not(.skipped):not(.processed-video)");
  if (!links.length) return;

  // Process each link
  links.forEach(link => {
    const url = link.href;
    if (!url) return;

    // Determine video information
    const videoInfo = getVideoInfo(url);
    if (!videoInfo) return;

    link.classList.add("media");
    const { isTrusted, domain } = isTrustedDomain(url);

    // Handle untrusted domains
    if (!isTrusted) {
      link.classList.add("skipped");
      link.textContent = `${emojis.type} ${videoInfo.videoType} ${emojis.domain} ${domain} ${emojis.untrusted} Untrusted`;

      // Add click event to process untrusted links
      link.addEventListener("click", e => {
        if (!link.classList.contains("processed-video")) {
          e.preventDefault();
          link.classList.remove("skipped");
          processVideoLink(link, url, domain, videoInfo, containerType);
        }
      });
      return;
    }

    // Process trusted video links
    processVideoLink(link, url, domain, videoInfo, containerType);
  });

  // Process an individual video link
  function processVideoLink(link, url, domain, videoInfo, containerType) {
    const { youtubeMatch, videoType, videoId } = videoInfo;
    const videoCheck = isAllowedVideoExtension(url);

    // Skip if not a valid video type
    if (!youtubeMatch && !videoCheck.allowed) return;

    link.classList.add("processed-video");

    // Create a wrapper for the video
    const wrapper = document.createElement('div');
    wrapper.classList.add("video-wrapper");

    // Update link text and styling
    link.textContent = `${emojis.type} ${videoType} ${emojis.domain} ${domain}`;
    createCustomTooltip(link, isEncodedURL(url) ? decodeURL(url) : url);
    link.style.display = 'inline-flex';

    // Handle YouTube videos
    if (youtubeMatch) {
      // Create info container first
      const infoContainer = document.createElement('div');
      infoContainer.classList.add("youtube-info");

      // Create placeholder
      const placeholder = document.createElement('div');
      placeholder.classList.add("youtube-placeholder");

      // Store video metadata for later use
      placeholder.dataset.videoId = videoId;
      placeholder.dataset.videoType = videoType;
      placeholder.dataset.containerType = containerType;

      // Insert wrapper and elements
      link.parentNode.insertBefore(wrapper, link);
      wrapper.append(link, infoContainer, placeholder);

      // Render video preview
      renderYouTubePreview(infoContainer, placeholder, videoId, videoType, containerType);

      // Add click event to load video player
      placeholder.addEventListener("click", () => {
        // Reset previous active placeholder
        if (activeYouTubePlaceholder && activeYouTubePlaceholder !== placeholder) {
          const prevVideoId = activeYouTubePlaceholder.dataset.videoId;
          const prevVideoType = activeYouTubePlaceholder.dataset.videoType;
          const prevContainerType = activeYouTubePlaceholder.dataset.containerType;

          // Find the info container for the previous placeholder (assumed to be previous sibling)
          const prevInfoContainer = activeYouTubePlaceholder.previousElementSibling;
          if (prevInfoContainer && prevInfoContainer.classList.contains("youtube-info")) {
            renderYouTubePreview(
              prevInfoContainer,
              activeYouTubePlaceholder,
              prevVideoId,
              prevVideoType,
              prevContainerType
            );
          }
        }

        // Set current placeholder as active
        activeYouTubePlaceholder = placeholder;

        // Create and load YouTube player
        const player = getSharedYouTubePlayer();
        player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        placeholder.innerHTML = "";
        placeholder.appendChild(player);
      });
    } else {
      // Handle non-YouTube video files
      const embed = document.createElement('video');
      embed.classList.add("video-container");
      embed.src = url;
      embed.controls = true;

      // Insert wrapper and video element
      link.parentNode.insertBefore(wrapper, link);
      wrapper.append(link, embed);
    }
  }

}