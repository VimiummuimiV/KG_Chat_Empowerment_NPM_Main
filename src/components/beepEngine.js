import { shouldEnable } from "../helpers/helpers.js";
import { voiceSpeed } from "./mode/soundMode.js";
import { textToSpeech } from "./voiceEngine.js";
import { settingsState } from "../panels/settings/settings.js";

const { usersToTrack } = settingsState;

// Audio file paths - GitHub raw file URLs
const audioFiles = {
  userEntered: 'https://raw.githubusercontent.com/yourusername/yourrepo/main/sounds/user-entered.mp3',
  userLeft: 'https://raw.githubusercontent.com/yourusername/yourrepo/main/sounds/user-left.mp3',
  newMessage: 'https://raw.githubusercontent.com/yourusername/yourrepo/main/sounds/new-message.mp3',
  mention: 'https://raw.githubusercontent.com/yourusername/yourrepo/main/sounds/mention.mp3'
};

// Volume settings
export const audioVolume = 0.2;

// Audio cache to store loaded audio elements
const audioCache = new Map();

// Function to preload audio files
function preloadAudio() {
  Object.entries(audioFiles).forEach(([key, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audio.volume = audioVolume;
    audioCache.set(key, audio);
    
    // Handle loading errors
    audio.onerror = () => {
      console.warn(`Failed to load audio file: ${path}`);
    };
  });
}

// Initialize audio preloading
preloadAudio();

// Function to play MP3 audio - keeping original function name
export function playBeep(audioKey, volume = audioVolume) {
  const audio = audioCache.get(audioKey);
  
  if (!audio) {
    console.warn(`Audio file not found for key: ${audioKey}`);
    return;
  }
  
  // Clone the audio element to allow overlapping sounds
  const audioClone = audio.cloneNode();
  audioClone.volume = volume;
  
  // Play the audio
  audioClone.play().catch(error => {
    console.warn(`Failed to play audio: ${error.message}`);
  });
  
  // Clean up the cloned audio element after it finishes
  audioClone.onended = () => {
    audioClone.remove();
  };
}

const verbs = {
  Male: { enter: 'зашёл', leave: 'вышел' },
  Female: { enter: 'зашла', leave: 'вышла' }
};

// Handles user entering and leaving actions
export function userAction(user, actionType, userGender) {
  const shouldPlayAction = shouldEnable('sound', 'presence');
  
  // If neither beep and voice is enabled, exit early.
  if (!shouldPlayAction) return;
  
  const gender = userGender || 'Male'; // Default to 'Male' if no gender provided
  const userToTrack = usersToTrack.find(userToTrack => userToTrack.name === user);
  const action = actionType === "enter" ? verbs[gender].enter : verbs[gender].leave;
  
  // Play MP3 audio instead of beep
  const audioKey = actionType === "enter" ? 'userEntered' : 'userLeft';
  playBeep(audioKey, audioVolume);
  
  setTimeout(() => textToSpeech(`${userToTrack.pronunciation} ${action}`, voiceSpeed), 300);
}

// Function to update audio file paths (useful for configuration)
export function updateAudioFiles(newAudioFiles) {
  Object.assign(audioFiles, newAudioFiles);
  preloadAudio(); // Reload audio files with new paths
}