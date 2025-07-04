import { moveSVG } from "../icons.js";
import { createCustomTooltip } from "../components/tooltip.js";
import { getCurrentLanguage } from "../helpers/helpers.js";

/**
 * Creates the empowerment panel, restores its position from localStorage, and makes it draggable.
 * @returns {HTMLDivElement} The empowerment panel element.
 */
export function createEmpowermentPanel() {
  const panel = document.createElement('div');
  panel.classList.add('empowerment-panel');
  
  // Define margins once
  const MARGINS = { top: 45, right: 15, bottom: 15, left: 15 };
  
  // Store the desired position and scale (what user actually set)
  let desiredPosition = { x: null, y: null };
  let desiredScale = 1;
  
  // Create move handle
  const handle = document.createElement('div');
  handle.classList.add('empowerment-panel-move-handle');
  handle.innerHTML = moveSVG;
  panel.appendChild(handle);

  // Add tooltip to the move handle
  const lang = getCurrentLanguage && typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'en';
  const tooltipText = lang === 'ru'
    ? '[Удерживайте] и перетаскивайте панель. [S] — масштаб, [R] — сброс.'
    : '[Hold] and drag to move panel. [S] — scale, [R] — reset.';
  createCustomTooltip(handle, tooltipText);
  
  // Restore position and scale from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('empowermentPanelState') || '{}');
    if (saved.x !== undefined && saved.y !== undefined) {
      desiredPosition.x = saved.x;
      desiredPosition.y = saved.y;
      panel.style.left = saved.x + 'px';
      panel.style.top = saved.y + 'px';
    }
    if (saved.scale !== undefined) {
      desiredScale = saved.scale;
      panel.style.transform = `scale(${saved.scale})`;
      panel.style.transformOrigin = '0 0';
    }
  } catch {}
  
  document.body.appendChild(panel);
  
  // Constrain panel within viewport bounds with margins
  const constrainToViewport = () => {
    const rect = panel.getBoundingClientRect();
    
    // Use desired position if available, otherwise use current position
    const targetX = desiredPosition.x !== null ? desiredPosition.x : rect.left;
    const targetY = desiredPosition.y !== null ? desiredPosition.y : rect.top;
    
    const maxLeft = window.innerWidth - rect.width - MARGINS.right;
    const maxTop = window.innerHeight - rect.height - MARGINS.bottom;
    const newLeft = Math.max(MARGINS.left, Math.min(targetX, maxLeft));
    const newTop = Math.max(MARGINS.top, Math.min(targetY, maxTop));
    
    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
  };
  
  // Save current state to localStorage
  const saveState = () => {
    localStorage.setItem('empowermentPanelState', JSON.stringify({
      x: desiredPosition.x,
      y: desiredPosition.y,
      scale: desiredScale
    }));
  };
  
  // Reset position and scale
  const resetPanel = () => {
    desiredPosition.x = null;
    desiredPosition.y = null;
    desiredScale = 1;
    panel.style.left = '';
    panel.style.top = '';
    panel.style.transform = '';
    panel.style.transformOrigin = '';
    localStorage.removeItem('empowermentPanelState');
    requestAnimationFrame(() => constrainToViewport());
  };
  
  // Constrain to viewport after initial render
  requestAnimationFrame(() => constrainToViewport());
  
  // Add window resize listener to recalculate position
  window.addEventListener('resize', constrainToViewport);
  
  // Drag state
  let isMouseDown = false;
  let isDragging = false;
  let isScaling = false;
  let offsetX, offsetY;
  let initialScale, initialMouseY;
  let keyPressed = new Set();
  
  // Track key states
  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keyPressed.add(key);
    
    // Handle mode switching during active mouse operation
    if (isMouseDown && !isDragging && !isScaling) {
      const rect = panel.getBoundingClientRect();
      const handleRect = handle.getBoundingClientRect();
      
      if (key === 's') {
        // Switch to scaling mode
        isScaling = true;
        initialScale = desiredScale;
        initialMouseY = window.lastMouseY || 0;
        panel.style.transformOrigin = `${handleRect.left + handleRect.width/2 - rect.left}px ${handleRect.top + handleRect.height/2 - rect.top}px`;
      } else if (key === 'r') {
        // Immediate reset
        resetPanel();
      }
    } else if (isMouseDown && isDragging && key === 's') {
      // Switch from dragging to scaling
      isDragging = false;
      isScaling = true;
      initialScale = desiredScale;
      initialMouseY = window.lastMouseY || 0;
      const rect = panel.getBoundingClientRect();
      const handleRect = handle.getBoundingClientRect();
      panel.style.transformOrigin = `${handleRect.left + handleRect.width/2 - rect.left}px ${handleRect.top + handleRect.height/2 - rect.top}px`;
    } else if (isMouseDown && isScaling && key === 'r') {
      // Reset during scaling
      resetPanel();
    } else if (isMouseDown && key === 'r') {
      // Reset during any operation
      resetPanel();
    }
  });
  
  document.addEventListener('keyup', e => {
    keyPressed.delete(e.key.toLowerCase());
  });
  
  // Track mouse position globally
  document.addEventListener('mousemove', e => {
    window.lastMouseY = e.clientY;
  });
  
  handle.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    
    isMouseDown = true;
    const rect = panel.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    
    // Check initial state based on keys pressed
    if (keyPressed.has('s')) {
      isScaling = true;
      initialScale = desiredScale;
      initialMouseY = e.clientY;
      panel.style.transformOrigin = `${handleRect.left + handleRect.width/2 - rect.left}px ${handleRect.top + handleRect.height/2 - rect.top}px`;
    } else if (keyPressed.has('r')) {
      // Immediate reset
      resetPanel();
      isMouseDown = false;
      return;
    } else {
      isDragging = true;
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    }
    
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', e => {
    if (isDragging) {
      const newLeft = Math.max(MARGINS.left, Math.min(e.clientX - offsetX, window.innerWidth - panel.offsetWidth - MARGINS.right));
      const newTop = Math.max(MARGINS.top, Math.min(e.clientY - offsetY, window.innerHeight - panel.offsetHeight - MARGINS.bottom));
      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
      
      // Update desired position during drag
      desiredPosition.x = newLeft;
      desiredPosition.y = newTop;
    } else if (isScaling) {
      // Scale based on vertical mouse movement with higher sensitivity
      const deltaY = initialMouseY - e.clientY; // Inverted: up = positive
      const scaleFactor = Math.max(0.1, Math.min(3, initialScale + (deltaY * 0.01)));
      desiredScale = scaleFactor;
      panel.style.transform = `scale(${scaleFactor})`;
    }
  });
  
  document.addEventListener('mouseup', e => {
    if (isMouseDown) {
      // Save the current state (unless it was just reset)
      if (!keyPressed.has('r') && (isDragging || isScaling)) {
        saveState();
      }
      
      isMouseDown = false;
      isDragging = false;
      isScaling = false;
      document.body.style.userSelect = '';
    }
  });
  
  return panel;
}