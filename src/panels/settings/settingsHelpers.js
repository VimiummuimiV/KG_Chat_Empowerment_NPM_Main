// Common function to attach click event for removing an item
export function attachRemoveListener(removeButton, item) {
  removeButton.addEventListener('click', () => {
    item.remove();
  });
}

// Function to attach click event for toggling snowflake states
export function attachSnowflakeListener(snowflakeButton, username) {
  snowflakeButton.addEventListener('click', () => {
    const isFrozen = snowflakeButton.classList.toggle('assigned-frozen-config');
    snowflakeButton.classList.toggle('assigned-thawed-config');
    snowflakeButton.style.opacity = isFrozen ? '1' : '0.3';
    updateUserState(username, isFrozen ? 'frozen' : 'thawed');
  });
}

// Function to update user state in localStorage
function updateUserState(username, state) {
  const usersData = localStorage.getItem("usersToTrack");
  if (usersData) {
    const updatedUsers = JSON.parse(usersData).map(user =>
      user.name === username ? { ...user, state } : user
    );
    localStorage.setItem("usersToTrack", JSON.stringify(updatedUsers));
  }
}