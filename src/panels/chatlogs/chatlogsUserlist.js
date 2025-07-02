import { USER_DATA_CACHE_KEY } from "../../definitions.js";

/**
 * Render the active users list based on their message counts.
 * @param {Map} usernameMessageCountMap - Map of username to message count
 * @param {HTMLElement} parentContainer - The panel or container to render the userlist into
 */
export function renderActiveUsers(usernameMessageCountMap, parentContainer) {
  if (localStorage.getItem('shouldShowActiveUsers') === 'shown') {

    let activeUsers = parentContainer.querySelector('.active-users');
    if (!activeUsers) {
      activeUsers = document.createElement('div');
      activeUsers.className = 'active-users';
      parentContainer.appendChild(activeUsers);
    }

    // Sort usernames by message count in descending order
    const sortedUsernames = Array.from(usernameMessageCountMap.entries())
      .sort(([, countA], [, countB]) => countB - countA);
    activeUsers.innerHTML = '';

    // Parse user data cache once per render
    const userData = JSON.parse(localStorage.getItem(USER_DATA_CACHE_KEY) || '{}');
    const fragment = document.createDocumentFragment();
    sortedUsernames.forEach(([username, count]) => {
      const userElement = document.createElement('div');
      userElement.className = 'active-user-item';

      const nicknameElement = document.createElement('span');
      nicknameElement.className = 'active-user-name';
      nicknameElement.textContent = username;

      // Use cached color for username
      const color = userData[username]?.color || '#808080';
      nicknameElement.style.color = color;

      const messageCountElement = document.createElement('span');
      messageCountElement.className = 'active-user-messages-count';
      messageCountElement.textContent = count;
      messageCountElement.style.color = color;
      messageCountElement.style.backgroundColor = color + '20'; // add alpha for background

      userElement.appendChild(messageCountElement);
      userElement.appendChild(nicknameElement);
      fragment.appendChild(userElement);
    });
    activeUsers.appendChild(fragment);
  }
}
