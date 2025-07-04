/**
 * Creates the empowerment panel, restores its position from localStorage, and makes it draggable.
 * @returns {HTMLDivElement} The empowerment panel element.
 */
export function createEmpowermentPanel() {
  const panel = document.createElement('div');
  panel.classList.add('empowerment-panel');
  
  // Define margins once
  const MARGINS = { top: 45, right: 15, bottom: 15, left: 15 };
  
  // Create move handle
  const handle = document.createElement('div');
  handle.classList.add('empowerment-panel-move-handle');
  handle.style.height = '20px';
  handle.title = 'Drag to move panel';
  panel.appendChild(handle);
  
  // Restore position and constrain to viewport
  try {
    const pos = JSON.parse(localStorage.getItem('empowermentPanelPos') || '{}');
    if (pos.x && pos.y) {
      panel.style.left = pos.x + 'px';
      panel.style.top = pos.y + 'px';
    }
  } catch {}
  
  document.body.appendChild(panel);
  
  // Constrain panel within viewport bounds with margins
  const constrainToViewport = () => {
    const rect = panel.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - MARGINS.right;
    const maxTop = window.innerHeight - rect.height - MARGINS.bottom;
    const newLeft = Math.max(MARGINS.left, Math.min(rect.left, maxLeft));
    const newTop = Math.max(MARGINS.top, Math.min(rect.top, maxTop));
    
    if (newLeft !== rect.left || newTop !== rect.top) {
      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
    }
  };
  
  // Constrain to viewport after initial render
  requestAnimationFrame(() => constrainToViewport());
  
  // Add window resize listener to recalculate position
  window.addEventListener('resize', constrainToViewport);
  
  // Drag state
  let isDragging = false;
  let offsetX, offsetY;
  
  handle.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.body.style.userSelect = 'none';
  });
  
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const newLeft = Math.max(MARGINS.left, Math.min(e.clientX - offsetX, window.innerWidth - panel.offsetWidth - MARGINS.right));
    const newTop = Math.max(MARGINS.top, Math.min(e.clientY - offsetY, window.innerHeight - panel.offsetHeight - MARGINS.bottom));
    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = '';
    localStorage.setItem('empowermentPanelPos', JSON.stringify({
      x: parseInt(panel.style.left),
      y: parseInt(panel.style.top)
    }));
  });
  
  return panel;
}