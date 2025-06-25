// Function to validate required user data
function validateUserData(user) {
  const requiredFields = ['rank', 'login', 'registered', 'bestSpeed', 'ratingLevel', 'friends', 'cars', 'avatarTimestamp'];
  return user && typeof user === 'object' && requiredFields.every(field => user?.[field] !== undefined);
}

// Function to convert seconds to a human-readable date format
function convertSecondsToDate(seconds) {
  const date = new Date(seconds * 1000);
  return date.toISOString().slice(0, 19).replace('T', ' '); // Converts to 'YYYY-MM-DD HH:mm:ss' format
} // Already used in apiData.js

// Function to convert sec and usec to the 'updated' timestamp
function convertToUpdatedTimestamp(sec, usec) {
  // Create the full timestamp by combining sec and usec (in microseconds)
  return sec.toString() + Math.floor(usec / 1000).toString();
} // Already used in apiData.js

// Main function to get profile summary and registration data
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
        friends: user.friends, // Use cached friends count
        cars: user.cars, // Use cached cars count
        avatar: user.avatar, // Get avatar availability state
        avatarTimestamp: user.avatarTimestamp // Cached avatar timestamp
      });
    } else {
      try {
        // Fetch profile summary and registered date
        const summaryApiUrl = `https://klavogonki.ru/api/profile/get-summary?id=${userId}`;
        const profileApiUrl = `https://klavogonki.ru/api/profile/get-index-data?userId=${userId}`;

        // Fetch both profile summary and registration data in parallel
        const [summaryResponse, profileResponse] = await Promise.all([
          fetch(summaryApiUrl),
          fetch(profileApiUrl),
        ]);

        // Check if both responses are successful
        if (!summaryResponse.ok || !profileResponse.ok) {
          throw new Error('Failed to fetch data from one of the APIs.');
        }

        const summaryData = await summaryResponse.json();
        const profileData = await profileResponse.json();

        if (
          summaryData?.user?.login &&
          summaryData.title &&
          profileData?.stats?.registered
        ) {
          // Extract the relevant data
          const rank = summaryData.title;
          const login = summaryData.user.login;
          const registered = profileData.stats.registered.sec
            ? convertSecondsToDate(profileData.stats.registered.sec)
            : 'Invalid Date';

          // Extract new fields
          const bestSpeed = profileData.stats.best_speed || 0; // Default to 0 if undefined
          const ratingLevel = profileData.stats.rating_level || 0; // Default to 0 if undefined
          const friends = profileData.stats.friends_cnt || 0; // Extract friends count
          const cars = profileData.stats.cars_cnt || 0; // Extract cars count

          // Extract sec and usec from user.avatar, with null check
          const avatar = summaryData.user?.avatar || null; // Default to null if undefined or not present
          const sec = summaryData.user.avatar?.sec || 0; // Default to 0 if undefined or null
          const usec = summaryData.user.avatar?.usec || 0; // Default to 0 if undefined or null
          const avatarTimestamp = convertToUpdatedTimestamp(sec, usec); // Combine sec and usec to get avatar timestamp

          // Cache the fetched data if useLocalStorage is true, excluding the avatar
          if (useLocalStorage) {
            cachedUserInfo[userId] = {
              rank: rank,
              login: login,
              registered: registered,
              bestSpeed: bestSpeed,
              ratingLevel: ratingLevel,
              friends: friends, // Cache friends count
              cars: cars, // Cache cars count
              avatar: avatar,
              avatarTimestamp: avatarTimestamp // Cache avatar timestamp
            };

            // Update localStorage with the new cached data
            localStorage.setItem('fetchedUsers', JSON.stringify(cachedUserInfo));
          }

          // Resolve with the combined data
          resolve({
            rank: rank,
            login: login,
            registeredDate: registered,
            bestSpeed: bestSpeed,
            ratingLevel: ratingLevel,
            friends: friends,
            cars: cars,
            avatar: avatar, // Return avatar for current session
            avatarTimestamp: avatarTimestamp // Include avatar timestamp in the result
          });
        } else {
          throw new Error('Invalid data format received from the API.');
        }
      } catch (error) {
        console.error(`Error fetching user profile data for ${userId}:`, error);
        reject(error);
      }
    }
  });
}
