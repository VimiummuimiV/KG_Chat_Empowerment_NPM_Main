import {
  getDataById,
  formatRegisteredDate,
  convertToUpdatedTimestamp
} from './apiData.js';
import { getCurrentLanguage } from './helpers.js';

const lang = getCurrentLanguage();

// Function to validate required user data
function validateUserData(user) {
  const requiredFields = ['rank', 'login', 'registered', 'bestSpeed', 'ratingLevel', 'friends', 'cars', 'avatarTimestamp'];
  return user && typeof user === 'object' && requiredFields.every(field => user?.[field] !== undefined);
}

// Main function to get profile summary and index data
export async function getUserProfileData(userId, useLocalStorage = true) {
  return new Promise(async (resolve, reject) => {
    let cachedUserInfo = useLocalStorage ? JSON.parse(localStorage.getItem('fetchedUsers')) || {} : {};
    const user = cachedUserInfo[userId];

    // Validate if user data exists and has the required properties
    if (useLocalStorage && validateUserData(user)) {
      // If all data is cached, resolve with the cached data
      resolve({
        rank: user.rank,
        login: user.login,
        registeredDate: user.registered,
        bestSpeed: user.bestSpeed,
        ratingLevel: user.ratingLevel,
        friends: user.friends,
        cars: user.cars,
        avatar: user.avatar,
        avatarTimestamp: user.avatarTimestamp
      });
    } else {
      try {
        // Fetch all summary and index data in just 2 requests
        const [allUserData, allIndexData] = await Promise.all([
          getDataById(userId, 'allUserData'),
          getDataById(userId, 'allIndexData')
        ]);
        if (!allUserData || !allIndexData) throw new Error('Invalid data format received from the API.');

        // Extract fields from the two objects
        const rank = allUserData.title || (allUserData.status?.title ?? null);
        const login = allUserData.login || null;
        const registeredDate = formatRegisteredDate(allIndexData.stats?.registered);
        const bestSpeed = allIndexData.stats?.best_speed || 0;
        const ratingLevel = allIndexData.stats?.rating_level || 0;
        const friends = allIndexData.stats?.friends_cnt || 0;
        const cars = allIndexData.stats?.cars_cnt || 0;
        const avatar = allUserData.avatar || null;
        const sec = avatar?.sec || 0;
        const usec = avatar?.usec || 0;
        const avatarTimestamp = (sec != null && usec != null)
          ? convertToUpdatedTimestamp(sec, usec)
          : null;

        if (login && rank && registeredDate) {
          if (useLocalStorage) {
            cachedUserInfo[userId] = {
              rank,
              login,
              registered: registeredDate,
              bestSpeed,
              ratingLevel,
              friends,
              cars,
              avatar,
              avatarTimestamp
            };
            localStorage.setItem('fetchedUsers', JSON.stringify(cachedUserInfo));
          }
          resolve({
            rank,
            login,
            registeredDate,
            bestSpeed,
            ratingLevel,
            friends,
            cars,
            avatar,
            avatarTimestamp
          });
        } else {
          throw new Error(
            (lang === 'ru')
              ? 'Пользователь не найден.'
              : 'User not found.'
          );
        }
      } catch (error) {
        console.error(`Error fetching user profile data for ${userId}:`, error);
        reject(error);
      }
    }
  });
}
