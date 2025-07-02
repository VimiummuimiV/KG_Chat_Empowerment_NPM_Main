import { minimalChatlogsDate } from "../../definitions.js";

// Generate a random 20-digit number
export const randomParam = Math.floor(Math.random() * 10 ** 20);

// Generate random date in range for chat logs
export function getRandomDateInRange() {
  const startDate = new Date(minimalChatlogsDate); // Start date
  const endDate = new Date(); // Current date
  // Calculate the difference in milliseconds
  const dateDifference = endDate - startDate;
  // Generate a random number of milliseconds between 0 and dateDifference
  const randomMilliseconds = Math.floor(Math.random() * dateDifference);
  // Create a random date by adding the random milliseconds to the start date
  const randomDate = new Date(startDate.getTime() + randomMilliseconds);
  // Format the date to 'YYYY-MM-DD' using Intl.DateTimeFormat
  const formattedDate = new Intl.DateTimeFormat('en-CA').format(randomDate);
  return formattedDate;
}