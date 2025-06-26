import { getAllUserIDsByName } from "../../helpers/apiData.js";
import { getUserProfileData } from "../../helpers/userProfileData.js";
import { createCachePanelUserElement } from "./cacheUserElement.js";
import { getCurrentLanguage } from "../../helpers/helpers.js";

const lang = getCurrentLanguage();

/**
 * Creates a user container element with the specified type
 * @param {string} type - The type of container ('old', 'new', or 'search')
 * @returns {HTMLElement} The created container element
 */
export function createUserContainer(type) {
  const userContainer = document.createElement('div');
  if (type === 'old') {
    userContainer.className = 'users-container old-users';
  } else if (type === 'new') {
    userContainer.className = 'users-container new-users';
  } else if (type === 'search') {
    userContainer.className = 'users-container search-results';
  }
  return userContainer;
}
/**
 * Creates a description element with specified text and class
 * @param {string} text - The description text
 * @param {string} className - The CSS class name
 * @returns {HTMLElement} The created description element
 */
export function createDescription(text, className) {
  const description = document.createElement('span');
  description.className = `description ${className}`;
  description.textContent = text;
  return description;
}
/**
 * Handles user search functionality
 * @param {string} username - The username to search for
 * @param {Function} createCachePanelUserElementFn - Function to create user elements
 * @returns {Promise<void>}
 */
export async function handleSearch(username, createCachePanelUserElementFn = createCachePanelUserElement) {
  const oldUsersContainer = document.querySelector('.old-users');
  const newUsersContainer = document.querySelector('.new-users');
  const fetchedUsersContainer = document.querySelector('.fetched-users');
  if (username) {
    oldUsersContainer.style.display = 'none';
    newUsersContainer.style.display = 'none';
    let searchResultsContainer = document.querySelector('.search-results') || createUserContainer('search');
    if (!searchResultsContainer.parentElement) fetchedUsersContainer.appendChild(searchResultsContainer);
    searchResultsContainer.replaceChildren();
    const userElements = [];
    try {
      const userIds = await getAllUserIDsByName(username);
      await Promise.all(userIds.map(async (userId) => {
        const profileData = await getUserProfileData(userId, false);
        const userData = {
          rank: profileData.rank,
          login: profileData.login,
          registered: profileData.registeredDate,
          bestSpeed: profileData.bestSpeed,
          ratingLevel: profileData.ratingLevel,
          friends: profileData.friends,
          cars: profileData.cars,
          avatarTimestamp: profileData.avatarTimestamp,
          avatar: profileData.avatar
        };
        const userElementData = createCachePanelUserElementFn(userId, userData);
        if (userElementData) userElements.push(userElementData);
      }));
      userElements.sort((a, b) => a.sortData.order !== b.sortData.order
        ? a.sortData.order - b.sortData.order
        : b.sortData.bestSpeed - a.sortData.bestSpeed);

      // Add search info as first element
      const searchText = lang === 'ru' ? 'Результаты поиска для:' : 'Search Results for:';
      let searchInfo = document.querySelector('.search-results-info');
      if (searchInfo) {
        searchInfo.textContent = `${searchText} ${username}`;
      } else {
        searchInfo = document.createElement('div');
        searchInfo.className = 'search-results-info';
        searchInfo.textContent = `${searchText} ${username}`;
      }
      searchResultsContainer.appendChild(searchInfo);

      // Then add all user elements
      userElements.forEach(({ userElement }) => searchResultsContainer.appendChild(userElement));
    } catch (error) {
      console.error('Error fetching user profile:', error);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message-info';
      errorMessage.textContent = `Error: ${error.message}`;
      searchResultsContainer.appendChild(errorMessage);
    }
  }
}