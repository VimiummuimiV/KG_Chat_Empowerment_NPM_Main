const sortIcons = {
  online: '✅',
  offline: '🛑',
  rankSpeed: '🚀',
  ratingLevel: '⭐',
  carsCount: '🚖',
  friendsCount: '🤝'
};

function getSortFunction(sortMode) {
  return (a, b) => {
    if (sortMode === 'online') {
      if (a.sortData.isOnline && !b.sortData.isOnline) return -1;
      if (!a.sortData.isOnline && b.sortData.isOnline) return 1;
    } else if (sortMode === 'offline') {
      if (!a.sortData.isOnline && b.sortData.isOnline) return -1;
      if (a.sortData.isOnline && !b.sortData.isOnline) return 1;
    } else if (sortMode === 'ratingLevel') {
      if (a.sortData.ratingLevel !== b.sortData.ratingLevel) return b.sortData.ratingLevel - a.sortData.ratingLevel;
    } else if (sortMode === 'carsCount') {
      if (a.sortData.cars !== b.sortData.cars) return b.sortData.cars - a.sortData.cars;
    } else if (sortMode === 'friendsCount') {
      if (a.sortData.friends !== b.sortData.friends) return b.sortData.friends - a.sortData.friends;
    }
    if (a.sortData.order !== b.sortData.order) return a.sortData.order - b.sortData.order;
    return b.sortData.bestSpeed - a.sortData.bestSpeed;
  };
}

export function createSortButtons(
  userElements,
  oldUsersContainer,
  newUsersContainer,
  isNewUser,
  oldUsersDescription,
  newUsersDescription
) {
  let currentSortMode = 'rankSpeed';
  let currentSortButton = null;

  const sortButtonsContainer = document.createElement('div');
  sortButtonsContainer.className = 'sort-buttons-container';

  const sortModes = ['online', 'offline', 'rankSpeed', 'ratingLevel', 'carsCount', 'friendsCount'];

  sortModes.forEach(modeKey => {
    const button = document.createElement('button');
    button.className = `sort-button ${modeKey}`;
    button.textContent = sortIcons[modeKey];
    button.dataset.mode = modeKey;
    button.addEventListener('click', () => {
      if (currentSortButton) currentSortButton.classList.remove('active');
      button.classList.add('active');
      currentSortButton = button;
      currentSortMode = modeKey;
      sortAndAppendUsers();
    });
    if (modeKey === currentSortMode) {
      button.classList.add('active');
      currentSortButton = button;
    }
    sortButtonsContainer.appendChild(button);
  });

  function sortAndAppendUsers() {
    userElements.sort(getSortFunction(currentSortMode));
    oldUsersContainer.replaceChildren();
    newUsersContainer.replaceChildren();

    // Re-append descriptions before user elements
    oldUsersContainer.appendChild(oldUsersDescription);
    newUsersContainer.appendChild(newUsersDescription);

    userElements.forEach(({ userElement, registered }) => {
      (isNewUser(registered) ? newUsersContainer : oldUsersContainer).appendChild(userElement);
    });
  }

  sortAndAppendUsers();

  return sortButtonsContainer;
}