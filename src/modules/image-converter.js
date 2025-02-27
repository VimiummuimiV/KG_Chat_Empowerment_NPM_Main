// helpers
import {
  decodeURL,
  isValidEncodedURL,
  scrollMessagesToBottom,
  isTrustedDomain,
  addBigImageEventListeners,
  removeBigImageEventListeners,
  triggerDimmingElement,
  triggerTargetElement
} from "./helpers";

// definitions
import { state } from "./definitions";

// Define dynamic variables
let {
  bigImageEvents,
} = state;

/*
   * Converts links to images in chat messages by creating a thumbnail and a big image on click.
   * Looks for links that contain ".jpg" or ".jpeg" or ".png" or ".gif" or "webp" extension and creates a thumbnail with the image.
   * If a thumbnail already exists, it skips the link and looks for the next one.
   * When a thumbnail is clicked, it creates a dimming layer and a big image that can be closed by clicking on the dimming layer or the big image itself.
   * Allows navigation through images using the left (<) and right (>) arrow keys.
   */

// Define global variables for the current big image
let bigImage = null;

// Define an array to store all the thumbnail links and their corresponding image URLs
const thumbnailLinks = [];
let currentImageIndex = 0;
const imageChangeDelay = 50; // Prevent double slide by single press adding slight delay
let isChangingImage = false; // Flag to track if an image change is in progress

const imageExtensionEmoji = '📸';
const webDomainEmoji = '🖥️';
const untrustedEoji = '💀️️';

// List of allowed image extensions
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

/**
 * Checks if a given URL has an allowed image extension.
 * @param {string} url - The URL to check.
 * @returns {{allowed: boolean, extension: string}} - If the extension is allowed and its type.
 */
function isAllowedImageExtension(url) {
  // Shared extension extraction logic
  const getExtension = (str) =>
    (str.match(/\.([^?#.]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() || '');

  try {
    const extension = getExtension(url);
    return {
      allowed: allowedImageExtensions.includes(extension),
      extension
    };
  } catch (error) {
    console.error("Error in isAllowedImageExtension:", error.message);
    return {
      allowed: false,
      extension: getExtension(String(url)) // Handle non-string URLs
    };
  }
}

export function convertImageLinksToImage(containerType) {
  const containerSelectors = {
    generalMessages: ".messages-content div",
    chatlogsMessages: ".chat-logs-container",
    personalMessages: ".messages-container-wrapper"
  }

  const container = document.querySelector(containerSelectors[containerType]);
  if (!container) return;

  const links = container.querySelectorAll("a:not(.skipped):not(.processed-image)");
  if (!links.length) return;

  links.forEach(link => {
    if (!link.href || !link.href.startsWith("http")) return;

    const { allowed, extension } = isAllowedImageExtension(link.href);
    if (!allowed) return;

    // Add class media if allowed image extenstion
    link.classList.add("media");

    const { isTrusted, domain } = isTrustedDomain(link.href);
    link.title = isValidEncodedURL(link.href) ? decodeURL(link.href) : link.href;

    // Handle untrusted domains
    if (!isTrusted) {
      link.classList.add("skipped");
      link.textContent = `${imageExtensionEmoji} Image (${extension.toUpperCase()}) ${webDomainEmoji} Hostname (${domain}) ${untrustedEoji} Untrusted`;

      // Directly handle the image loading on link click
      link.addEventListener("click", e => {
        if (!link.classList.contains("processed-image")) {
          e.preventDefault(); // Prevent default behavior only if not processed yet
          link.classList.remove("skipped");
          link.classList.add("processed-image");
          createThumbnail(link, true); // Force thumbnail creation
        }
      })
    } else {
      link.textContent = `${imageExtensionEmoji} Image (${extension.toUpperCase()}) ${webDomainEmoji} Hostname (${domain})`;
      link.classList.add("processed-image");
      // Create thumbnail for trusted links directly
      createThumbnail(link, false);
    }
  })

  function createThumbnail(link, isUntrusted) {
    const thumbnail = document.createElement("div");
    thumbnail.classList.add("clickable-thumbnail");

    const img = document.createElement("img");
    img.src = link.href;

    img.onload = () => {
      thumbnail.appendChild(img);
      link.parentNode.insertBefore(thumbnail, link.nextSibling);
      thumbnailLinks.push({ link, imgSrc: link.href });
      scrollMessagesToBottom(containerType);
    }

    img.onerror = () => {
      console.error("Failed to load image:", link.href);
      link.classList.add("skipped");
    }

    // Only show thumbnail on click for untrusted domains
    if (isUntrusted) {
      // Check if thumbnail already created, avoid creating again
      if (!link.querySelector(".clickable-thumbnail")) {
        link.addEventListener("click", e => {
          // Only create thumbnail once
          if (!link.querySelector(".clickable-thumbnail")) {
            thumbnail.appendChild(img); // Add image to thumbnail on user confirmation
            link.parentNode.insertBefore(thumbnail, link.nextSibling);
          }
        })
      }
    } else {
      // Show the thumbnail directly for trusted domains
      thumbnail.appendChild(img);
      link.parentNode.insertBefore(thumbnail, link.nextSibling);
    }

    thumbnail.addEventListener("click", e => {
      e.stopPropagation();
      bigImage = createBigImage(img.src);
      triggerTargetElement(bigImage, "show");
      triggerDimmingElement("show");
    })
  }
}

// Function to create a big image with a dimming layer
function createBigImage(src) {
  const bigImage = document.createElement('img');
  bigImage.src = src;
  bigImage.classList.add('scaled-thumbnail');
  document.body.appendChild(bigImage);

  const removeBigImage = (bigImage) => {
    // Hide the big image and check if there are any popup panels open before hiding the dimming element
    triggerTargetElement(bigImage, 'hide');

    if (!document.querySelector('.popup-panel')) {
      triggerDimmingElement('hide');
    }
    // Remove all event listeners
    removeBigImageEventListeners();
  }

  // Close when clicking outside the big image
  bigImageEvents.unfocusedClick = function (event) {
    if (!bigImage.contains(event.target)) { // If clicked outside the image
      bigImage.remove(); // Directly remove the image from the DOM
      removeBigImageEventListeners(); // Clean up event listeners
    }
  }

  document.addEventListener('click', bigImageEvents.unfocusedClick);

  // Attach a keydown event listener for big image to close by ESC or Space and navigate with Arrow keys
  bigImageEvents.keydown = function (event) {
    if (event.code === 'Escape' || event.code === 'Space') { // Hide on ESC or Space
      event.preventDefault(); // Prevent default scrolling behavior for Space
      removeBigImage(bigImage);
    } else if (event.code === 'ArrowLeft') {
      navigateImages(-1);
    } else if (event.code === 'ArrowRight') {
      navigateImages(1);
    }
  }

  document.addEventListener('keydown', bigImageEvents.keydown);

  // ZOOM AND MOVE-- START

  // Set the initial zoom scale and scaling factor
  let zoomScale = 1;
  let scalingFactor = 0.1;

  // Set up variables for dragging
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = -50; // Initial translation in percentage
  let translateY = -50; // Initial translation in percentage

  // Define the movement speed
  const movementSpeed = 5;

  // Function to handle zooming
  bigImageEvents.wheel = function (event) {
    // Determine the direction of the mouse wheel movement
    const deltaY = event.deltaY;
    const direction = deltaY < 0 ? 1 : -1;

    // Update the zoom scale based on the direction and scaling factor
    zoomScale += direction * scalingFactor * zoomScale;

    // Clamp the zoom scale to a minimum of 1
    zoomScale = Math.max(zoomScale, 1);

    // Apply the new zoom scale and transform origin
    bigImage.style.transform = `translate(${translateX}%, ${translateY}%) scale(${zoomScale})`;

    // Prevent the default scrolling behavior
    event.preventDefault();
  };

  // Function to update the image position smoothly
  bigImageEvents.mousemove = function (event) {
    if (isDragging) {
      // Calculate the distance moved since the last mousemove event
      const deltaX = (event.clientX - startX) / zoomScale * movementSpeed;
      const deltaY = (event.clientY - startY) / zoomScale * movementSpeed;

      // Update the translate values in percentages
      translateX += (deltaX / bigImage.clientWidth) * 100;
      translateY += (deltaY / bigImage.clientHeight) * 100;

      // Apply the new translate values in percentages
      bigImage.style.transform = `translate(${translateX}%, ${translateY}%) scale(${zoomScale})`;

      // Update the start position
      startX = event.clientX;
      startY = event.clientY;
    }
  };

  bigImageEvents.mousedown = function (event) {
    const { button, clientX, clientY, target, ctrlKey } = event;
    // Restrict LMB and RMB to image clicks only
    if ((button === 0 || button === 2) && target !== bigImage) return;
    let src = target.src; // Get the src from the clicked element

    if (button === 0) { // Left Mouse Button (LMB)
      ctrlKey ? window.open(src, "_blank") : navigateImages(-1);
    } else if (button === 2) { // Right Mouse Button (RMB)
      event.preventDefault();
      if (ctrlKey) {
        // Copy to clipboard and hide the big image
        navigator.clipboard.writeText(src).catch(console.error);
        removeBigImage(bigImage); // Close the big image after copying
      } else {
        navigateImages(1);
      }
    } else if (button === 1) { // Middle Mouse Button (MMB)
      isDragging = true;
      [startX, startY] = [clientX, clientY];
    }
  };

  bigImageEvents.mouseup = function () {
    isDragging = false; // Reset the dragging flag
  };

  // Add contextmenu listener to prevent right-click context menu
  bigImageEvents.contextmenu = function (event) {
    event.preventDefault(); // Prevent context menu from appearing
  };

  // Attach all event listeners
  addBigImageEventListeners();

  return bigImage;
}

// ZOOM AND MOVE-- END


// Function to navigate between images within bounds
function navigateImages(direction) {
  const newIndex = currentImageIndex + direction;

  // Ensure the new index stays within bounds
  if (newIndex >= 0 && newIndex < thumbnailLinks.length) {
    if (isChangingImage) {
      return; // If an image change is already in progress, do nothing
    }

    isChangingImage = true; // Set the flag to indicate image change is in progress

    // Update the bigImage with the new image URL
    if (bigImage) {
      bigImage.src = thumbnailLinks[newIndex].imgSrc;
    }

    // Set a timeout to reset the flag after a short delay
    setTimeout(() => {
      isChangingImage = false;
    }, imageChangeDelay); // Adjust the delay duration as needed (e.g., 50 milliseconds)

    // Update the current index
    currentImageIndex = newIndex;
  }
}
