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
  if (tooltipContent == null) return; // Skip if content is null/undefined

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
    const selector = element; // In delegation mode, element is actually a selector string
    const parentElement = tooltipContent; // In delegation mode, tooltipContent is actually the parent element
    const actualTooltipContent = arguments[2]; // The actual tooltip content is the third argument

    // Use WeakMap for parentElement -> Set of selectors
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

        // Get tooltip content - could be static or dynamic based on target
        let content = actualTooltipContent;

        // If content is a function, call it with the target element
        if (typeof content === 'function') {
          content = content(target);
        }

        // Always interpolate ${...} placeholders
        if (typeof content === 'string') {
          content = interpolateTooltip(content, target);
        }

        // Highlight [Action]Message pairs in the tooltip content
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
    // Always update the tooltip content stored on the element.
    element._tooltipContent = tooltipContent;

    if (!element._tooltipInitialized) {
      element._tooltipInitialized = true;

      element.addEventListener('mouseenter', e => {
        tooltipIsVisible = true;
        tooltipCurrentTarget = element;
        clearTimeout(tooltipHideTimer);
        clearTimeout(tooltipShowTimer);

        // Highlight [Action]Message pairs in the tooltip content
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

function highlightTooltipActions(str) {
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
