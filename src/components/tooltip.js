import { getCurrentLanguage } from "../helpers/helpers.js";

let tooltipEl = null, tooltipHideTimer = null, tooltipShowTimer = null;
let tooltipIsVisible = false, tooltipIsShown = false, tooltipCurrentTarget = null;

const positionTooltip = (clientX, clientY) => {
  if (!tooltipEl) return;
  let leftPos = clientX + 10;
  const tooltipWidth = tooltipEl.offsetWidth;
  const screenWidth = window.innerWidth;

  // Adjust position if overflowing
  leftPos = Math.min(Math.max(leftPos, 10), screenWidth - tooltipWidth - 10);

  tooltipEl.style.left = `${leftPos}px`;
  tooltipEl.style.top = `${clientY + 18}px`;
};

const tooltipTrackMouse = e => tooltipEl && positionTooltip(e.clientX, e.clientY);

const hideTooltipElement = () => {
  tooltipIsVisible = false;
  tooltipCurrentTarget = null;
  clearTimeout(tooltipShowTimer);
  clearTimeout(tooltipHideTimer);

  tooltipHideTimer = setTimeout(() => {
    if (!tooltipEl) return;
    tooltipEl.style.opacity = '0';
    tooltipIsShown = false;

    setTimeout(() => {
      if (!tooltipIsVisible && tooltipEl) {
        tooltipEl.style.display = 'none';
        tooltipEl.textContent = ''; // Clear tooltip content
        document.removeEventListener('mousemove', tooltipTrackMouse);
      }
    }, 50);
  }, 100);
};

new MutationObserver(() => {
  if (tooltipCurrentTarget && !document.contains(tooltipCurrentTarget)) hideTooltipElement();
}).observe(document, { childList: true, subtree: true });

// Store delegation handlers to avoid duplicates (use WeakMap for auto-cleanup)
const delegationHandlers = new WeakMap();

// Helper to resolve language string from an object or return as-is
function resolveLanguageString(content) {
  if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
    const lang = getCurrentLanguage();
    return content[lang] || content['en'] || Object.values(content)[0];
  }
  return content;
}

function interpolateTooltip(content, target) {
  return content.replace(/\$\{([^}]+)\}/g, (match, key) => { // Match ${key} placeholders
    if (target.hasAttribute && target.hasAttribute(key)) {
      return target.getAttribute(key);
    }
    if (key in target) {
      return target[key];
    }
    if (key === 'text' || key === 'textContent') {
      return target.textContent || '';
    }
    return match;
  });
}

export function createCustomTooltip(element, tooltipContent, delegation = false) {
  if (tooltipContent == null || tooltipContent === '') return; // Skip if content is null/undefined/empty

  // Create tooltip element if it doesn't exist
  tooltipEl ||= (() => {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.classList.add("custom-tooltip-popup");
    tooltipDiv.style.display = 'none';
    tooltipDiv.style.opacity = '0';
    document.body.appendChild(tooltipDiv);
    return tooltipDiv;
  })();

  if (delegation) {
    // Delegation mode: attach event listeners to the parent element
    const selector = element; // In delegation mode, element is a selector string
    const parentElement = tooltipContent; // In delegation mode, tooltipContent is the parent element
    const actualTooltipContent = arguments[2]; // The actual tooltip content (function, string, or object)

    if (!delegationHandlers.has(parentElement)) {
      delegationHandlers.set(parentElement, new Set());
    }
    const selectors = delegationHandlers.get(parentElement);
    if (!selectors.has(selector)) {
      selectors.add(selector);

      const handleMouseEnter = (e) => {
        const target = e.target.closest(selector);
        if (!target) return;

        tooltipIsVisible = true;
        tooltipCurrentTarget = target;
        clearTimeout(tooltipHideTimer);
        clearTimeout(tooltipShowTimer);

        // Always process: function -> resolve language -> interpolate
        let content = actualTooltipContent;
        if (typeof content === 'function') {
          content = content(target);
        }
        content = resolveLanguageString(content);
        if (typeof content === 'string') {
          content = interpolateTooltip(content, target);
        }

        tooltipEl.innerHTML = highlightTooltipActions(content);
        tooltipEl.style.display = 'flex';
        tooltipEl.style.opacity = '0';
        tooltipEl.offsetHeight;
        positionTooltip(e.clientX, e.clientY);
        document.addEventListener('mousemove', tooltipTrackMouse);

        tooltipShowTimer = setTimeout(() => {
          tooltipEl.style.opacity = '1';
          tooltipIsShown = true;
        }, 600);
      };

      const handleMouseLeave = (e) => {
        const target = e.target.closest(selector);
        if (!target) return;
        hideTooltipElement();
        document.removeEventListener('mousemove', tooltipTrackMouse);
      };

      const handleClick = (e) => {
        const target = e.target.closest(selector);
        if (!target) return;
        hideTooltipElement();
      };

      parentElement.addEventListener('mouseenter', handleMouseEnter, true);
      parentElement.addEventListener('mouseleave', handleMouseLeave, true);
      parentElement.addEventListener('click', handleClick, true);
    }
  } else {
    // Standard mode: attach event listeners directly to the element
    // Always process: function -> resolve language -> interpolate
    let content = tooltipContent;
    if (typeof content === 'function') {
      content = content(element);
    }
    content = resolveLanguageString(content);
    if (typeof content === 'string') {
      content = interpolateTooltip(content, element);
    }
    // If content is empty or falsy, do not set up tooltip
    if (!content) {
      element._tooltipContent = '';
      return;
    }
    element._tooltipContent = content;

    if (!element._tooltipInitialized) {
      element._tooltipInitialized = true;

      element.addEventListener('mouseenter', e => {
        // Do not show tooltip if content is empty or falsy
        if (!element._tooltipContent) return;
        tooltipIsVisible = true;
        tooltipCurrentTarget = element;
        clearTimeout(tooltipHideTimer);
        clearTimeout(tooltipShowTimer);

        tooltipEl.innerHTML = highlightTooltipActions(element._tooltipContent);
        tooltipEl.style.display = 'flex';
        tooltipEl.style.opacity = '0';
        tooltipEl.offsetHeight;
        positionTooltip(e.clientX, e.clientY);
        document.addEventListener('mousemove', tooltipTrackMouse);

        tooltipShowTimer = setTimeout(() => {
          tooltipEl.style.opacity = '1';
          tooltipIsShown = true;
        }, 600);
      });

      element.addEventListener('mouseleave', () => {
        hideTooltipElement();
        document.removeEventListener('mousemove', tooltipTrackMouse);
      });
      element.addEventListener('click', hideTooltipElement);
    }
  }
}

// Disable a custom tooltip for an element (clears content, does not remove listeners)
export function disableCustomTooltip(element) {
  if (!element) return;
  element._tooltipContent = '';
}

function highlightTooltipActions(str) {
  if (typeof str !== 'string') return '';
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let result = '';
  let lastEnd = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastEnd) result += str.slice(lastEnd, match.index);
    result += `
    <div class="tooltip-item">
      <span class="tooltip-action">${match[1]}</span>&nbsp;
      <span class="tooltip-message">${match[2].trim()}</span>
    </div>`;
    lastEnd = regex.lastIndex;
  }
  if (lastEnd < str.length) result += str.slice(lastEnd);
  return result;
}
