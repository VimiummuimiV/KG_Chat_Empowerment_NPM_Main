/**
 * Creates a chat user counter, appends it to the given empowerment panel, and sets the initial count.
 *
 * @param {HTMLElement} panel - The empowerment panel to append the chat user counter to.
 * @param {number} [initialCount=0] - The initial count to display.
 */
export function createChatUserCounter(panel, initialCount = 0) {
  const counter = document.createElement('div');
  counter.classList.add("chat-user-count");
  counter.title = 'Current Chat Users Count';
  counter.innerHTML = initialCount.toString();

  // Append the chat counter directly to the provided empowerment panel
  if (panel) {
    panel.appendChild(counter);
  }
}
