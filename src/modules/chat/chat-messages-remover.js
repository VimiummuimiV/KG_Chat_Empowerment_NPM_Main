export default class ChatMessagesRemover {
  constructor() {
    this.selected = new Set();
    this.isDragging = false;
    this.toggleBtn = null;
    this.init();
  }

  init() {
    this.attachEvents();
    this.updateDeletedMessages();
    this.renderToggle();
  }

  attachEvents() {
    document.addEventListener('mousedown', e => {
      // if (e.button === 2 && e.target.closest('.messages-content p')) {
      if (e.button === 2 && e.target.closest('.messages-content p')) {
        this.isDragging = true;
        this.toggleSelect(e.target.closest('p'), true);
      }
    });

    document.addEventListener('mouseup', () => this.isDragging = false);

    document.addEventListener('mousemove', e => {
      if (this.isDragging && e.target.closest('.messages-content p')) {
        this.toggleSelect(e.target.closest('p'), true);
      }
    });

    document.addEventListener('contextmenu', e => {
      const msg = e.target.closest('.messages-content p');
      if (msg) {
        e.preventDefault();
        this.showDeleteButton(e, msg);
      }
    });
  }

  toggleSelect(el, state) {
    el.classList.toggle('selected-message', state);
    const id = getMessageId(el);
    state ? this.selected.add(id) : this.selected.delete(id);
  }

  showDeleteButton(e) {
    const existingBtn = document.querySelector('.delete-btn');
    if (existingBtn) existingBtn.remove();

    const btn = document.createElement('button');
    btn.className = 'delete-btn';
    btn.textContent = 'Delete';

    // Temporarily append to get dimensions and then remove
    document.body.append(btn);
    const { offsetWidth: w, offsetHeight: h } = btn;
    btn.remove();

    // Set button position centered around cursor
    Object.assign(btn.style, {
      position: 'fixed',
      top: `${e.clientY - h / 2}px`,
      left: `${e.clientX - w / 2}px`
    });

    btn.onclick = () => {
      document.querySelectorAll('.selected-message').forEach(msg => {
        msg.classList.remove('selected-message');
        if (msg.classList.length === 0) msg.removeAttribute('class');
      });
      this.storeDeleted([...this.selected]);
      btn.remove();
      this.selected.clear();
      this.updateDeletedMessages();
      this.renderToggle();
    };

    // Set up removal after 1 second if not hovered
    let timeoutId;
    btn.addEventListener('mouseenter', () => {
      if (timeoutId) clearTimeout(timeoutId); // Clear previous timeouts
    });

    btn.addEventListener('mouseleave', () => {
      timeoutId = setTimeout(() => {
        btn.remove();
        this.clearSelection();
      }, 1000); // 1000 ms timeout to remove if not hovered
    });

    document.body.append(btn);
  }

  clearSelection() {
    document.querySelectorAll('.selected-message').forEach(msg => {
      msg.classList.remove('selected-message');
      if (msg.classList.length === 0) {
        msg.removeAttribute('class');
      }
    });
    this.selected.clear();
  }

  storeDeleted(ids) {
    const stored = new Set(JSON.parse(localStorage.deletedChatMessagesContent || '[]'));
    ids.forEach(id => stored.add(id));
    localStorage.deletedChatMessagesContent = JSON.stringify([...stored]);
  }

  updateDeletedMessages() {
    const stored = new Set(JSON.parse(localStorage.deletedChatMessagesContent || '[]'));
    // Iterate over all message paragraphs
    document.querySelectorAll('.messages-content p').forEach(msg => {
      const id = getMessageId(msg);
      // Always remove 'shown-message' class from all messages
      msg.classList.remove('shown-message');
      // Add 'hidden-message' class if the message is deleted
      msg.classList.toggle('hidden-message', stored.has(id));
    });
    // Save the updated deleted messages state
    localStorage.deletedChatMessagesContent = JSON.stringify([...stored]);
  }

  renderToggle() {
    const hasDeleted = JSON.parse(localStorage.deletedChatMessagesContent || '[]').length > 0;

    // If no deleted messages, remove toggle button if it exists
    if (!hasDeleted) {
      if (this.toggleBtn) {
        this.toggleBtn.remove();
        this.toggleBtn = null;
      }
      return;
    }

    // If there are deleted messages and toggle button does not exist, create it
    if (!this.toggleBtn) {
      this.toggleBtn = document.createElement('button');
      this.toggleBtn.className = 'toggle-button toggle-hidden';  // Initial class set to 'toggle-hidden'
      this.toggleBtn.textContent = 'Show';  // Initial text content

      this.toggleBtn.onclick = (e) => {
        if (e.ctrlKey) {
          // Restore all messages by removing hidden and shown classes
          document.querySelectorAll('.messages-content p').forEach(msg => {
            msg.classList.remove('hidden-message', 'shown-message');
          });

          // Update localStorage with an empty array instead of removing it
          localStorage.setItem('deletedChatMessagesContent', JSON.stringify([]));

          // Clear selection and update the UI
          this.selected.clear();
          this.updateDeletedMessages();
          this.renderToggle();  // Re-render the toggle button with updated state
          return;
        }

        // Normal Show/Hide functionality
        const shouldShow = this.toggleBtn.textContent === 'Show';
        const storedIds = JSON.parse(localStorage.deletedChatMessagesContent || '[]');

        document.querySelectorAll('.messages-content p').forEach(msg => {
          const id = getMessageId(msg);
          if (storedIds.includes(id)) {
            msg.classList.toggle('hidden-message', !shouldShow);
            msg.classList.toggle('shown-message', shouldShow);
          }
        });

        // Toggle button text and class based on the current state
        if (shouldShow) {
          this.toggleBtn.textContent = 'Hide';
          this.toggleBtn.classList.remove('toggle-hidden');
          this.toggleBtn.classList.add('toggle-shown');
        } else {
          this.toggleBtn.textContent = 'Show';
          this.toggleBtn.classList.remove('toggle-shown');
          this.toggleBtn.classList.add('toggle-hidden');
        }
      };

      document.querySelector('.messages-content').append(this.toggleBtn);
    }
  }
}

// This function extracts the unique message ID from a message element
function getMessageId(el) {
  return Array.from(el.childNodes).map(n => {
    if (n.nodeType === Node.TEXT_NODE) return n.textContent.trim();
    if (n.classList?.contains('username')) return `${n.textContent.trim()}`;
    if (n.tagName === 'A') return n.href;
    if (n.tagName === 'IMG') return n.title.trim();
    if (n.tagName === 'IFRAME') return n.src.trim();
    return '';
  }).join('');
}

// This function is separated out for reuse in other logic
export function pruneDeletedMessages() {
  // Collect the IDs of all messages currently in the DOM
  const currentIds = new Set(
    [...document.querySelectorAll('.messages-content p')].map(msg => getMessageId(msg))
  );
  // Retrieve the stored deleted IDs from localStorage
  const stored = new Set(JSON.parse(localStorage.deletedChatMessagesContent || '[]'));
  // Filter stored IDs to keep only those that exist in the DOM
  const updatedStored = [...stored].filter(id => currentIds.has(id));
  // Update localStorage with the filtered list
  localStorage.deletedChatMessagesContent = JSON.stringify(updatedStored);
}
