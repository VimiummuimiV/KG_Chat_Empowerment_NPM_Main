import { state } from "../../definitions.js";
let { fetchedUsers } = state;

// Function to calculate time spent on the site
export function calculateTimeOnSite(registeredDate) {
  const totalSeconds = Math.floor((new Date() - new Date(registeredDate)) / 1000);
  const years = Math.floor(totalSeconds / (365 * 24 * 60 * 60));
  const months = Math.floor((totalSeconds % (365 * 24 * 60 * 60)) / (30.44 * 24 * 60 * 60));
  const days = Math.floor((totalSeconds % (30.44 * 24 * 60 * 60)) / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  const timeComponents = [];

  if (years > 0) {
    timeComponents.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) timeComponents.push(`${months} month${months > 1 ? 's' : ''}`);
  } else if (months > 1 || (months === 1 && days > 0)) {
    timeComponents.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) timeComponents.push(`${days} day${days > 1 ? 's' : ''}`);
  } else if (days > 0) {
    timeComponents.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) timeComponents.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  } else if (hours > 0) {
    timeComponents.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  } else if (minutes > 0) {
    timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) timeComponents.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  } else {
    timeComponents.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  }

  return timeComponents.filter(Boolean).join(' '); // Filter out empty strings and join components
}

// Function to refresh or manually clear fetched users and reset the timer
// @param {boolean} isManual - If true, clears cache unconditionally; if false, clears based on threshold (default is false)
// @param {number} thresholdHours - Time threshold in hours for automatic cache clearing (default is 24 hours)
export function refreshFetchedUsers(isManual = false, thresholdHours = 24) {
  // Retrieve the last clear time from localStorage
  const lastClearTime = localStorage.getItem('lastClearTime');
  const timeElapsed = lastClearTime ? (new Date().getTime() - lastClearTime) / (1000 * 60 * 60) : Infinity;

  // If clearing manually or the time threshold has been reached, clear the cache
  if (isManual || timeElapsed >= thresholdHours) {
    localStorage.removeItem('fetchedUsers');
    // fetchedUsers = {};
    Object.keys(fetchedUsers).forEach(key => delete fetchedUsers[key]);
    // Reset the timer by updating 'lastClearTime' and 'nextClearTime'
    const nextClearTime = new Date().getTime() + thresholdHours * 60 * 60 * 1000;
    localStorage.setItem('lastClearTime', new Date().getTime().toString());
    localStorage.setItem('nextClearTime', nextClearTime.toString());
  }
}