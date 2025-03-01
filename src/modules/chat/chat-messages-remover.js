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
      // Check if the target is within a message paragraph
      const msgEl = e.target.closest('.messages-content p');
      if (e.button === 2 && msgEl) {
        // Check if the clicked element (or its ancestor) is a username element
        const usernameEl = e.target.closest('.username');
        if (usernameEl) {
          // Get the username text (trimmed)
          const usernameText = usernameEl.textContent.trim();
          // Select all messages with the same username and add the additional class
          document.querySelectorAll('.messages-content p').forEach(msg => {
            const msgUsernameEl = msg.querySelector('.username');
            if (msgUsernameEl && msgUsernameEl.textContent.trim() === usernameText) {
              this.toggleSelect(msg, true);
              // Add an additional classname to indicate username selection
              msg.classList.add('username-mode');
            }
          });
        } else {
          // Normal behavior: select the single message (with dragging support)
          this.isDragging = true;
          this.toggleSelect(msgEl, true);
        }
      }
    });

    document.addEventListener('mouseup', () => this.isDragging = false);

    document.addEventListener('mousemove', e => {
      const msgEl = e.target.closest('.messages-content p');
      if (this.isDragging && msgEl) {
        this.toggleSelect(msgEl, true);
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

  // Update toggleSelect so that when deselecting (state is false),
  // it also removes the "username-mode" class.
  toggleSelect(el, state) {
    el.classList.toggle('selected-message', state);
    if (!state) {
      el.classList.remove('username-mode');
    }
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
      // Remove both the selection and the username-mode class when deleting
      document.querySelectorAll('.selected-message').forEach(msg => {
        msg.classList.remove('selected-message');
        msg.classList.remove('username-mode');
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
      if (timeoutId) clearTimeout(timeoutId);
    });

    btn.addEventListener('mouseleave', () => {
      timeoutId = setTimeout(() => {
        btn.remove();
        this.clearSelection();
      }, 1000);
    });

    document.body.append(btn);
  }

  // Clear selection by removing both the "selected-message" and "username-mode" classes.
  clearSelection() {
    document.querySelectorAll('.selected-message').forEach(msg => {
      msg.classList.remove('selected-message');
      msg.classList.remove('username-mode');
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
    document.querySelectorAll('.messages-content p').forEach(msg => {
      const id = getMessageId(msg);
      msg.classList.remove('shown-message');
      msg.classList.toggle('hidden-message', stored.has(id));
    });
    localStorage.deletedChatMessagesContent = JSON.stringify([...stored]);
  }

  renderToggle() {
    const hasDeleted = JSON.parse(localStorage.deletedChatMessagesContent || '[]').length > 0;

    if (!hasDeleted) {
      if (this.toggleBtn) {
        this.toggleBtn.remove();
        this.toggleBtn = null;
      }
      return;
    }

    if (!this.toggleBtn) {
      this.toggleBtn = document.createElement('button');
      this.toggleBtn.className = 'toggle-button toggle-hidden';
      this.toggleBtn.textContent = 'Show';

      this.toggleBtn.onclick = (e) => {
        if (e.ctrlKey) {
          document.querySelectorAll('.messages-content p').forEach(msg => {
            msg.classList.remove('hidden-message', 'shown-message');
          });
          localStorage.setItem('deletedChatMessagesContent', JSON.stringify([]));
          this.selected.clear();
          this.updateDeletedMessages();
          this.renderToggle();
          return;
        }

        const shouldShow = this.toggleBtn.textContent === 'Show';
        const storedIds = JSON.parse(localStorage.deletedChatMessagesContent || '[]');

        document.querySelectorAll('.messages-content p').forEach(msg => {
          const id = getMessageId(msg);
          if (storedIds.includes(id)) {
            msg.classList.toggle('hidden-message', !shouldShow);
            msg.classList.toggle('shown-message', shouldShow);
          }
        });

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
  const currentIds = new Set(
    [...document.querySelectorAll('.messages-content p')].map(msg => getMessageId(msg))
  );
  const stored = new Set(JSON.parse(localStorage.deletedChatMessagesContent || '[]'));
  const updatedStored = [...stored].filter(id => currentIds.has(id));
  localStorage.deletedChatMessagesContent = JSON.stringify(updatedStored);
}
