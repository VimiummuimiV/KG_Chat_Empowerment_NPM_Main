import { localizedMessage } from "../../helpers/helpers.js";
const sortIcons = {
  online: '✅',
  offline: '🛑',
  rankSpeed: '🚀',
  ratingLevel: '⭐',
  carsCount: '🚖',
  friendsCount: '🤝',
  visitsCount: '👁️',
  alpha: '🅰️',
  registered: '📅'
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
    } else if (sortMode === 'visitsCount') {
      if (a.sortData.visits !== b.sortData.visits) return b.sortData.visits - a.sortData.visits;
    } else if (sortMode === 'alpha') {
      // Cyrillic first, then Latin, both alphabetically
      const getAlphaType = (str) => {
        if (/^[\u0400-\u04FF]/.test(str)) return 0; // Cyrillic
        if (/^[A-Za-z]/.test(str)) return 1; // Latin
        return 2; // Other
      };
      const aType = getAlphaType(a.userElement.querySelector('.login')?.textContent || '');
      const bType = getAlphaType(b.userElement.querySelector('.login')?.textContent || '');
      if (aType !== bType) return aType - bType;
      const aLogin = (a.userElement.querySelector('.login')?.textContent || '').toLocaleLowerCase();
      const bLogin = (b.userElement.querySelector('.login')?.textContent || '').toLocaleLowerCase();
      return aLogin.localeCompare(bLogin);
    } else if (sortMode === 'registered') {
      // Sort by registration date (oldest first)
      const aReg = new Date(a.registered);
      const bReg = new Date(b.registered);
      return aReg - bReg;
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

  const sortModes = [
    'online', 'offline', 'rankSpeed', 'ratingLevel', 'carsCount',
    'friendsCount', 'visitsCount', 'alpha', 'registered'
  ];

  sortModes.forEach(modeKey => {
    const button = document.createElement('button');
    button.className = `sort-button ${modeKey}`;
    button.textContent = sortIcons[modeKey];
    button.dataset.mode = modeKey;
    button.addEventListener('click', () => {
      if ((modeKey === 'online' || modeKey === 'offline')) {
        const anyWaiting = userElements.some(u => u.userElement.querySelector('.present-marker.waiting'));
        if (anyWaiting) {
          localizedMessage({
            en: 'Some user statuses are still loading.',
            ru: 'Статусы некоторых пользователей ещё загружаются.'
          });
          return;
        }
      }
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