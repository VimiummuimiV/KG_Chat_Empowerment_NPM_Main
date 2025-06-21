/**
 * Render the active users list based on their message counts.
 * @param {Map} usernameMessageCountMap - Map of username to message count
 * @param {HTMLElement} parentContainer - The panel or container to render the userlist into
 * @param {Object} usernameHueMap - Map of username to hue (for coloring)
 */
export function renderActiveUsers(usernameMessageCountMap, parentContainer, usernameHueMap) {
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

    sortedUsernames.forEach(([username, count]) => {
      const userElement = document.createElement('div');
      userElement.className = 'active-user-item';

      const nicknameElement = document.createElement('span');
      nicknameElement.className = 'active-user-name';
      nicknameElement.textContent = username;

      const userHue = usernameHueMap[username] || 0;
      nicknameElement.style.color = `hsl(${userHue}, 80%, 50%)`;

      const messageCountElement = document.createElement('span');
      messageCountElement.className = 'active-user-messages-count';
      messageCountElement.textContent = count;
      messageCountElement.style.color = `hsl(${userHue}, 80%, 50%)`;
      messageCountElement.style.backgroundColor = `hsla(${userHue}, 80%, 50%, 0.2)`;

      userElement.appendChild(messageCountElement);
      userElement.appendChild(nicknameElement);
      activeUsers.appendChild(userElement);
    });
  }
}
