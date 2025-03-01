import { shouldEnableSetting } from "./helpers"; // helpers
import { voiceSpeed, voicePitch } from "./sound-mode"; // sound mode

// SOUND NOTIFICATION

// Function to create the audio context and return a Promise that resolves when the context is ready
function createAudioContext() {
  const audioContext = new AudioContext();
  return new Promise(resolve => {
    audioContext.onstatechange = function () {
      if (audioContext.state === 'running') {
        resolve(audioContext);
      }
    };
  });
}

// Create the audio context and wait for it to be ready
const audioContextPromise = createAudioContext();

// List of frequencies to play for "User Left" && "User Entered" && "New Messages"
const userEnteredFrequencies = [300, 600];
const userLeftFrequencies = [600, 300];
export const usualMessageFrequencies = [500];
export const mentionMessageFrequencies = [600, 800];

// Volume of the reader voice
const voiceVolume = 1;
// Volume of the beep signal
export const beepVolume = 0.2;
// Duration for each frequency
const duration = 80;
// Smooth inception and termination for each note
const fade = 10;
// Space between each note to make noticeable pauses
const delay = 100;

// Function to play a beep given a list of frequencies
export function playBeep(frequencies, volume) {
  audioContextPromise.then(audioContext => {
    for (let i = 0; i < frequencies.length; i++) {
      const frequency = frequencies[i];
      if (frequency === 0) {
        // Rest note
        setTimeout(() => { }, duration);
      } else {
        // Play note
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.connect(gain);
        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        // Create low pass filter to cut frequencies below 250Hz
        const lowPassFilter = audioContext.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.value = 250;
        oscillator.connect(lowPassFilter);

        // Create high pass filter to cut frequencies above 16kHz
        const highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.value = 16000;
        lowPassFilter.connect(highPassFilter);

        gain.connect(audioContext.destination);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + fade / 1000);
        oscillator.start(audioContext.currentTime + i * delay / 1000);
        oscillator.stop(audioContext.currentTime + (i * delay + duration) / 1000);
        gain.gain.setValueAtTime(volume, audioContext.currentTime + (i * delay + (duration - fade)) / 1000);
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + (i * delay + duration) / 1000);
      }
    }
  });
}

// Create a promise that will resolve when the list of available voices is populated
const awaitVoices = new Promise(resolve => {
  // Create a speech synthesis object
  const synth = window.speechSynthesis;
  // Retrieve the list of available voices
  let voices = synth.getVoices();

  // Define the voice names for Pavel and Irina
  const pavelVoiceName = 'Microsoft Pavel - Russian (Russia)';
  const irinaVoiceName = 'Microsoft Irina - Russian (Russia)';

  // Find and store Pavel's voice
  let pavelVoice = voices.find(voice => voice.name === pavelVoiceName);
  // Find and store Irina's voice
  let irinaVoice = voices.find(voice => voice.name === irinaVoiceName);

  // If either voice is not found or the voices list is empty, wait for it to populate
  if (!pavelVoice || !irinaVoice || voices.length === 0) {
    synth.addEventListener('voiceschanged', () => {
      voices = synth.getVoices();
      pavelVoice = voices.find(voice => voice.name === pavelVoiceName);
      irinaVoice = voices.find(voice => voice.name === irinaVoiceName);

      // If both voices are found, continue with the initialization
      if (pavelVoice && irinaVoice) {
        // Define the utterance object as a global variable
        const utterance = new SpeechSynthesisUtterance();
        // Set the "lang" property of the utterance object to 'ru-RU'
        utterance.lang = 'ru-RU';
        // Set the "voice" property of the utterance object to Pavel's voice
        utterance.voice = irinaVoice;
        // Resolve the promise
        resolve({ synth, utterance, voices, pavelVoice, irinaVoice });
      }
    });
  } else {
    // Define the utterance object as a global variable
    const utterance = new SpeechSynthesisUtterance();
    // Set the "lang" property of the utterance object to 'ru-RU'
    utterance.lang = 'ru-RU';
    // Set the "voice" property of the utterance object to (Needed) voice
    utterance.voice = irinaVoice;
    // Resolve the promise
    resolve({ synth, utterance, voices, pavelVoice, irinaVoice });
  }
});

async function cleanText(text) {
  return text
    // Replace all hyphens (- U+002D), minus signs (− U+2212), and underscores (_) with spaces
    .replace(/[-−_]/g, ' ')
    // Replace URLs with just the domain name, removing "https://", "http://", and "www."
    .replace(/https?:\/\/(?:www\.)?([a-zA-Z0-9.-]+)(\/.*)?/g, (_, p1) => p1)
    .replace(/\s(?=[?!,.:;@])/g, '')
    // Remove all other symbols completely
    .replace(/["#$%&'()*+\/<=>[\\\]^`{|}~]/g, '')
    // Remove extra spaces and format text
    .split(' ').filter(Boolean).join(' ').trim();
}

// Split text into language blocks (Russian vs. English) based on per-word detection.
const detectLanguageBlocks = text =>
  text.split(/\s+/).reduce((blocks, word) => {
    const lang = /[А-Яа-яЁё0-9]/.test(word) ? 'ru' : 'en';
    if (blocks.length && blocks[blocks.length - 1].lang === lang) {
      blocks[blocks.length - 1].text += ' ' + word;
    } else {
      blocks.push({ lang, text: word });
    }
    return blocks;
  }, []);

// Fallback: Web Speech API TTS
async function webTextToSpeech(text, voiceSpeed = voiceSpeed) {
  const { synth, utterance, voice } = await awaitVoices;
  Object.assign(utterance, { text, rate: voiceSpeed, volume: voiceVolume, pitch: voicePitch, voice });
  return new Promise(resolve => { utterance.onend = resolve; synth.speak(utterance); });
}

// Main TTS function: plays each language block in order.
export async function textToSpeech(text, voiceSpeed = voiceSpeed) {
  const shouldUseGoogleTTS = shouldEnableSetting('sound', 'gTTS');
  // Clean the text using the new cleanText function asynchronously
  const cleanedText = await cleanText(text);

  // If Google TTS is enabled, use it. Otherwise, fallback to Web Speech API.
  if (shouldUseGoogleTTS) {
    const blocks = detectLanguageBlocks(cleanedText);
    try {
      for (const { lang, text } of blocks) {
        await new Promise((resolve, reject) => {
          fetch(`http://127.0.0.1:5000/speak?text=${encodeURIComponent(text)}&lang=${lang}`)
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.arrayBuffer(); })
            .then(buffer => {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const audio = new Audio(URL.createObjectURL(new Blob([buffer], { type: 'audio/mp3' })));
              const source = audioContext.createMediaElementSource(audio);
              const gainNode = audioContext.createGain();

              gainNode.gain.value = 2.0; // Boost volume

              // Connect the audio source to the gain node and the gain node to the destination (speakers)
              source.connect(gainNode);
              gainNode.connect(audioContext.destination);

              audio.onended = resolve;
              audio.onerror = reject;
              audio.play();
            })
            .catch(reject);
        });
      }
    } catch (error) {
      console.error("Server TTS failed:", error);
    }
  } else {
    // If Google TTS isn't enabled, fallback to Web Speech API
    await webTextToSpeech(text, voiceSpeed);
  }
}

const verbs = {
  Male: { enter: 'зашёл', leave: 'вышел' },
  Female: { enter: 'зашла', leave: 'вышла' }
};

// Handles user entering and leaving actions
export function userAction(user, actionType, userGender) {
  const shouldPlayAction = shouldEnableSetting('sound', 'presence');
  // If neither beep and voice is enabled, exit early.
  if (!shouldPlayAction) return;

  const gender = userGender || 'Male'; // Default to 'Male' if no gender provided
  const userToTrack = usersToTrack.find(userToTrack => userToTrack.name === user);
  const action = actionType === "enter" ? verbs[gender].enter : verbs[gender].leave;
  const frequencies = actionType === "enter" ? userEnteredFrequencies : userLeftFrequencies;

  playBeep(frequencies, beepVolume);
  setTimeout(() => textToSpeech(`${userToTrack.pronunciation} ${action}`, voiceSpeed), 300);
}