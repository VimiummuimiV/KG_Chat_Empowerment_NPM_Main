let tooltipInstance = null;
let tooltipHideTimeout = null;
let tooltipShowTimeout = null;
let isTooltipVisible = false;
let isTooltipShown = false;
let currentElement = null;

const tooltipMousemoveHandler = (e) => {
  if (tooltipInstance) {
    tooltipInstance.style.left = `${e.clientX + 0}px`;
    tooltipInstance.style.top = `${e.clientY + 18}px`;
  }
};

// Global hide function
const hideTooltip = () => {
  isTooltipVisible = false;
  currentElement = null;
  clearTimeout(tooltipShowTimeout);
  tooltipShowTimeout = null;

  clearTimeout(tooltipHideTimeout);
  tooltipHideTimeout = setTimeout(() => {
    if (tooltipInstance) {
      tooltipInstance.style.opacity = '0';
      isTooltipShown = false;
      setTimeout(() => {
        if (!isTooltipVisible && tooltipInstance) {
          tooltipInstance.style.display = 'none';
          document.removeEventListener('mousemove', tooltipMousemoveHandler);
        }
      }, 50);
    }
  }, 100);
};

// MutationObserver to check element removal
const observer = new MutationObserver(() => {
  if (currentElement && !document.contains(currentElement)) {
    hideTooltip();
  }
});
observer.observe(document, { childList: true, subtree: true });

export function createCustomTooltip(element, tooltipText) {
  if (element.classList.contains('events-included')) return;
  element.classList.add('events-included');

  tooltipInstance ||= (() => {
    const tooltipElement = document.createElement('div');
    tooltipElement.classList.add("custom-tooltip-popup");
    document.body.appendChild(tooltipElement);
    return tooltipElement;
  })();

  const showTooltip = (e) => {
    isTooltipVisible = true;
    currentElement = element;
    clearTimeout(tooltipShowTimeout);
    clearTimeout(tooltipHideTimeout);
    tooltipInstance.textContent = tooltipText;

    document.addEventListener('mousemove', tooltipMousemoveHandler);
    tooltipMousemoveHandler(e);

    if (!isTooltipShown) {
      tooltipShowTimeout = setTimeout(() => {
        tooltipInstance.style.display = 'flex';
        tooltipInstance.style.opacity = '1';
        isTooltipShown = true;
      }, 600);
    }
  };

  element.addEventListener('mouseenter', showTooltip);
  element.addEventListener('mouseleave', hideTooltip);
}