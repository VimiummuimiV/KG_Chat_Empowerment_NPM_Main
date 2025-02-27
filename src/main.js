// styles
import './style.css';

import { convertImageLinksToImage } from "./modules/image-converter.js"; // image converter
import { convertVideoLinksToPlayer } from "./modules/video-converter.js"; // video converter

// icons
import * as icons from './modules/icons.js';

import { createCacheButton, updateUserCountText } from './modules/cache.js'; // cache
import { createPersonalMessagesButton } from './modules/messages.js'; // messages
import { createChatLogsButton } from './modules/chatlogs.js'; // chatlogs
import { createSettingsButton } from './modules/settings.js'; // settings

// helpers
import {
  debounce,
  isValidEncodedURL,
  addPulseEffect,
  processEncodedLinks,
  getRandomEmojiAvatar,
  getUserProfileData,
  convertToSingleHours,
  refreshFetchedUsers,
  shouldEnableSetting,
  scrollMessagesToBottom,
  getCurrentTimeFormatted,
  updatePersonalMessageCounts,
  highlightMentionWords
} from './modules/helpers.js';

// notifications
import { createCustomTooltip } from './modules/tooltip.js';

// notifications
import {
  showUserAction
} from './modules/notifications.js';

// definitions
import {
  myNickname,
  myUserId,
  usersToTrack,
  mentionKeywords,
  usernameReplacements,
  moderator,
  ignored,
  debounceTimeout,
  fetchedUsers,
  profileBaseUrl,
  state,
  defaultCacheRefreshThresholdHours
} from './modules/definitions.js';

// Define dynamic variables
let {
  isCtrlKeyPressed,
  isAltKeyPressed
} = state;

(function () {
  // Function to dynamically append font link to the head
  function appendFontLink(fontFamily, fontWeights) {
    // Check if the font link element with the specified class already exists
    const existingFont = document.querySelector(`.font-${fontFamily.replace(/\s/g, '-')}`);

    // If it doesn't exist, create a new link element and append it to the document head
    if (!existingFont) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s/g, '+')}:wght@${fontWeights.join(';')}&display=swap`;
      fontLink.classList.add(`font-${fontFamily.replace(/\s/g, '-')}`);

      // Append the font link element to the document head
      document.head.appendChild(fontLink);
    }
  }

  // Specify the font weights you want to include
  const montserratFontWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
  const orbitronFontWeights = ['400', '500', '600', '700', '800', '900'];
  const robotoMonoFontWeights = ['100', '200', '300', '400', '500', '600', '700'];

  // Call the function to append Montserrat font link
  appendFontLink('Montserrat', montserratFontWeights);

  // Call the function to append Orbitron font link
  appendFontLink('Orbitron', orbitronFontWeights);

  // Call the function to append Roboto Mono font link
  appendFontLink('Roboto Mono', robotoMonoFontWeights);

  // Define voice speed limits
  const minVoiceSpeed = 0;
  const maxVoiceSpeed = 2.5;

  // Define voice pitch limits
  const minVoicePitch = 0;
  const maxVoicePitch = 2.0;

  // Define default voice speed and pitch
  const defaultVoiceSpeed = 1.5;
  const defaultVoicePitch = 1.0;

  // Retrieve KG_Chat_Empowerment from localStorage or create an object with empty voiceSettings if it doesn't exist
  // This is the main key for the settings
  let KG_Chat_Empowerment = JSON.parse(localStorage.getItem('KG_Chat_Empowerment'));

  // If KG_Chat_Empowerment doesn't exist in localStorage, create it with an empty voiceSettings object
  if (!KG_Chat_Empowerment) {
    KG_Chat_Empowerment = {
      voiceSettings: {
        voiceSpeed: defaultVoiceSpeed, // Set default values for voiceSpeed
        voicePitch: defaultVoicePitch, // Set default values for voicePitch
      },
      messageSettings: {},
    };
    localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));
  }

  // Define the default voice speed and pitch
  let voiceSpeed = KG_Chat_Empowerment.voiceSettings.voiceSpeed !== null
    ? KG_Chat_Empowerment.voiceSettings.voiceSpeed
    : defaultVoiceSpeed; // Default value if KG_Chat_Empowerment.voiceSettings.voiceSpeed is null

  let voicePitch = KG_Chat_Empowerment.voiceSettings.voicePitch !== null
    ? KG_Chat_Empowerment.voiceSettings.voicePitch
    : defaultVoicePitch; // Default value if KG_Chat_Empowerment.voiceSettings.voicePitch is null

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
  const usualMessageFrequencies = [500];
  const mentionMessageFrequencies = [600, 800];

  // Volume of the reader voice
  const voiceVolume = 0.8;
  // Volume of the beep signal
  const beepVolume = 0.2;
  // Duration for each frequency
  const duration = 80;
  // Smooth inception and termination for each note
  const fade = 10;
  // Space between each note to make noticeable pauses
  const delay = 100;

  // Function to play a beep given a list of frequencies
  function playBeep(frequencies, volume) {
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
  async function textToSpeech(text, voiceSpeed = voiceSpeed) {
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

  function getUserGender(userName) {
    const user = usersToTrack.find((user) => user.name === userName);
    return user ? user.gender : null;
  }

  // Handles user entering and leaving actions
  function userAction(user, actionType, userGender) {
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


  // EMPOWERMENT PANEL AND USER COUNTER

  // Retrieve body element to inject this beast elements
  const bodyElement = document.querySelector('body');
  // Create parent container for the beast elements
  const empowermentButtonsPanel = document.createElement('div');
  empowermentButtonsPanel.classList.add("empowerment-panel");

  // Create chat user count container to store the user count number
  const chatUserCount = document.createElement('div');
  chatUserCount.classList.add("chat-user-count");
  chatUserCount.title = 'Current Chat Users Count';
  chatUserCount.innerHTML = '0';  // Set initial value as 0

  // Append user count element inside empowerment panel
  empowermentButtonsPanel.appendChild(chatUserCount);
  // Append panel element inside the body
  bodyElement.appendChild(empowermentButtonsPanel);

  // POPUPS

  // Helper for pausing execution
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function purgeStaticChatNotifications(
    removalDelay = 40,
    scrollDuration = 600,
    animationDuration = 140
  ) {
    const chat = document.querySelector(".messages-content");
    if (!chat) return;

    // Save original scroll behavior and set to smooth once
    const originalScrollBehavior = chat.style.scrollBehavior;
    chat.style.scrollBehavior = 'smooth';

    const elements = [...document.querySelectorAll('.static-chat-notification')].reverse();

    for (const el of elements) {
      const needsScroll = !isVisibleInContainer(el, chat);

      if (needsScroll) {
        // Smooth scroll to element
        chat.scrollTop = el.offsetTop - chat.offsetTop - chat.clientHeight / 2;
        await sleep(scrollDuration);
      }

      Object.assign(el.style, {
        transition: [
          `opacity ${animationDuration / 1000}s cubic-bezier(.3,.1,1,.1)`,
          `transform ${animationDuration / 1000}s cubic-bezier(0,.7,.3,0.95)`
        ].join(','),
        opacity: 0,
        transformOrigin: 'left',
        transform: 'translateX(8em) skewX(-20deg)'
      });

      // Wait for animation to complete before removal
      await sleep(animationDuration);
      el.remove();

      // Standard delay between elements
      await sleep(removalDelay);
    }

    // Final scroll to bottom only if needed
    const isAtBottom = chat.scrollHeight - chat.scrollTop <= chat.clientHeight;
    if (!isAtBottom) {
      chat.scrollTop = chat.scrollHeight;
      await sleep(scrollDuration);
    }

    // Restore original scroll behavior
    chat.style.scrollBehavior = originalScrollBehavior;
  }

  function isVisibleInContainer(el, container) {
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return (
      elRect.top >= containerRect.top &&
      elRect.bottom <= containerRect.bottom
    );
  }















  // NEW CHAT USER LIST (START)

  // Function to dynamically apply background color
  function applyDynamicBackgroundColor() {
    // Create a new <style> element
    const newChatUserListStyles = document.createElement('style');
    newChatUserListStyles.classList.add("userlist-dynamic-background");

    // Get the dynamic background color
    const dynamicBackgroundColor = getComputedStyle(document.querySelector('.chat .messages')).backgroundColor;

    // Define the styles with only background color
    const userListStyles = `
    #chat-general .smile-tab {
      background-color: ${dynamicBackgroundColor};
    }
    .chat-user-list {
      background-color: ${dynamicBackgroundColor};
    }
  `;

    // Set the innerHTML of the style element to the styles
    newChatUserListStyles.innerHTML = userListStyles;
    // Append the <style> element to the document head
    document.head.appendChild(newChatUserListStyles);
  }

  // Call the function to apply the dynamic background color
  applyDynamicBackgroundColor();

  // Function to calculate time spent on the site
  function calculateTimeOnSite(registeredDate) {
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

  // Function to get rank information (class, color, and icon) based on status title in English
  function getRankInfo(mainTitle) {
    const statusData = {
      'Экстракибер': { class: 'extra', icon: '🚀', color: '#06B4E9' },
      'Кибергонщик': { class: 'cyber', icon: '🤖', color: '#5681ff' },
      'Супермен': { class: 'superman', icon: '👊', color: '#B543F5' },
      'Маньяк': { class: 'maniac', icon: '🔪', color: '#DA0543' },
      'Гонщик': { class: 'racer', icon: '⚡️️', color: '#FF8C00' },
      'Профи': { class: 'profi', icon: '️💼️', color: '#C1AA00' },
      'Таксист': { class: 'driver', icon: '🚖️', color: '#2DAB4F' },
      'Любитель': { class: 'amateur', icon: '🍆️', color: '#61B5B3' },
      'Новичок': { class: 'newbie', icon: '🐥', color: '#AFAFAF' }
    };

    const defaultData = { class: 'unknown', icon: '❓', color: '#000000' };
    const rankInfo = statusData[mainTitle] || defaultData;

    if (rankInfo.class === defaultData.class) {
      console.log(`Class not found for status title: ${mainTitle}. Using default class: ${defaultData.class}`);
    }

    return rankInfo;
  }

  // Function to handle private message
  function insertPrivate(userId) {
    const userName = document.querySelector(`.name[data-user="${userId}"]`).textContent;
    const message = `<${userName}>`;

    const textElement = document.querySelector('.messages .text');
    textElement.value = message;

    textElement.focus();
    textElement.selectionEnd = textElement.value.length;
  }

  function createCircularProgress(percentage, color, isRevoked) {
    const svgUrl = "http://www.w3.org/2000/svg";
    const size = 20;
    const center = size / 2;
    const strokeWidth = 2;
    const radius = center - strokeWidth;
    const diameter = radius * 2;
    const randomString = Math.random().toString(36).substring(2, 22);
    const scaleMultiplier = !isRevoked && percentage === 0 ? 0.6 : 1;

    const svg = document.createElementNS(svgUrl, "svg");
    Object.entries({
      width: size, height: size, viewBox: `0 0 ${size} ${size}`, xmlns: svgUrl
    }).forEach(([k, v]) => svg.setAttribute(k, v));
    svg.classList.add("circularProgress");

    if (isRevoked || percentage === 0) {
      if (!isRevoked) {
        const outerCircle = document.createElementNS(svgUrl, "circle");
        Object.entries({
          cx: center, cy: center, r: radius, fill: "none", stroke: color, "stroke-width": strokeWidth
        }).forEach(([k, v]) => outerCircle.setAttribute(k, v));
        outerCircle.classList.add("outerCircle");
        svg.appendChild(outerCircle);
      }

      const scale = (size / 24) * scaleMultiplier;
      const offset = center - 12 * scale;
      const closeIconGroup = document.createElementNS(svgUrl, "g");
      closeIconGroup.setAttribute("transform", `translate(${offset}, ${offset}) scale(${scale})`);
      closeIconGroup.classList.add("closeIconGroup");

      const path = document.createElementNS(svgUrl, "path");
      Object.entries({
        d: "M18.364 5.636a1 1 0 0 1 0 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12l-4.95-4.95a1 1 0 0 1 1.414-1.414L12 10.586l4.95-4.95a1 1 0 0 1 1.414 0z",
        fill: color
      }).forEach(([k, v]) => path.setAttribute(k, v));

      closeIconGroup.appendChild(path);
      svg.appendChild(closeIconGroup);
    } else {
      const defs = document.createElementNS(svgUrl, "defs");
      defs.classList.add("defs");

      const clipPath = document.createElementNS(svgUrl, "clipPath");
      clipPath.setAttribute("id", `clipInner-${randomString}`);
      clipPath.classList.add("clipPath");

      const clipRect = document.createElementNS(svgUrl, "rect");
      Object.entries({
        x: center - radius, y: center - radius, width: diameter, height: 0, transform: `rotate(180, ${center}, ${center})`
      }).forEach(([k, v]) => clipRect.setAttribute(k, v));
      clipRect.classList.add("clipRect");

      const animate = document.createElementNS(svgUrl, "animate");
      Object.entries({
        attributeName: "height",
        from: 0,
        to: diameter * (percentage / 100),
        begin: "indefinite",
        dur: "1s",
        fill: "freeze",
        calcMode: "spline",
        keySplines: "0.4 0 0.2 1", // Fast start, smooth stop
        keyTimes: "0;1"
      }).forEach(([k, v]) => animate.setAttribute(k, v));
      animate.classList.add("animateProfileProgress");

      clipRect.appendChild(animate);
      clipPath.appendChild(clipRect);
      defs.appendChild(clipPath);
      svg.appendChild(defs);

      const outerCircle = document.createElementNS(svgUrl, "circle");
      Object.entries({
        cx: center, cy: center, r: radius, fill: "none", stroke: color, "stroke-width": strokeWidth
      }).forEach(([k, v]) => outerCircle.setAttribute(k, v));
      outerCircle.classList.add("outerCircle");
      svg.appendChild(outerCircle);

      const innerCircle = document.createElementNS(svgUrl, "circle");
      Object.entries({
        cx: center, cy: center, r: radius, fill: color, "clip-path": `url(#clipInner-${randomString})`
      }).forEach(([k, v]) => innerCircle.setAttribute(k, v));
      innerCircle.classList.add("innerCircle");
      svg.appendChild(innerCircle);
    }

    return svg.outerHTML;
  }

  /**
   * Calculates the percentage of a given number within its nearest range.
   * The function dynamically determines the range based on the input value.
   *
   * @param {number} value - The input value to calculate the percentage for.
   * @returns {number} - The percentage of the input value within its identified range.
   */
  function calculatePercentage(value) {
    // Determine the lower bound of the range (this is smart, not hardcoded)
    const lowerBound = Math.floor(value / 100) * 100; // Nearest lower multiple of 100
    const upperBound = lowerBound + 100; // Nearest upper multiple of 100

    // Calculate the percentage within the identified range
    const percentage = ((value - lowerBound) / (upperBound - lowerBound)) * 100;

    return percentage;
  }

  // Array to store user IDs and their status titles
  // let fetchedUsers = JSON.parse(localStorage.getItem('fetchedUsers')) || {};

  // Function to create a user element with avatar, name, and profile link based on user details
  function createUserChatElement(userId, mainTitle, userName, bestSpeed, isRevoked) {
    const avatarTimestamp = fetchedUsers[userId]?.avatarTimestamp;

    // Ensure the bigAvatarUrl is only constructed if avatarTimestamp is not '00'
    const bigAvatarUrl = avatarTimestamp !== '00' ? `/storage/avatars/${userId}_big.png?updated=${avatarTimestamp}` : '';

    const newUserElement = document.createElement('div');
    // Get rank information (class, color, icon)
    const rankInfo = getRankInfo(mainTitle);
    const rankClass = rankInfo.class;  // Rank class
    const rankColor = rankInfo.color;  // Rank color
    const rankIcon = rankInfo.icon;    // Rank icon (emoji)

    newUserElement.classList.add(`user${userId}`, rankClass); // Assign the rank class

    const newAvatarElement = document.createElement('div');
    newAvatarElement.classList.add('avatar');

    // Only create and append an image element if avatarTimestamp is not '00'
    if (avatarTimestamp !== '00') {
      const avatarImage = document.createElement('img');
      avatarImage.src = bigAvatarUrl;
      newAvatarElement.appendChild(avatarImage);
    } else {
      newAvatarElement.style.fontSize = '1.8rem';
      // Insert a random SVG icon instead of an image when avatarTimestamp is '00'
      newAvatarElement.innerHTML = getRandomEmojiAvatar();
    }

    const newNameElement = document.createElement('a');
    newNameElement.classList.add('name');
    newNameElement.title = 'Написать в приват';
    newNameElement.dataset.user = userId;
    newNameElement.textContent = userName;

    newNameElement.style.setProperty('color', rankColor, 'important');

    const newProfileElement = document.createElement('a');
    newProfileElement.classList.add('profile');
    const title = `${rankIcon} ${mainTitle} - ${bestSpeed}`;
    createCustomTooltip(newProfileElement, title);
    newProfileElement.target = '_blank';
    newProfileElement.href = `/profile/${userId}/`;
    let circularProgress = createCircularProgress(calculatePercentage(bestSpeed), rankColor, isRevoked);
    // Use circular progress element for profile navigation from new chat user list
    newProfileElement.innerHTML = circularProgress;
    // Start animation after element is in DOM
    setTimeout(() => {
      const animateElement = newProfileElement.querySelector('.animateProfileProgress');
      if (animateElement) animateElement.beginElement();
    }, 10);
    // Add event listener click with Hold Ctrl Key to open profile into iframe
    newProfileElement.addEventListener('click', function (event) {
      event.preventDefault();
      if (isCtrlKeyPressed) {
        // Open the profile in a new tab
        window.open(profileBaseUrl + userId, '_blank');
      } else {
        // Load the profile into the iframe
        loadProfileIntoIframe(profileBaseUrl + userId);
      }
    });

    // Construct the URL for the messaging interface between two users
    const messageInProfile = `${profileBaseUrl}${myUserId}/messages/${userId}/`;

    // Attach a click event listener to the newNameElement element
    newNameElement.addEventListener('click', function (event) {
      // Check if both Ctrl and Shift keys are pressed during the click event
      if (event.ctrlKey && event.shiftKey) {
        // If both keys are pressed, open the messaging URL in a new tab
        const newTab = window.open(messageInProfile, '_blank');
        if (newTab) newTab.focus(); // Attempt to make the new tab active
      }
      // Check if only the Ctrl key is pressed
      else if (event.ctrlKey) {
        // If Ctrl is pressed, load the messaging interface URL into the iframe
        loadProfileIntoIframe(messageInProfile);
      }
      // If neither Ctrl nor Shift is pressed, initiate a private chat message
      else {
        // The insertPrivate function handles sending a private message to the specified user
        insertPrivate(userId);
      }
    });

    newUserElement.appendChild(newAvatarElement);
    newUserElement.appendChild(newNameElement);
    newUserElement.appendChild(newProfileElement);

    // Check if there is a user in 'usersToTrack' array by their name and state
    const userToTrack = usersToTrack.find((user) =>
      user.name === userName && user.state === 'thawed'
    );

    if (userToTrack) {
      const trackedIcon = document.createElement('div');
      trackedIcon.title = 'Tracked user';
      trackedIcon.classList.add('tracked');
      trackedIcon.innerHTML = icons.trackedSVG;
      newUserElement.appendChild(trackedIcon);
    }

    // Check if the user is in the ignore list
    const isIgnoredUser = ignored.includes(userName);

    // Create and hide a message element if the user is in ignored
    if (isIgnoredUser) {
      const ignoredIcon = document.createElement('div');
      ignoredIcon.title = 'Ignored user';
      ignoredIcon.classList.add('ignored');
      ignoredIcon.innerHTML = icons.ignoredSVG;
      newUserElement.appendChild(ignoredIcon);
    }

    // Check if there is an <img> element with a src attribute containing the word "moderator" inside the <ins> element
    const hasModeratorIcon = document.querySelector(`.userlist-content ins.user${userId} img[src*="moderator"]`);

    // Check if the user is in the moderator list
    const isModerator = moderator.includes(userName);

    // If a moderator icon is found or the current user is in the moderator array, append the moderator icon.
    if (hasModeratorIcon || isModerator) {
      const moderatorIcon = document.createElement('div');
      moderatorIcon.classList.add('moderator');
      moderatorIcon.innerHTML = icons.moderatorSVG; // Assuming 'icons.moderatorSVG' contains the SVG for the icon
      newUserElement.appendChild(moderatorIcon);
    }

    return newUserElement;
  }

  // Function to update users in the custom chat
  async function refreshUserList(retrievedLogin, actionType) {
    try {
      // Get the original user list container
      const originalUserListContainer = document.querySelector('.userlist-content');

      // Get or create the user list container
      let userListContainer = document.querySelector('.chat-user-list');
      if (!userListContainer) {
        userListContainer = document.createElement('div');
        userListContainer.classList.add('chat-user-list');

        // Find the element with the class "userlist"
        const userlistElement = document.querySelector('.userlist');

        // Append the userListContainer to the userlistElement if found
        if (userlistElement) {
          userlistElement.appendChild(userListContainer);
        }
      }

      // Define the rank order
      const rankOrder = ['extra', 'cyber', 'superman', 'maniac', 'racer', 'profi', 'driver', 'amateur', 'newbie'];

      // Create an object to store subparent elements for each rank class
      const rankSubparents = {};

      // Check if subparent elements already exist, if not, create them
      rankOrder.forEach(rankClass => {
        const existingSubparent = userListContainer.querySelector(`.rank-group-${rankClass}`);
        if (!existingSubparent) {
          rankSubparents[rankClass] = document.createElement('div');
          rankSubparents[rankClass].classList.add(`rank-group-${rankClass}`);
          userListContainer.appendChild(rankSubparents[rankClass]);
        } else {
          rankSubparents[rankClass] = existingSubparent;
        }
      });

      // Create a set to store existing user IDs in the updated user list
      const existingUserIds = new Set();

      // Iterate over each user element in the original user list
      for (const userElement of originalUserListContainer.querySelectorAll('ins')) {
        const nameElement = userElement.querySelector('.name');
        const userId = nameElement.getAttribute('data-user');
        const userName = nameElement.textContent;

        // Check if the user already exists in the updated user list
        if (!existingUserIds.has(userId)) {
          try {
            // Retrieve the user's profile data
            const { rank: mainTitle, login, registeredDate, bestSpeed, ratingLevel, friends, cars, avatarTimestamp } = await getUserProfileData(userId);

            // If the user data is not already stored in the fetchedUsers object
            if (!fetchedUsers[userId]) {
              // Set rank, login, registeredDate, bestSpeed, ratingLevel, friends, cars, and avatarTimestamp
              fetchedUsers[userId] = {
                rank: mainTitle,
                login,
                registered: registeredDate,
                bestSpeed,
                ratingLevel,
                friends,
                cars,
                avatarTimestamp
              };
            } else {
              // Update the user's data
              fetchedUsers[userId].rank = mainTitle;
              fetchedUsers[userId].login = login;
              fetchedUsers[userId].registered = registeredDate;
              fetchedUsers[userId].bestSpeed = bestSpeed;
              fetchedUsers[userId].ratingLevel = ratingLevel;
              fetchedUsers[userId].friends = friends;
              fetchedUsers[userId].cars = cars;
              fetchedUsers[userId].avatarTimestamp = avatarTimestamp;
            }

            // Logging user action (enter or leave) using the formatted time
            if (retrievedLogin === userName) {
              if (actionType === 'enter') {
                fetchedUsers[userId].visits = (fetchedUsers[userId].visits || 0) + 1;
                fetchedUsers[userId].tracked = usersToTrack.some(u => u.name === retrievedLogin);
              }
            }

            // Get the rank info from getRankInfo, which now returns an object with class, color, and icon
            const { class: rankClass } = getRankInfo(mainTitle);  // Destructure the returned object to get the rank class

            // Check if the user with the same ID already exists in the corresponding rank group
            const existingUserElement = rankSubparents[rankClass].querySelector(`.user${userId}`);
            if (!existingUserElement) {
              const newUserElement = createUserChatElement(userId, mainTitle, userName, bestSpeed, userElement.classList.contains('revoked'));
              // Add the user to the corresponding rank group
              rankSubparents[rankClass].appendChild(newUserElement);
              // Make sure the mutation observer for the new users changed flag to false to make it work
              if (!isInitialObservation) addShakeEffect(newUserElement); // Add shake effect on entered users
            }

            // Update existing user IDs
            existingUserIds.add(userId);
          } catch (error) {
            console.error(`Error fetching profile summary for user ${userId}:`, error);
          }
        }
      }

      // Additional removal logic based on your provided code
      userListContainer.querySelectorAll('.chat-user-list [class^="user"]').forEach(userElement => {
        const userId = userElement.querySelector('.name').getAttribute('data-user');
        if (!existingUserIds.has(userId)) {
          userElement.remove();
        }
      });

      // Sorting logic (applied after all users are created)
      Object.values(rankSubparents).forEach(rankGroup =>
        [...rankGroup.children]
          .sort((a, b) =>
            (fetchedUsers[b.querySelector('.name')?.getAttribute('data-user')]?.bestSpeed || 0) -
            (fetchedUsers[a.querySelector('.name')?.getAttribute('data-user')]?.bestSpeed || 0)
          )
          .forEach(el => rankGroup.appendChild(el))
      );

      // Update localStorage outside the if conditions
      localStorage.setItem('fetchedUsers', JSON.stringify(fetchedUsers));

      // Call updateUserCountText to refresh user count display
      updateUserCountText();

    } catch (error) {
      console.error('Error refreshing user list:', error);
    }
  }




  // NEW CHAT USER LIST (END)


  // Define reference for chat user list
  const userList = document.querySelector('.userlist-content');

  // Initialize user tracking map
  let userMap = new Map(); // Store as [userId]: {userName, ...}
  let prevUserCount = 0;
  let isInitialObservation = true; // Initialize the flag for initial observation

  let isAnimated = false;

  function logUserAction(userId, actionType) {
    if (userId && actionType) {
      // Initialize user object and ensure actionLog is an array
      fetchedUsers[userId] = fetchedUsers[userId] || {};
      fetchedUsers[userId].actionLog = fetchedUsers[userId].actionLog || [];

      // Log the action
      fetchedUsers[userId].actionLog.push({
        type: actionType,
        timestamp: getCurrentTimeFormatted()
      });
    } else {
      console.error('Missing userId or actionType');
    }
  }

  /**
   * Updates the given user count element with the count, adjusting the font size based on the number of digits.
   * @param {HTMLElement} element - The DOM element displaying the user count.
   * @param {number} count - The user count.
   */
  function updateUserCount(element, count) {
    if (!element) return; // Exit if the element doesn't exist.
    const digits = count.toString().length;
    element.textContent = count;
    element.style.fontSize = Math.max(24 - (digits - 1) * 2, 12) + 'px';
  }

  // Function to animate user count change
  function animateUserCount(actualUserCount, userCountElement) {
    let count = 0;
    const speed = 20;

    const userCountIncrement = () => {
      if (count <= actualUserCount) {
        const progress = Math.min(count / (actualUserCount || 1), 1); // Handle zero case
        updateUserCount(userCountElement, count++);
        userCountElement.style.filter = `grayscale(${100 - progress * 100}%)`;
        setTimeout(userCountIncrement, speed);
      } else {
        addPulseEffect(userCountElement);
        isAnimated = true;
      }
    };

    setTimeout(userCountIncrement, speed);
  }

  // Mutation Observer for new users
  const chatUsersObserver = new MutationObserver(debounce((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const soundSwitcher = document.querySelector('#voice, #beep, #silence');
        const isSilence = soundSwitcher && soundSwitcher.id === 'silence';
        const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');
        const userCountElement = document.querySelector('.chat-user-count');

        if (chatHidden) {
          // If the chat is hidden, update the user count to 0 and exit early
          userCountElement.style.filter = "grayscale(100%)";
          userCountElement.textContent = "0";
          return;
        }

        // Build current user map
        const newUsers = new Map(
          Array.from(userList.children)
            .map(child => {
              const nameElement = child.querySelector('.name');
              const userId = nameElement?.getAttribute('data-user');
              const userName = nameElement?.textContent?.trim();
              return userId ? [userId, { userName }] : null;
            })
            .filter(Boolean) // Remove null entries
        );

        // Handle initial observation
        if (isInitialObservation) {
          if (userCountElement && Number(userCountElement.textContent) === 0 && !isAnimated) {
            animateUserCount(newUsers.size, userCountElement);
          }
          newUsers.forEach((value, key) => userMap.set(key, value));
          setTimeout(() => {
            isInitialObservation = false; // Mark the initial observation as complete
          }, 2000); // After a small delay
          return; // Skip processing for initial load
        }

        // Detect users who entered (exist in newUsers but not in userMap)
        let entered = [...newUsers].filter(([userId]) => !userMap.has(userId))
          .map(([userId, data]) => ({ userId, ...data }));

        // Detect users who left (exist in userMap but not in newUsers)
        let left = [...userMap].filter(([userId]) => !newUsers.has(userId))
          .map(([userId, data]) => ({ userId, userName: data.userName }));

        // Reassign userMap instead of clearing and repopulating it
        userMap = new Map(newUsers);

        // User count management
        const currentCount = userMap.size;
        if (currentCount !== prevUserCount && isAnimated) {
          updateUserCount(userCountElement, currentCount);
          userCountElement.style.filter = currentCount > 0 ? 'none' : 'grayscale(100%)';
          addPulseEffect(userCountElement);
        }

        // Common logic for processing both entered and left users
        function processUserAction(user, actionType) {
          const { userName, userId } = user;
          const userGender = getUserGender(userName);
          const isTracked = usersToTrack.some(u => u.name === userName && u.state === 'thawed');

          showUserAction(userName, actionType === "enter" ? icons.enterSVG : icons.leaveSVG, actionType === "enter");
          refreshUserList(userName, actionType);
          logUserAction(userId, actionType);

          if (!isSilence && isTracked) {
            userAction(userName, actionType, userGender);
          }
        }

        // Process entries
        entered.forEach(newUser => processUserAction(newUser, "enter"));

        // Process exits
        left.forEach(oldUser => processUserAction(oldUser, "leave"));


        prevUserCount = currentCount; // Update previous count for next mutation
      }
    });
  }, debounceTimeout));

  // Start observing
  chatUsersObserver.observe(userList, { childList: true });

  // Button to close the chat
  const chatCloseButton = document.querySelector('.mostright');

  // Event listener for mostright click event
  chatCloseButton.addEventListener('click', () => {
    // Trigger the logic you want to perform when the mostright button is clicked
    setTimeout(() => {
      // Check if the chat is not closed
      const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');
      if (chatHidden) {
        // Avoid "newMessagesObserver" run the call functions multiple times when the chat opens again
        isInitialized = false;
      } else {
        // Call the function to assign all the removing functionality again after the chat was closed
        executeMessageRemover();
        // Set chat field focus
        setChatFieldFocus();
        // Allow after "N" delay to run the "newMessagesObserver" call functions safely without repeating
        isInitialized = false;
        setTimeout(() => (isInitialized = false), 3000);
      }
    }, 300);
  });

  // Function to restore the chat state based on 'shouldShowPopupMessage' key in localStorage
  function restoreChatState() {
    // Main chat parent wrap element
    const chatMainWrapper = document.querySelector('#chat-fixed-placeholder');

    // Check if the key exists in localStorage
    if ('shouldShowPopupMessage' in localStorage) {
      // Retrieve the value from localStorage
      const shouldShowPopupMessage = JSON.parse(localStorage.getItem('shouldShowPopupMessage'));

      // Set the display property based on the retrieved value
      chatMainWrapper.style.display = shouldShowPopupMessage ? 'none' : 'unset';
    } else {
      // Default to 'none' if the key doesn't exist
      chatMainWrapper.style.display = 'none';
    }
  }

  // Call restoreChatState when needed, for example, on page load
  restoreChatState();

  // Check if the key exists in localStorage
  if (!('shouldShowPopupMessage' in localStorage)) {
    localStorage.setItem('shouldShowPopupMessage', false);
  }

  // Custom chat hider with hotkeys Ctr + Space
  document.addEventListener('keydown', (event) => {
    // Check if Ctrl key and Space key are pressed simultaneously
    if (event.ctrlKey && event.code === 'Space') {
      // Main chat parent wrap element
      const chatMainWrapper = document.querySelector('#chat-fixed-placeholder');
      // Check if the 'style' attribute is present
      const hasStyleAttribute = chatMainWrapper.hasAttribute('style');
      // Check if the 'display' property is set on chatMainWrapper element
      const isDisplayUnset = chatMainWrapper.style.display === 'unset';
      // Popup messages container element
      const popupMessagesContainer = document.querySelector('.popup-messages-container');

      // Toggle the display property
      if (hasStyleAttribute) {
        if (isDisplayUnset) {
          // Set the display property to 'none'
          chatMainWrapper.style.display = 'none';
          localStorage.setItem('shouldShowPopupMessage', true);
        } else {
          // Set the display property to 'unset'
          chatMainWrapper.style.display = 'unset';
          localStorage.setItem('shouldShowPopupMessage', false);

          // Retrieve the chat input field and length popup container based on the current URL
          const { inputField } = retrieveChatElementsByRoomType(); // Use your helper function

          // Check if inputField is valid before focusing
          if (inputField) {
            inputField.focus(); // Set focus to the chat input field
          } else {
            console.error('Input field not found. Cannot set focus.');
          }
        }
      } else {
        // Initial case: Set the display property to 'none'
        chatMainWrapper.style.display = 'none';
        localStorage.setItem('shouldShowPopupMessage', true);
      }

      // Remove the element with class 'popup-messages-container' if it exists and display is 'unset'
      if (popupMessagesContainer && hasStyleAttribute && isDisplayUnset) {
        popupMessagesContainer.remove();
      }
    }
  });

  // EVERY NEW MESSAGE READER

  // Initialize the variable to keep track of the last username seen
  let lastUsername = null;

  // Set the flag as false for the mention beep sound to trigger at first usual beep sound for usual messages
  let isMention = false;

  // Function to check if a username is mentioned in the message
  function isMentionForMe(message) {
    const messageLowercase = message.toLowerCase();
    return mentionKeywords.some(keyword => messageLowercase.includes(keyword.toLowerCase()));
  }

  function replaceWithPronunciation(text) {
    if (text === null) return text;

    // Combine all usernames that need replacement
    const allUsernames = [
      ...usersToTrack.map(user => user.name),
      ...usernameReplacements.map(replacement => replacement.original)
    ];

    // Create a pattern to match any character that is part of a word (including Cyrillic characters).
    const pattern = new RegExp(`(${allUsernames.join('|')})`, 'gu');

    return text.replace(pattern, (matched) => {
      // Priority 1: Check username replacements
      const replacement = usernameReplacements.find(r => r.original === matched);
      if (replacement) return replacement.replacement;

      // Priority 2: Check tracked user pronunciations
      const trackedUser = usersToTrack.find(user => user.name === matched);
      return trackedUser?.pronunciation || matched;
    });
  }



  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // Achromatic
    } else {
      const delta = max - min;
      s = l < 0.5 ? delta / (max + min) : delta / (2 - max - min);
      h = (
        max === r
          ? (g - b) / delta + (g < b ? 6 : 0)
          : max === g
            ? (b - r) / delta + 2
            : (r - g) / delta + 4
      ) / 6;
    }

    h = Math.round(h * 360); // Convert to degrees
    s = Math.min(Math.round(s * 100), 90); // Cap saturation at 90
    l = Math.round(l * 100); // Convert lightness to 0–100

    // Adjust hue to allow only 0–230 and 280–360 ranges
    if (h > 215 && h < 280) {
      h = h < 255 ? 215 : 280; // Shift to nearest valid range
    }

    return { h, s, l };
  };


  const hslToRgb = (h, s, l) => {
    s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) r = g = b = l * 255; // Achromatic
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        return t < 1 / 6 ? p + (q - p) * 6 * t :
          t < 1 / 2 ? q :
            t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 :
              p;
      };
      r = Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255);
      g = Math.round(hue2rgb(p, q, h / 360) * 255);
      b = Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255);
    }
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Normalize chat username color to be readable in the personal messages panel
  function normalizeUsernameColor(initialColor) {
    const [r, g, b] = initialColor.match(/\d+/g).map(Number);
    const { h, s, l } = rgbToHsl(r, g, b);

    // Adjust lightness to ensure it's at least 50
    const normalizedLightness = l < 50 ? 50 : l;
    const finalColor = hslToRgb(h, s, normalizedLightness);

    // Round the RGB values in one go
    return finalColor;
  }

  async function getLatestMessageData() {
    const messageElement = document.querySelector('.messages-content div p:last-of-type');
    if (!messageElement) return null;

    // Inline helper: collects text parts from a container's child nodes.
    const collectMessageParts = async (container) =>
      Array.from(container.childNodes)
        .map(node =>
          node.nodeType === Node.TEXT_NODE && node.textContent.trim() ? node.textContent.trim() :
            node.nodeName === 'IMG' && node.getAttribute('title') ? node.getAttribute('title') :
              node.nodeName === 'A' && node.getAttribute('href') ? node.getAttribute('href') : ''
        )
        .filter(Boolean);

    // 1. Extract common message text.
    let finalMessageText = (await collectMessageParts(messageElement)).join(' ').trim();
    let messageType = "common"; // Default message type

    // 2. Check for private messages
    const privateMessageContainer = messageElement.querySelector('.room.private');
    if (privateMessageContainer && privateMessageContainer.textContent.includes('[шепчет ')) {
      const privateMessageElement = messageElement.querySelector('span.private');
      if (privateMessageElement) {
        finalMessageText = (await collectMessageParts(privateMessageElement)).join(' ').trim();
        messageType = "private";
      }
    }

    // 3. Check for system messages
    const systemMessageElement = messageElement.querySelector('.system-message');
    if (systemMessageElement) {
      let systemMessageText = (await collectMessageParts(systemMessageElement)).join(' ').trim();
      systemMessageText = systemMessageText.replace(/<Клавобот>\s*/g, '');
      finalMessageText = systemMessageText;
      messageType = "system";
    }

    // 4. If still "common" and it mentions the user, mark as "mention".
    if (messageType === "common" && isMentionForMe(finalMessageText)) {
      messageType = "mention";
    }

    // Process localStorage: retrieve or initialize personalMessages.
    const personalMessages = JSON.parse(localStorage.getItem('personalMessages')) || {};
    const getCurrentDate = () => new Date().toLocaleDateString('en-CA');

    // Extract message metadata.
    const time = messageElement.querySelector('.time')?.textContent || 'N/A';
    const usernameDataElement = messageElement.querySelector('.username span[data-user]');
    const userId = usernameDataElement ? usernameDataElement.getAttribute('data-user') : null;
    const extractedUsername = usernameDataElement ? usernameDataElement.textContent : 'SYSTEM';
    const usernameColor = usernameDataElement ? usernameDataElement.parentElement.style.color : 'rgb(180,180,180)';
    const normalizedColor = normalizeUsernameColor(usernameColor);
    const messageKey = `${time}_${extractedUsername}`;

    // Check if the message type is "mention" or "private", and if the username is not in the ignore list
    const shouldSaveMessage = (
      messageType === "mention" ||
      messageType === "private"
    ) && !ignored.includes(extractedUsername);

    // If the condition is met, save the message to localStorage
    if (shouldSaveMessage) {
      personalMessages[messageKey] = {
        time,
        date: getCurrentDate(),
        username: extractedUsername,
        usernameColor: normalizedColor,
        message: finalMessageText,
        type: messageType,
        userId
      };
      localStorage.setItem('personalMessages', JSON.stringify(personalMessages));
    }

    // Extract username (defaulting to "SYSTEM") and build prefix.
    const usernameContainer = messageElement.querySelector('.username');
    const usernameText = usernameContainer ? usernameContainer.textContent.replace(/[<>]/g, '') : 'SYSTEM';

    highlightMentionWords(); // Apply highlight for all message types

    let prefix = (messageType === "mention" || messageType === "private")
      ? `${replaceWithPronunciation(usernameText)} обращается: `
      : (usernameText !== lastUsername ? `${replaceWithPronunciation(usernameText)} пишет: ` : "");

    lastUsername = usernameText;

    const messageText = prefix + replaceWithPronunciation(finalMessageText);
    return { messageText, usernameText };
  }

  // Prevent the "readNewMessages" function from being called multiple times until all messages in the set have been read
  let isReading = false;

  // Create a Set to store the new messages
  const newMessages = new Set();

  // This function adds a new message to the Set and triggers the "readNewMessages" function if the Set was empty before
  function addNewMessage(message) {
    // Check if the new message is not already in the Set
    if (!newMessages.has(message)) {
      // Add the new message to the Set
      newMessages.add(message);
      // If the "readNewMessages" function is not already in progress, trigger it
      if (!isReading) {
        // Change the flag to true to be initialized accent beep sound for mention message
        isReading = true;
        readNewMessages();
      }
    }
  }

  // This function reads the new messages from the Set and removes them after reading
  async function readNewMessages() {
    // Read each message in sequence from the Set
    for (let message of newMessages) {
      // Call the textToSpeech function to read the message
      await textToSpeech(message, voiceSpeed);
      // Remove the message from the Set after reading
      newMessages.delete(message);
    }
    // Set the isReading flag to false after reading all messages
    isReading = false;
  }



  function applyChatMessageGrouping() {
    // Get the messages container element
    const messagesContainer = document.getElementById('chat-content');

    // Get all the chat message elements from the messages container
    const chatMessages = messagesContainer.querySelectorAll('.messages-content div p');

    // Initialize variables
    let previousUser = null;
    let isFirstMessage = true;
    let spacing = '14px';

    // Loop through the chat messages
    for (let i = 0; i < chatMessages.length; i++) {
      const message = chatMessages[i];
      const usernameElement = message.querySelector('span.username');

      // Check if it's a system message with the "system-message" class
      const isSystemMessage = message.querySelector('.system-message');

      if (isSystemMessage) {
        // Apply margins to system messages
        message.style.marginTop = spacing;
        message.style.marginBottom = spacing;
      } else if (usernameElement) { // Check if the message contains a username
        // Get the username from the current message
        const usernameElementWithDataUser = usernameElement.querySelector('span[data-user]');

        if (!usernameElementWithDataUser) {
          continue; // Skip messages without a data-user element
        }

        let usernameText = usernameElementWithDataUser.textContent;

        // Remove the "<" and ">" symbols from the username if they are present
        usernameText = usernameText.replace(/</g, '').replace(/>/g, '');

        // Apply margin-top for the first message or when the user changes
        if (previousUser === null || usernameText !== previousUser) {
          // Check if it's not the first message overall
          if (!isFirstMessage) {
            // Add margin-top to create separation between the current message and the previous message
            message.style.marginTop = spacing;
          }
        } else {
          // Check if it's not the first message of the current user
          if (!isFirstMessage) {
            // Remove the margin-bottom property from the current message to remove any previously set margin
            message.style.removeProperty('margin-bottom');
          }
        }

        // Check if there is a next message
        const hasNextMessage = i < chatMessages.length - 1;

        // Check if there is a next message and it contains a username
        if (hasNextMessage) {
          const nextMessage = chatMessages[i + 1];
          const nextUsernameElement = nextMessage.querySelector('span.username');

          if (nextUsernameElement) {
            const nextUsernameElementWithDataUser = nextUsernameElement.querySelector('span[data-user]');

            if (!nextUsernameElementWithDataUser) {
              continue; // Skip messages without a data-user element
            }

            // Get the username from the next message
            const nextUsernameText = nextUsernameElementWithDataUser.textContent;

            // Apply margin-bottom for the last message of each user
            if (usernameText !== nextUsernameText) {
              message.style.marginBottom = spacing;
            }
          }
        }

        // Update the previousUser variable to store the current username
        previousUser = usernameText;
        // Set isFirstMessage to false to indicate that this is not the first message overall
        isFirstMessage = false;
      }
    }
  }

  // Call the function to apply chat message grouping
  applyChatMessageGrouping();

  // Time difference threshold (in milliseconds) to identify spam
  const timeDifferenceThreshold = 400;
  // Message limit per timeDifferenceThreshold
  const messageLimit = 1;
  // Object to track user-specific data
  let userChatData = {};
  // Maximum number of consecutive times a user is allowed to exceed the message limit
  const thresholdMaxTries = 10;

  // Function to format time difference
  function formatTimeDifference(difference) {
    // Define time units
    const units = ['hour', 'minute', 'second', 'millisecond'];

    // Calculate values for each time unit
    const values = [
      Math.floor(difference / (1000 * 60 * 60)), // hours
      Math.floor((difference / (1000 * 60)) % 60), // minutes
      Math.floor((difference / 1000) % 60), // seconds
      difference % 1000 // milliseconds
    ];

    // Map each non-zero value to a formatted string with its corresponding unit
    const formattedStrings = values
      .map((value, index) => (value > 0 ? `${value} ${units[index]}${value > 1 ? 's' : ''}` : ''));

    // Filter out empty strings (units with a value of 0) and join the remaining strings
    const formattedTime = formattedStrings
      .filter(Boolean)
      .join(' ');

    // Return the formatted time string
    return formattedTime;
  }

  // Helper function to remove all messages by a user
  function removeUserMessages(userId) {
    const userMessages = document.querySelectorAll(`.messages-content span[data-user="${userId}"]`);
    userMessages.forEach(message => {
      const pTag = message.closest('p');
      if (pTag) {
        pTag.remove();
      }
    });
  }

  const digits = '0-9';
  const whitespaces = '\\s';
  const latinChars = 'a-zA-Z';
  const cyrillicChars = 'а-яА-ЯёЁ';
  const commonSymbols = '!@#$%^&*()-_=+[\\]{}|;:\'",.<>/?`~';

  // Special symbols as characters
  const copyrightSymbol = '\\u00A9'; // ©
  const trademarkSymbol = '\\u2122'; // ™
  const registeredSymbol = '\\u00AE'; // ®
  const leftDoubleAngleQuote = '\\u00AB'; // «
  const rightDoubleAngleQuote = '\\u00BB'; // »
  const plusMinus = '\\u00B1'; // ±
  const multiplication = '\\u00D7'; // ×
  const division = '\\u00F7'; // ÷
  const degreeSymbol = '\\u00B0'; // °
  const notEqual = '\\u2260'; // ≠
  const lessThanOrEqual = '\\u2264'; // ≤
  const greaterThanOrEqual = '\\u2265'; // ≥
  const infinity = '\\u221E'; // ∞
  const euroSymbol = '\\u20AC'; // €
  const poundSymbol = '\\u00A3'; // £
  const yenSymbol = '\\u00A5'; // ¥
  const sectionSymbol = '\\u00A7'; // §
  const bulletPoint = '\\u2022'; // •
  const ellipsis = '\\u2026'; // …
  const minus = '\\u2212'; // −
  const enDash = '\\u2013'; // –
  const emDash = '\\u2014'; // —

  // Arrow and Mathematical symbols as Unicode escape sequences
  const leftArrow = '\\u2190'; // ←
  const rightArrow = '\\u2192'; // →
  const upArrow = '\\u2191'; // ↑
  const downArrow = '\\u2193'; // ↓

  const half = '\\u00BD'; // ½
  const oneThird = '\\u2153'; // ⅓
  const twoThirds = '\\u2154'; // ⅔

  const summation = '\\u2211'; // ∑
  const acuteAccent = '\\u00B4'; // ´

  const emojiRanges = '\\uD83C-\\uDBFF\\uDC00-\\uDFFF';

  // Initialized to store characters found in a message that are not allowed
  let disallowedChars = null;

  function messageContainsAllowedChars(message) {
    const allowedCharsRegex = new RegExp(
      `[${digits}${latinChars}${cyrillicChars}${whitespaces}${commonSymbols}` +
      `${copyrightSymbol}${trademarkSymbol}${registeredSymbol}${leftDoubleAngleQuote}${rightDoubleAngleQuote}` +
      `${plusMinus}${multiplication}${division}${degreeSymbol}${notEqual}${lessThanOrEqual}${greaterThanOrEqual}` +
      `${infinity}${euroSymbol}${poundSymbol}${yenSymbol}${sectionSymbol}${bulletPoint}${ellipsis}${minus}${enDash}${emDash}` +
      `${leftArrow}${rightArrow}${upArrow}${downArrow}${half}${oneThird}${twoThirds}${summation}` +
      `${acuteAccent}${emojiRanges}]+`, 'gu' // previous 'g'
    );

    const allowedChars = message.match(allowedCharsRegex);

    if (allowedChars && allowedChars.join('') === message) {
      return true;
    } else {
      disallowedChars = message.replace(allowedCharsRegex, '');
      return false;
    }
  }

  // Helper function to handle threshold check
  function handleThresholdExceeded(userId, generateLogUserInfo) {
    if (userChatData[userId].thresholdMaxTries >= thresholdMaxTries) {
      // Set 'banned' to true after passing the max thresholdMaxTries to remove user messages passing the messages limit checking
      userChatData[userId].banned = true;
      console.log(generateLogUserInfo(), 'color: pink');
      console.log(`%c${userChatData[userId].userName} cannot send messages anymore`, 'color: pink');
    }
  }

  // Function to track and handle spam messages
  function banSpammer() {
    // Get the current timestamp
    const currentTime = new Date().getTime();

    // Select the last p element in the chat
    const latestMessage = document.querySelector('.messages-content p:last-child');

    if (latestMessage) {
      // Get user ID from the last message
      const userIdElement = latestMessage.querySelector('span[data-user]');
      const userId = userIdElement ? userIdElement.getAttribute('data-user') : null;

      // Initialize user-specific data outside the if block
      if (!userChatData[userId]) {
        userChatData[userId] = {
          messagesCount: 0,
          thresholdMaxTries: 0,
          time: currentTime,
          userName: userIdElement ? userIdElement.textContent : 'Unknown User',
          previousTime: null,
          firstInteraction: true,
          banned: false
        };
      }

      // Calculate time difference
      const timeDifference = currentTime - userChatData[userId].time;

      // Function to generate log information dynamically
      function generateLogUserInfo() {
        return `%cID: ${userId}, Name: ${userChatData[userId].userName}, ` +
          `Time Difference: ${formatTimeDifference(timeDifference)}, ` +
          `Messages Count: ${userChatData[userId].messagesCount}, ` +
          `Spam Tries: ${userChatData[userId].thresholdMaxTries}, ` +
          `Banned: ${userChatData[userId].banned}`;
      }

      // Check if the message contains not allowed chars
      if (!messageContainsAllowedChars(latestMessage.textContent, userId) && !userChatData[userId].banned) {
        // Increase thresholdMaxTries on every limit pass
        userChatData[userId].thresholdMaxTries++;
        // If the message contains not allowed chars, log the information
        console.log(
          `%c${userChatData[userId].userName} has sent a message with not allowed characters ${disallowedChars}.
          Threshold: ${userChatData[userId].thresholdMaxTries}.`,
          'color: orange;'
        );
        handleThresholdExceeded(userId, generateLogUserInfo);
      }

      // Special handling for the first interaction
      if (userChatData[userId].firstInteraction) {
        console.log(`%c${userChatData[userId].userName} posted the first message for the current chat session.`, 'color: yellow');
        userChatData[userId].firstInteraction = false;
      }

      // Check if the user is banned
      else if (userChatData[userId].banned) {
        // Remove all the messages by that user continuously until banned
        removeUserMessages(userId);
      } else {
        if (timeDifference < timeDifferenceThreshold) {
          // Check if the time difference is less than the threshold
          userChatData[userId].messagesCount++;

          if (userChatData[userId].messagesCount > messageLimit) {
            // Remove all messages by that user if messages limit was exceeded
            removeUserMessages(userId);

            // Increase thresholdMaxTries on every limit pass
            userChatData[userId].thresholdMaxTries++;

            handleThresholdExceeded(userId, generateLogUserInfo);

            // Log the information immediately after updating the values if not banned
            if (!userChatData[userId].banned) {
              console.log(generateLogUserInfo(), 'color: red');
            }
          } else {
            // Log the information immediately after updating the values if not banned and not exceeding the limit
            console.log(generateLogUserInfo(), 'color: green');
          }
        } else {
          // If none of the above conditions are met, update user-specific data for the current interaction
          userChatData[userId].previousTime = userChatData[userId].time;
          userChatData[userId].time = currentTime;
          userChatData[userId].messagesCount = 1;

          // Log the information immediately after updating the values if not banned and not exceeding the limit
          console.log(generateLogUserInfo(), 'color: green');
        }
      }
    }
  }


  // POPUP MESSAGES START

  // Set the maximum number of popup messages to display globally
  const maxPopupMessagesCount = 10;

  // Define an object to store the hue for each username
  const usernameHueMap = {};
  // Increase step for noticeable color changes
  const hueStep = 15;

  // Define the function to show popup messages when the main chat is hidden by hotkeys Ctrl + Space (only)
  function showPopupMessage() {
    // Check if the key 'shouldShowPopupMessage' exists and has a value of true
    const shouldShowPopupMessage = localStorage.getItem('shouldShowPopupMessage');

    // Stop execution if shouldShowPopupMessage is false
    if (shouldShowPopupMessage !== 'true') {
      return;
    }

    // Get the last message in the chat
    const latestMessage = document.querySelector('.messages-content p:last-of-type');

    if (latestMessage) {
      // Extract elements for time and username from the latest message
      const time = latestMessage.querySelector('.time');
      const username = latestMessage.querySelector('.username');

      const nodes = Array.from(latestMessage.childNodes);
      const elements = nodes.map(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          return { type: 'text', value: node.nodeValue.replace(/ /g, '\u00A0') }; // Replace spaces with Unicode non-breaking space
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName.toLowerCase() === 'a' && node.classList.contains('private')) {
            return { type: 'text', value: '📢\u00A0' };
          }
          if (node.tagName.toLowerCase() === 'span' && node.classList.contains('private')) {
            return { type: 'text', value: node.textContent.replace(/ /g, '\u00A0') };
          }
          if (node.tagName.toLowerCase() === 'img') {
            return { type: 'img', title: node.getAttribute('title') };
          }
          if (node.tagName.toLowerCase() === 'a') {
            return { type: 'anchor', href: node.getAttribute('href') };
          }
        }
      }).filter(Boolean);

      // Extract relevant data from the time and username elements
      const cleanTime = time.textContent.replace(/[\[\]]/g, '');
      const cleanUsername = username.textContent.replace(/[<>]/g, '');

      // Check if the hue for this username is already stored
      let hueForUsername = usernameHueMap[cleanUsername];

      // If the hue is not stored, generate a new random hue with the specified step
      if (!hueForUsername) {
        hueForUsername = Math.floor(Math.random() * (360 / hueStep)) * hueStep;
        // Store the generated hue for this username
        usernameHueMap[cleanUsername] = hueForUsername;
      }

      // Create or get the main container for all messages
      let popupMessagesContainer = document.querySelector('.popup-messages-container');
      if (!popupMessagesContainer) {
        popupMessagesContainer = document.createElement('div');
        popupMessagesContainer.classList.add('popup-messages-container');
        document.body.appendChild(popupMessagesContainer);
      }

      // Check if the total number of messages in the container exceeds the maximum
      if (popupMessagesContainer.childElementCount >= maxPopupMessagesCount) {
        // Get the oldest message
        const oldestMessage = popupMessagesContainer.firstChild;

        // Apply a CSS class to initiate the fade-out animation
        oldestMessage.classList.add('fade-out');

        // After the animation duration, remove the message from the DOM
        setTimeout(() => {
          popupMessagesContainer.removeChild(oldestMessage);
        }, 300); // Adjust the time to match your CSS animation duration
      }

      // Create a container div for each message
      const popupChatMessage = document.createElement('div');
      popupChatMessage.classList.add('popup-chat-message');
      // Apply the hue-rotate filter to the entire message container
      popupChatMessage.style.filter = `hue-rotate(${hueForUsername}deg)`;

      // Append time SVG icon before the time
      const timeIcon = document.createElement('div');
      timeIcon.classList.add('time-icon');
      timeIcon.innerHTML = icons.clockSVG;

      // Append spans for each part with respective classes
      const timeElement = document.createElement('div');
      timeElement.classList.add('time');
      timeElement.textContent = cleanTime;

      // Append user SVG icon after the time
      const userIcon = document.createElement('div');
      userIcon.classList.add('user-icon');
      userIcon.innerHTML = icons.userSVG;

      const usernameElement = document.createElement('div');
      usernameElement.classList.add('username');
      usernameElement.textContent = cleanUsername;

      // Append action SVG icon after the username
      const actionIcon = document.createElement('div');
      actionIcon.classList.add('action-icon');
      actionIcon.innerHTML = icons.actionSVG;

      const messageElement = document.createElement('div');
      messageElement.classList.add('message');

      // Append elements to the message container
      popupChatMessage.appendChild(timeIcon);
      popupChatMessage.appendChild(timeElement);
      popupChatMessage.appendChild(userIcon);
      popupChatMessage.appendChild(usernameElement);
      popupChatMessage.appendChild(actionIcon);
      popupChatMessage.appendChild(messageElement);

      // Fill the message container with text, images, and anchors
      elements.forEach(element => {
        const elementContainer = document.createElement('div');

        if (element.type === 'text') {
          elementContainer.textContent = element.value;
        } else if (element.type === 'img') {
          elementContainer.innerHTML = `&nbsp;${element.title}&nbsp;`;
        } else if (element.type === 'anchor') {
          elementContainer.innerHTML = `&nbsp;${element.href}&nbsp;`;
        }

        messageElement.appendChild(elementContainer);
      });

      // Append the message container to the main container
      popupMessagesContainer.appendChild(popupChatMessage);
    }
  }

  // POPUP MESSAGES END

  // Function to convert Cyrillic characters to Latin
  function convertCyrillicToLatin(input) {
    const cyrillicToLatinMap = {
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
      'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
      'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
      'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
      'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
      'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': 'y', // 'ъ' maps to 'y'
      'Ы': 'Y', 'Ь': 'i', // 'ь' maps to 'i'
      'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
      'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
      'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
      'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
      'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
      'ш': 'sh', 'щ': 'shch', 'ъ': 'y', // 'ъ' maps to 'y'
      'ы': 'y', 'ь': 'i', // 'ь' maps to 'i'
      'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    // Convert the input string to Latin using the mapping
    return input.split('').map(char => cyrillicToLatinMap[char] || char).join('');
  }

  // Function to convert Russian usernames
  function convertRussianUsernameToLatin(username) {
    // Use the conversion function on the username
    return convertCyrillicToLatin(username);
  }

  // Skip reading the messages on page load to read them normally when the user is present and the page is stable
  let isInitialized = false;
  // Define the maximum number of messages per user
  const maxMessagesPerUser = 5;

  // Function to remove all messages from users in the ignored
  function removeIgnoredUserMessages() {
    document.querySelectorAll('.messages-content p').forEach(message => {
      const usernameElement = message.querySelector('.username'); // Adjust selector if needed
      const username = usernameElement?.textContent?.replace(/[<>]/g, '') || null;

      if (username && ignored.includes(username)) {
        // console.log(`Hidden message from ignored user: ${username}`);
        // Convert Cyrillic username to Latin
        const latinUsername = convertRussianUsernameToLatin(username);
        message.classList.add('ignored-user', latinUsername);
        message.style.display = 'none'; // Hide the message
      }
    });
  }

  // Function to play sound as a notification for system message banned
  function playSound() {
    const marioGameOver = 'https://github.com/VimiummuimiV/Sounds/raw/refs/heads/main/Mario_Game_Over.mp3';
    const audio = new Audio(marioGameOver);
    audio.play();
  }

  // Function to detect a ban message based on the message text content
  function isBanMessage(messageText) {
    if (!messageText) return false; // Return false if messageText is null, undefined, or an empty string
    return ['Клавобот', 'Пользователь', 'заблокирован'].every(word => messageText.includes(word));
  }

  /**
   * Normalizes the color of usernames and resets their filter based on the specified mode.
   *
   * @param {NodeList|Element} usernameElements - A NodeList of username elements or a single username element.
   * @param {string} mode - The mode of operation; either 'one' to process a single username or 'all' to process multiple.
   */
  function normalizeAndResetUsernames(usernameElements, mode) {
    if (!usernameElements) return; // Skip processing if undefined or null

    if (mode === 'one') {
      // Process a single username element.
      const userSpan = usernameElements.querySelector('span[data-user]');
      if (!userSpan) return; // Skip processing if child span is missing
      const computedColor = getComputedStyle(usernameElements).color;
      const normalizedColor = normalizeUsernameColor(computedColor);
      usernameElements.style.setProperty('color', normalizedColor, 'important');
      userSpan.style.setProperty('filter', 'invert(0)', 'important');
    } else if (mode === 'all') {
      // Process all username elements using forEach with return (which acts like continue)
      Array.from(usernameElements).forEach(usernameElement => {
        if (!usernameElement) return; // Skip this iteration if the element is falsy
        const userSpan = usernameElement.querySelector('span[data-user]');
        if (!userSpan) return; // Skip if child span is missing
        const computedColor = getComputedStyle(usernameElement).color;
        const normalizedColor = normalizeUsernameColor(computedColor);
        usernameElement.style.setProperty('color', normalizedColor, 'important');
        userSpan.style.setProperty('filter', 'invert(0)', 'important');
      });
    } else {
      console.error("Invalid mode. Use 'one' or 'all'.");
    }
  }

  // Create a mutation observer to watch for new messages being added
  const newMessagesObserver = new MutationObserver(async mutations => {
    // If isInitialized is false, return without doing anything
    if (!isInitialized) {
      isInitialized = true;

      // Normalize chat usernames color for dark theme
      const allUsernameElements = document.querySelectorAll('.username'); // Get all username elements
      normalizeAndResetUsernames(allUsernameElements, 'all'); // Process all username elements

      return; // Stop processing further
    }

    for (let mutation of mutations) {
      if (mutation.type === 'childList') {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P') {
            const singleUsernameElement = node.querySelector('.username'); // Get a single username element
            if (singleUsernameElement) normalizeAndResetUsernames(singleUsernameElement, 'one'); // Process the single username element

            // Retrieve the previous message text from localStorage
            const previousMessageText = localStorage.getItem('previousMessageText');

            // Get the latest message data (returns only messageText and usernameText)
            const latestMessageData = await getLatestMessageData();
            const currentMessageText = latestMessageData?.messageText || null;
            const currentMessageUsername = latestMessageData?.usernameText || null;
            console.log(currentMessageText);

            // Convert Cyrillic username to Latin
            const latinUsername = convertRussianUsernameToLatin(currentMessageUsername);

            // Check for a ban message and play sound if detected
            if (isBanMessage(currentMessageText)) {
              console.log('Ban message detected:', currentMessageText);
              playSound();
            }

            // Hide message if the username is in the ignored list
            if (currentMessageUsername && ignored.includes(currentMessageUsername)) {
              node.classList.add('ignored-user', latinUsername);
              node.style.display = 'none';
              continue;
            }

            // Get sound switcher and message mode elements
            const soundSwitcher = document.querySelector('#voice, #beep, #silence');
            const isVoice = soundSwitcher && soundSwitcher.id === 'voice';
            const isBeep = soundSwitcher && soundSwitcher.id === 'beep';
            const messageMode = document.querySelector('#every-message, #mention-message');
            const isEveryMessageMode = messageMode && messageMode.id === 'every-message';
            const isMentionMessageMode = messageMode && messageMode.id === 'mention-message';

            // Check if the message contains a private indicator
            const privateMessageIndicator = '[шепчет вам]';
            const privateMessageContainer = node.querySelector('.room.private');
            const isPrivateMessage = privateMessageContainer && privateMessageContainer.textContent.includes(privateMessageIndicator);

            // If voice mode is enabled and the message is new, trigger text-to-speech
            if (isVoice && isInitialized && currentMessageText && currentMessageText !== previousMessageText) {
              localStorage.setItem('previousMessageText', currentMessageText);
              if (currentMessageUsername && !currentMessageUsername.includes(myNickname)) {
                const shouldRead = isEveryMessageMode || (isMentionMessageMode && isMention) || isPrivateMessage;
                if (shouldRead) {
                  addNewMessage(currentMessageText);
                }
              }
            }

            // If beep mode is enabled and the message is new, play beep sound
            if (isBeep && isInitialized && currentMessageText && currentMessageText !== previousMessageText) {
              localStorage.setItem('previousMessageText', currentMessageText);
              if (currentMessageUsername && !currentMessageUsername.includes(myNickname)) {
                const shouldBeep = isEveryMessageMode || (isMentionMessageMode && isMention) || isPrivateMessage;
                if (shouldBeep) {
                  const useMentionFrequency = !isEveryMessageMode || isMention;
                  playBeep(useMentionFrequency ? mentionMessageFrequencies : usualMessageFrequencies, beepVolume);
                  if (isMention) isMention = false;
                }
              }
            }

            // If the page is initialized, perform various UI updates and processing
            if (isInitialized) {
              attachEventsToMessages();
              convertImageLinksToImage('generalMessages');
              convertVideoLinksToPlayer('generalMessages');
              processEncodedLinks('generalMessages');
              applyChatMessageGrouping();
              scrollMessagesToBottom();
              banSpammer();
              showPopupMessage();
              updatePersonalMessageCounts();
            }
          }
        }
      }
    }
  });

  // Observe changes to the messages container element
  const messagesContainer = document.querySelector('.messages-content div');
  newMessagesObserver.observe(messagesContainer, { childList: true, subtree: true });


  // SOUND GRAPHICAL SWITCHER

  // Declare variables for the sound switcher button and its icon
  let soundSwitcher, soundSwitcherIcon;
  // Declare variables for the message mode button and its icon
  let messageMode, messageModeIcon;

  function addJumpEffect(element, initialTranslateX = 0, initialTranslateY = 0) {
    // Define keyframes with specified percentages, scale effect, and calc for Y translation
    const keyframes = [
      { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}%)) scale(1)` }, // 0%
      { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% - 60%)) scale(1.1)` }, // 20%
      { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% + 15%)) scale(1)` }, // 40%
      { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% - 20%)) scale(1.05)` }, // 60%
      { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% + 8%)) scale(1)` }, // 75%
      { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% - 10%)) scale(1.05)` }, // 85%
      { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% + 4%)) scale(1)` }, // 92%
      { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}%)) scale(1)` } // 100%
    ];

    // Animation options
    const options = {
      duration: 500, // Total animation duration in ms (adjust as needed)
      easing: 'ease', // Smooth easing between keyframes
      iterations: 1 // Play once
    };

    // Start the animation
    const animation = element.animate(keyframes, options);

    // Optional: Return a promise that resolves when animation completes
    return animation.finished;
  }

  // Helper function to add shake effect
  function addShakeEffect(element) {
    element.classList.add('shake-effect');
    setTimeout(() => {
      element.classList.remove('shake-effect');
    }, 500);
  }

  // CREATE SOUND SWITCHER BUTTON (START)

  function createSoundSwitcherButton() {
    // Create a new element with class 'sound-switcher-button' and id 'silence'
    soundSwitcher = document.createElement('div');
    // Retrieve the value from localStorage key "messageNotificationState"
    const messageNotificationState = KG_Chat_Empowerment.messageSettings.messageNotificationState || 'silence';
    // Add the class 'sound-switcher-button' to the 'soundSwitcher' element
    soundSwitcher.classList.add("empowerment-button", "sound-switcher-button");
    // Initial button id if the localStorage key isn't created with assigned value by user
    soundSwitcher.id = messageNotificationState;
    // Retrieve the value from localStorage key "messageNotificationTitle"

    // Retrieve the value from KG_Chat_Empowerment.messageSettings.messageNotificationTitle
    const messageNotificationTitle = KG_Chat_Empowerment.messageSettings.messageNotificationTitle || 'Do not disturb';
    // Assign title for the current notification state
    soundSwitcher.title = messageNotificationTitle;

    // Create sound switcher button icon container
    soundSwitcherIcon = document.createElement('span');
    // Add class to icon container
    soundSwitcherIcon.classList.add('sound-switcher-icon');

    // Append icon container inside sound switcher button
    soundSwitcher.appendChild(soundSwitcherIcon);
    // Append sound switcher button to chat buttons panel
    empowermentButtonsPanel.appendChild(soundSwitcher);
  } createSoundSwitcherButton();

  // Add the isAltKeyPressed condition to the soundSwitcher event listener
  soundSwitcher.addEventListener('click', function (event) {
    // Only execute the code if both isCtrlKeyPressed and isAltKeyPressed are false
    if (!isCtrlKeyPressed && !isAltKeyPressed) {

      // Get progress bar elements if they exist in the DOM
      let currentVoiceSpeed = document.querySelector('.current-voice-speed');
      let currentVoicePitch = document.querySelector('.current-voice-pitch');

      // Remove voice speed setting progress bar
      if (currentVoiceSpeed) {
        currentVoiceSpeed.remove();
      }

      // Remove voice pitch setting progress bar
      if (currentVoicePitch) {
        currentVoicePitch.remove();
      }

      // Add pulse effect for soundSwitcher
      addPulseEffect(this);

      switch (this.id) {
        case 'silence':
          this.id = 'beep';
          this.title = 'Notify with beep signal';
          KG_Chat_Empowerment.messageSettings.messageNotificationState = 'beep';
          KG_Chat_Empowerment.messageSettings.messageNotificationTitle = 'Notify with beep signal';
          break;
        case 'beep':
          this.id = 'voice';
          this.title = 'Notify with voice API';
          KG_Chat_Empowerment.messageSettings.messageNotificationState = 'voice';
          KG_Chat_Empowerment.messageSettings.messageNotificationTitle = 'Notify with voice API';
          break;
        case 'voice':
          this.id = 'silence';
          this.title = 'Do not disturb';
          KG_Chat_Empowerment.messageSettings.messageNotificationState = 'silence';
          KG_Chat_Empowerment.messageSettings.messageNotificationTitle = 'Do not disturb';
          break;
      }
      // Stringify KG_Chat_Empowerment before updating in localStorage
      localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));

      updateSoundSwitcherIcon();
    }
  });

  function updateSoundSwitcherIcon() {
    switch (soundSwitcher.id) {
      case 'silence':
        soundSwitcherIcon.innerHTML = icons.silenceSVG;
        break;
      case 'beep':
        soundSwitcherIcon.innerHTML = icons.beepSVG;
        break;
      case 'voice':
        soundSwitcherIcon.innerHTML = icons.voiceSVG;
        break;
    }
  } updateSoundSwitcherIcon();

  // This function combines the results of the above functions to return an object
  // with both the speed and pitch percentages as strings with a "%" sign appended.
  function getVoiceSettingsPercentage() {
    const speedPercent = ((voiceSpeed - minVoiceSpeed) / (maxVoiceSpeed - minVoiceSpeed)) * 100;
    const pitchPercent = ((voicePitch - minVoicePitch) / (maxVoicePitch - minVoicePitch)) * 100;

    return {
      speed: `${speedPercent}%`,
      pitch: `${pitchPercent}%`,
    };
  }

  /*
  * Shows the current voice speed or pitch as a span element with appropriate styles.
  * If the Ctrl key is pressed, displays the current voice speed.
  * If the Alt key is pressed, displays the current voice pitch.
  */
  function showVoiceSettings() {
    let voiceSettings = document.querySelector('.voice-settings');
    let currentVoiceSpeed = document.querySelector('.current-voice-speed');
    let currentVoicePitch = document.querySelector('.current-voice-pitch');

    if (isCtrlKeyPressed) {
      // Create voiceSettings if it doesn't exist
      if (!voiceSettings) {
        voiceSettings = document.createElement('div');
        voiceSettings.classList.add('voice-settings');
        soundSwitcher.appendChild(voiceSettings);
        void voiceSettings.offsetWidth;
        voiceSettings.style.opacity = '1';
      }

      // Remove currentVoicePitch if it exists
      if (currentVoicePitch) {
        currentVoicePitch.remove();
      }

      // Create currentVoiceSpeed if it doesn't exist
      if (!currentVoiceSpeed) {
        currentVoiceSpeed = document.createElement('span');
        currentVoiceSpeed.classList.add('current-voice-speed');
        voiceSettings.appendChild(currentVoiceSpeed);
      }

      // Create progress text info for voice speed
      let voiceSpeedInfo = voiceSettings.querySelector('.current-voice-speed .voice-value-info');
      if (!voiceSpeedInfo) {
        voiceSpeedInfo = document.createElement('span');
        voiceSpeedInfo.classList.add("voice-speed", "voice-value-info");
        voiceSettings.querySelector('.current-voice-speed').appendChild(voiceSpeedInfo);
      }

      if (voiceSpeedInfo) {
        // Set the text content of voice speed
        if (voiceSpeed <= minVoiceSpeed || voiceSpeed >= maxVoiceSpeed) {
          voiceSpeedInfo.innerHTML = icons.rangeIsOutSVG;
        } else {
          voiceSpeedInfo.innerHTML = `SPEED ${Number(voiceSpeed).toFixed(1)}`;
        }
      }

      // Create a new progress element if it doesn't exist for speed
      let voiceSpeedProgress = voiceSettings.querySelector('.current-voice-speed .voice-speed-progress');
      if (!voiceSpeedProgress) {
        voiceSpeedProgress = document.createElement('span');
        voiceSpeedProgress.classList.add('voice-speed-progress');
        // Create the progress fill element
        let fill = document.createElement('span');
        fill.classList.add('voice-speed-progress-fill');
        // Append the fill element to the progress element
        voiceSpeedProgress.appendChild(fill);
        // Append the progress element to the current voice speed container
        voiceSettings.querySelector('.current-voice-speed').appendChild(voiceSpeedProgress);
      }

      // Update progress fill width based on voice speed percentage
      voiceSpeedProgress.querySelector('.voice-speed-progress-fill').style.width = getVoiceSettingsPercentage().speed;

      // Clear any existing timeout on voiceSettings and set a new one
      if (voiceSettings.timeoutId) {
        clearTimeout(voiceSettings.timeoutId);
      }

      voiceSettings.timeoutId = setTimeout(() => {
        voiceSettings.style.opacity = '0';
        setTimeout(() => {
          voiceSettings.remove();
        }, 500);
      }, 2000);

    } else if (isAltKeyPressed) {
      // Create voiceSettings if it doesn't exist
      if (!voiceSettings) {
        voiceSettings = document.createElement('div');
        voiceSettings.classList.add('voice-settings');
        soundSwitcher.appendChild(voiceSettings);
        void voiceSettings.offsetWidth;
        voiceSettings.style.opacity = '1';
      }

      // Remove currentVoiceSpeed if it exists
      if (currentVoiceSpeed) {
        currentVoiceSpeed.remove();
      }

      // Create currentVoicePitch if it doesn't exist
      if (!currentVoicePitch) {
        currentVoicePitch = document.createElement('span');
        currentVoicePitch.classList.add('current-voice-pitch');
        voiceSettings.appendChild(currentVoicePitch);
      }

      // Create progress text info for voice pitch
      let voicePitchInfo = voiceSettings.querySelector('.current-voice-pitch .voice-value-info');
      if (!voicePitchInfo) {
        voicePitchInfo = document.createElement('span');
        voicePitchInfo.classList.add("voice-pitch", "voice-value-info");
        voiceSettings.querySelector('.current-voice-pitch').appendChild(voicePitchInfo);
      }

      if (voicePitchInfo) {
        // Set the text content of voice pitch
        if (voicePitch <= minVoicePitch || voicePitch >= maxVoicePitch) {
          voicePitchInfo.innerHTML = icons.rangeIsOutSVG;
        } else {
          voicePitchInfo.innerHTML = `PITCH ${voicePitch.toFixed(1)}`;
        }
      }

      // Create a new progress element if it doesn't exist for pitch
      let pitchProgress = voiceSettings.querySelector('.current-voice-pitch .voice-pitch-progress');
      if (!pitchProgress) {
        pitchProgress = document.createElement('span');
        pitchProgress.classList.add('voice-pitch-progress');
        // Create the progress fill element
        let fill = document.createElement('span');
        fill.classList.add('voice-pitch-progress-fill');
        // Append the fill element to the progress element
        pitchProgress.appendChild(fill);
        // Append the progress element to the current voice pitch container
        voiceSettings.querySelector('.current-voice-pitch').appendChild(pitchProgress);
      }

      // Update progress fill width based on voice pitch percentage
      pitchProgress.querySelector('.voice-pitch-progress-fill').style.width = getVoiceSettingsPercentage().pitch;

      // Clear any existing timeout on voiceSettings and set a new one
      if (voiceSettings.timeoutId) {
        clearTimeout(voiceSettings.timeoutId);
      }

      voiceSettings.timeoutId = setTimeout(() => {
        voiceSettings.style.opacity = '0';
        setTimeout(() => {
          voiceSettings.remove();
        }, 500);
      }, 2000);

    } else {
      // If neither Ctrl nor Alt is pressed, remove voiceSettings if it exists
      if (voiceSettings) {
        voiceSettings.remove();
      }
    }
  }

  let holdTimeout = null;
  let holdInterval = null;

  // Replace original click/contextmenu listeners with mousedown
  soundSwitcher.addEventListener('mousedown', handleMouseDown);
  soundSwitcher.addEventListener('contextmenu', (event) => event.preventDefault());

  function handleMouseDown(event) {
    event.preventDefault(); // Prevent context menu on right-click

    const params = getAdjustmentParams(event);
    if (!params) return;

    const { prop, step } = params;
    adjustValue(prop, step); // Initial adjustment

    // Set up delayed repeat
    holdTimeout = setTimeout(() => {
      holdInterval = setInterval(() => {
        const canContinue = adjustValue(prop, step);
        if (!canContinue) clearInterval(holdInterval);
      }, 100);
    }, 500);

    // Cleanup listeners
    const stopHolding = () => {
      clearTimeout(holdTimeout);
      clearInterval(holdInterval);
      soundSwitcher.removeEventListener('mouseup', stopHolding);
      soundSwitcher.removeEventListener('mouseleave', stopHolding);
    };

    soundSwitcher.addEventListener('mouseup', stopHolding);
    soundSwitcher.addEventListener('mouseleave', stopHolding);
  }

  function getAdjustmentParams(event) {
    const isLeft = event.button === 0;
    // const isRight = event.button === 2; // Unused declaration
    const isCtrl = event.ctrlKey || event.metaKey;
    const isAlt = event.altKey;

    if (!isCtrl && !isAlt) return null;

    const prop = isCtrl ? 'voiceSpeed' : 'voicePitch';
    const step = isLeft ? -0.1 : 0.1;

    // Boundary checks
    const current = KG_Chat_Empowerment.voiceSettings[prop];
    const [min, max] = prop === 'voiceSpeed'
      ? [minVoiceSpeed, maxVoiceSpeed]
      : [minVoicePitch, maxVoicePitch];

    if ((step < 0 && current <= min) || (step > 0 && current >= max)) return null;

    return { prop, step };
  }

  function adjustValue(prop, step) {
    const current = parseFloat(KG_Chat_Empowerment.voiceSettings[prop]);
    const [min, max] = prop === 'voiceSpeed'
      ? [minVoiceSpeed, maxVoiceSpeed]
      : [minVoicePitch, maxVoicePitch];

    const newValue = current + step;
    const clamped = Math.min(max, Math.max(min, newValue));

    if (current === clamped) return false; // No change

    updateVoiceSetting(prop, clamped);
    return (step > 0 ? clamped < max : clamped > min);
  }

  // Function to update the voice setting, round the value, and update storage
  function updateVoiceSetting(prop, value) {
    // Round the value to one decimal place
    const roundedValue = parseFloat(value.toFixed(1));
    // Update the voice setting in the application state
    KG_Chat_Empowerment.voiceSettings[prop] = roundedValue;
    // Update voiceSpeed and voicePitch variables
    if (prop === 'voiceSpeed') {
      voiceSpeed = roundedValue;
    } else if (prop === 'voicePitch') {
      voicePitch = roundedValue;
    }
    // Store the updated state in localStorage
    localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));
    // Show the updated voice settings
    showVoiceSettings();
  }

  // CREATE SOUND SWITCHER BUTTON (END)


  // CREATE MESSAGE MODE BUTTON (START)

  function createMessageModeButton() {
    // Create a new element with class 'message-mode-button' and id 'every-messages'
    messageMode = document.createElement('div');
    // Retrieve the value from KG_Chat_Empowerment.messageSettings.messageModeState
    const messageModeState = KG_Chat_Empowerment.messageSettings.messageModeState || 'every-message';
    // Add the class 'message-mode-button' to the 'messagesMode' element
    messageMode.classList.add("empowerment-button", "message-mode-button");
    // Initial button id if the localStorage key isn't created with assigned value by user
    messageMode.id = messageModeState;

    // Retrieve the value from KG_Chat_Empowerment.messageSettings.messageModeTitle
    const messageModeTitle = KG_Chat_Empowerment.messageSettings.messageModeTitle || 'Notify about every message';
    // Assign title for the current notification state
    messageMode.title = messageModeTitle;

    // Create message mode button icon container
    messageModeIcon = document.createElement('span');
    // Add class to icon container
    messageModeIcon.classList.add('message-mode-icon');

    // Append icon container inside message mode button
    messageMode.appendChild(messageModeIcon);
    // Append sound switcher button to chat buttons panel
    empowermentButtonsPanel.appendChild(messageMode);
  } createMessageModeButton();

  // Add the isAltKeyPressed condition to the messagesMode event listener
  messageMode.addEventListener('click', function (event) {
    // Only execute when isCtrlKeyPressed or isAltKeyPressed are false
    if (!isCtrlKeyPressed || !isAltKeyPressed) {

      // Add pulse effect for messageMode
      addPulseEffect(this);

      switch (this.id) {
        case 'every-message':
          this.id = 'mention-message';
          this.title = 'Notify about mention message';
          KG_Chat_Empowerment.messageSettings.messageModeState = 'mention-message';
          KG_Chat_Empowerment.messageSettings.messageModeTitle = 'Notify about mention message';
          break;
        case 'mention-message':
          this.id = 'every-message';
          this.title = 'Notify about every message';
          KG_Chat_Empowerment.messageSettings.messageModeState = 'every-message';
          KG_Chat_Empowerment.messageSettings.messageModeTitle = 'Notify about every message';
          break;
      }

      // Stringify KG_Chat_Empowerment before updating in localStorage
      localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));

      updateMessageModeIcon();
    }
  });

  function updateMessageModeIcon() {
    switch (messageMode.id) {
      case 'every-message':
        messageModeIcon.innerHTML = icons.modeEverySVG;
        break;
      case 'mention-message':
        messageModeIcon.innerHTML = icons.modeMentionSVG;
        break;
    }
  } updateMessageModeIcon();

  // CREATE MESSAGE MODE BUTTON (END)


  // 1. CREATE CACHE (START)
  createCacheButton(empowermentButtonsPanel);
  // CREATE CACHE (END)

  // 2. CREATE PERSONAL MESSAGES (START)
  createPersonalMessagesButton(empowermentButtonsPanel);
  // CREATE PERSONAL MESSAGES (END)

  // 3. CREATE CHAT LOGS (START)
  createChatLogsButton(empowermentButtonsPanel);
  // CREATE CHAT LOGS (END)

  // 4. CREATE SETTINGS (START)
  createSettingsButton(empowermentButtonsPanel);
  // CREATE SETTINGS (END)


  // Function to retrieve the chat input field and length popup container based on the current URL
  function retrieveChatElementsByRoomType() {
    const currentURL = window.location.href; // Get the current URL
    let inputField, lengthPopupContainer;

    if (currentURL.includes('gamelist')) {
      inputField = document.querySelector('#chat-general .text'); // Selector for the general chat input
      lengthPopupContainer = document.querySelector('#chat-general .messages'); // Selector for the general chat messages
    } else if (currentURL.includes('gmid')) {
      inputField = document.querySelector('[id^="chat-game"] .text'); // Selector for the game chat input
      lengthPopupContainer = document.querySelector('[id^="chat-game"] .messages'); // Selector for the game chat messages
    } else {
      console.error('No matching room type found in the URL.');
      return null; // Return null if no matching type is found
    }

    return { inputField, lengthPopupContainer }; // Return both the input field and the length popup container
  }


  // CHAT POPUP INDICATOR LENGTH (START)

  // Select the input element and length popup container using the helper function
  const { inputField: chatField, lengthPopupContainer } = retrieveChatElementsByRoomType();

  const lengthPopup = document.createElement('div');
  lengthPopup.className = 'length-field-popup';

  lengthPopupContainer.appendChild(lengthPopup);

  // Initialize once at startup
  const textMeasurementCanvas = document.createElement('canvas');
  const textMeasurementContext = textMeasurementCanvas.getContext('2d');

  let isPopupVisible = false;
  let previousLength = 0;
  let hidePopupTimeout;

  // Function to update the color of the length popup
  function updateLengthPopupColor(length) {
    if (!lengthPopup) {
      console.error('lengthPopup is not defined');
      return;
    }

    let textColor;

    // Determine color based on the length
    if (length === 0) {
      textColor = 'hsl(200, 20%, 50%)'; // Light Blue
    } else if (length >= 1 && length <= 90) {
      textColor = 'hsl(120, 100%, 40%)'; // Bright Green
    } else if (length > 90 && length <= 100) {
      const factor = (length - 90) / 10;
      const h = Math.round(120 + factor * (60 - 120)); // Interpolating hue
      textColor = `hsl(${h}, 100%, 40%)`;
    } else if (length > 100 && length <= 190) {
      textColor = 'hsl(60, 100%, 50%)'; // Bright Yellow
    } else if (length > 190 && length <= 200) {
      const factor = (length - 190) / 10;
      const h = Math.round(60 + factor * (30 - 60)); // Interpolating hue
      textColor = `hsl(${h}, 100%, 50%)`;
    } else if (length > 200 && length <= 250) {
      textColor = 'hsl(40, 100%, 50%)'; // Orange (Updated)
    } else if (length > 250 && length <= 300) {
      const factor = (length - 250) / 50;
      const h = Math.round(40 + factor * (0 - 40)); // Interpolating hue
      textColor = `hsl(${h}, 100%, 70%)`;
    } else {
      textColor = 'hsl(0, 100%, 70%)'; // Red (Updated)
    }

    // Apply the text color to the length popup
    lengthPopup.style.color = textColor;
  }

  // Then use them in your measurement function
  function updatePopupMetrics(text) {
    // Get current font from input field
    const computedStyle = getComputedStyle(chatField);
    textMeasurementContext.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;

    // Measure text
    const textWidth = textMeasurementContext.measureText(text).width;

    // Calculate position
    const newLeft = chatField.offsetLeft + textWidth + 5;
    const maxLeft = chatField.offsetLeft + chatField.offsetWidth - lengthPopup.offsetWidth;
    lengthPopup.style.left = `${Math.min(newLeft, maxLeft)}px`;
  }

  // Only update content/position without animation
  function updateLengthPopup(length) {
    let displayText;

    displayText = length > previousLength ? `${length} 🡆` :
      length < previousLength ? `🡄 ${length}` :
        `${length}`;

    lengthPopup.textContent = displayText;
    updateLengthPopupColor(length);
    previousLength = length;
  }

  function togglePopup(show) {
    if (isPopupVisible === show) return;
    lengthPopup.classList.toggle('bounce-in', show);
    lengthPopup.classList.toggle('bounce-out', !show);
    isPopupVisible = show;
    if (!show) setTimeout(() => lengthPopup.classList.remove('bounce-out'), 500);
  }

  function resetPopup() {
    updateLengthPopup(0);
    Object.assign(lengthPopup.style, { left: '0px', color: 'hsl(200, 20%, 50%)' });
  }

  chatField.addEventListener('input', () => {
    clearTimeout(hidePopupTimeout);
    updateLengthPopup(chatField.value.length);
    updatePopupMetrics(chatField.value);
    togglePopup(true);
    hidePopupTimeout = setTimeout(() => togglePopup(false), 1000);
  });

  chatField.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    resetPopup();
    togglePopup(true);
    hidePopupTimeout = setTimeout(() => togglePopup(false), 1000);
  });

  // CHAT POPUP INDICATOR LENGTH (END)


  // REMOVE UNWANTED MESSAGES

  /*
  ** This algorithm enables the removal of unpleasant messages in the chat that are unwanted.
  ** The messages are saved in localStorage and remain there until they are visible in the chat.
  ** Once a message is no longer visible in the chat, its corresponding value in localStorage is also removed.
  ** This method is helpful in storing only necessary unwanted messages, preventing an overgrowth of values over time.
  */

  function executeMessageRemover() {
    attachEventsToMessages();
    createToggleButton();
    wipeDeletedMessages();
  } // executeMessageRemover function END

  // Function to assign styles to the delete button
  function assignDeleteButtonStyles(deleteButton, event) {
    // Set the delete button styles
    deleteButton.style.position = 'fixed';
    deleteButton.style.top = `${event.clientY}px`;
    deleteButton.style.left = `${event.clientX}px`;
    deleteButton.style.zIndex = 999;
    deleteButton.style.padding = '8px 16px';
    deleteButton.style.backgroundColor = 'hsl(0, 50%, 20%)';
    deleteButton.style.color = 'hsl(0, 60%, 70%)';
    deleteButton.style.border = '1px solid hsl(0, 50%, 35%)';
    deleteButton.style.transition = 'all 0.3s';
    deleteButton.style.filter = 'brightness(1)';

    // Set the hover styles
    deleteButton.addEventListener('mouseenter', () => {
      deleteButton.style.filter = 'brightness(1.5)';
    });

    // Set the mouse leave styles
    deleteButton.addEventListener('mouseleave', () => {
      deleteButton.style.filter = 'brightness(1)';
    });
  }

  // Functions to assign selection to the messages
  function assignMessageSelection(message) {
    message.style.setProperty('background-color', 'hsla(0, 50%, 30%, .5)', 'important');
    message.style.setProperty('box-shadow', 'inset 0px 0px 0px 1px rgb(191, 64, 64)', 'important');
    message.style.setProperty('background-clip', 'padding-box', 'important');
  }
  // Clear the selection
  function clearMessageSelection() {
    const messages = document.querySelectorAll('.messages-content div p');
    messages.forEach(message => {
      message.style.removeProperty('background-color');
      message.style.removeProperty('box-shadow');
      message.style.removeProperty('background-clip');
    });
  }

  // Declare a new Set to hold selected messages
  const selectedMessages = new Set();
  // To store the data of the right mouse button drag
  let isDragging = false;
  let isRightMouseButton = false;

  // Function to attach events on every message what doesn't have any event assigned
  function attachEventsToMessages() {
    const messages = document.querySelectorAll('.messages-content div p');
    // Store timeoutID to regulate it by multiple events
    let timeoutId = null;

    messages.forEach(message => {
      // Check if the element has the 'contextmenu' id before adding a new event listener
      if (!message.hasAttribute('id') || message.getAttribute('id') !== 'contextmenu') {

        message.addEventListener('mousedown', event => {
          isRightMouseButton = event.button === 2;
          if (isRightMouseButton) {
            isDragging = true;
            clearTimeout(timeoutId);

            // Extract content from various types of child nodes
            const messageContent = getMessageContent(message);
            if (!selectedMessages.has(messageContent)) {
              selectedMessages.add(messageContent);
              console.log('Added new message inside the selectedMessages Set:', messageContent);
            }

            assignMessageSelection(message);
          }
        });

        message.addEventListener('mouseup', event => {
          isRightMouseButton = event.button === 2;
          if (isRightMouseButton) {
            isDragging = false;
          }
        });

        message.addEventListener('mouseover', event => {
          if (isDragging && isRightMouseButton) {
            // Extract content from various types of child nodes
            const messageContent = getMessageContent(message);
            if (!selectedMessages.has(messageContent)) {
              selectedMessages.add(messageContent);
              console.log('Added new message inside the selectedMessages Set:', messageContent);
            }

            assignMessageSelection(message);
          }
        });

        // Add id contextmenu to check in the future if the element has the event
        message.setAttribute('id', 'contextmenu');
        // Add an event listener for right-clicks on messages
        message.addEventListener('contextmenu', event => {
          // Prevent the default context menu from appearing
          event.preventDefault();
          // Wrap the message into visible selection to visually know what message will be deleted
          assignMessageSelection(message);

          // Check if a delete-message button already exists in the document
          const deleteButton = document.querySelector('.delete-message');

          if (deleteButton) {
            // If it exists, remove it
            deleteButton.remove();
          }

          // Create a new delete-message button
          const newDeleteButton = document.createElement('button');
          newDeleteButton.innerText = 'Delete';
          newDeleteButton.classList.add('delete-message');

          // Attach event click to new delete-message button
          newDeleteButton.addEventListener('click', () => {
            deleteSelectedMessages(message);
            newDeleteButton.remove();
            createToggleButton();
            selectedMessages.clear();
          });

          // Style the delete button
          assignDeleteButtonStyles(newDeleteButton, event);

          // Set the hover styles
          newDeleteButton.addEventListener('mouseenter', () => {
            newDeleteButton.style.filter = 'brightness(1.5)';
          });

          // Set the mouse leave styles
          newDeleteButton.addEventListener('mouseleave', () => {
            newDeleteButton.style.filter = 'brightness(1)';
          });

          // Append the new delete-message button to the document body
          document.body.appendChild(newDeleteButton);

          function hideDeleteButton() {
            // Set a new timeout to remove the delete button
            timeoutId = setTimeout(() => {
              if (!newDeleteButton.matches(':hover')) {
                newDeleteButton.remove();
                clearMessageSelection(message);
                selectedMessages.clear();
              }
            }, 1000);
          }

          hideDeleteButton();

          // Add event listener for the mouseleave event on the delete button
          newDeleteButton.addEventListener('mouseleave', () => {
            hideDeleteButton();
          });

          // Add event listener for the mouseenter event on the delete button to clear the previous timeout
          newDeleteButton.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
          });

        });
      }
    });
  }

  // Function to extract content from various types of child nodes within a message element
  function getMessageContent(messageElement) {
    // Query the .time and .username elements
    const timeElement = messageElement.querySelector('.time');
    const usernameElement = messageElement.querySelector('.username');

    // Extract content from .time and .username elements
    const timeContent = timeElement ? timeElement.textContent.trim() : '';
    const usernameContent = usernameElement ? ` ${usernameElement.textContent.trim()} ` : '';

    // Extract content from other types of child nodes
    const otherContentArray = Array.from(messageElement.childNodes)
      .filter(node => node !== timeElement && node !== usernameElement)
      .map(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent; // Handle #text node without trimming
        } else if (node.tagName === 'A') {
          return node.getAttribute('href').trim(); // Handle #anchor (link) node
        } else if (node.tagName === 'IMG') {
          return node.title.trim(); // Handle #img node
        } else if (node.tagName === 'IFRAME') {
          return node.getAttribute('src').trim(); // Handle #iframe node
        }
        return ''; // Return empty string for other node types
      });

    // Concatenate content while respecting the order of child nodes
    const allContentArray = [timeContent, usernameContent, ...otherContentArray];

    return allContentArray.join('');
  }

  function deleteSelectedMessages() {
    // Retrieve and backup all current selectedMessages and convert into Array
    const messagesToDelete = [...selectedMessages];

    // Get all message elements
    const messages = document.querySelectorAll('.messages-content div p');

    // Loop over each selected message content
    messagesToDelete.forEach((messageContent) => {
      // Find the corresponding DOM element
      const messageElement = Array.from(messages).find(message => getMessageContent(message) === messageContent);

      // Check if the element is found before using it
      if (messageElement) {
        // Retrieve the stored deleted messages array, or create an empty array if none exist
        const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');
        // Add the deleted message content to the array if it doesn't already exist
        if (!deletedMessages.includes(messageContent)) {
          deletedMessages.push(messageContent);
        }
        // Store the updated deleted messages array in localStorage
        localStorage.setItem('deletedChatMessagesContent', JSON.stringify(deletedMessages));
        // Remove the message from the selectedMessages Set
        selectedMessages.delete(messageContent);
      }
    });

    // Hide all the messages that match the localStorage value
    wipeDeletedMessages();
  }

  function wipeDeletedMessages() {
    // Retrieve and parse the stored deleted messages
    const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');

    // If there are no deleted messages in localStorage, return early
    if (deletedMessages.length === 0) return;

    const messages = document.querySelectorAll('.messages-content div p');
    // Convert the deleted messages into a Set for faster lookup
    const deletedMessagesSet = new Set(deletedMessages);

    // Collect the current messages content into an array for easy comparison
    const currentMessagesContent = Array.from(messages).map(message => getMessageContent(message));

    // Filter out the deleted messages that no longer exist in the current messages
    const newDeletedMessages = deletedMessages.filter(content => currentMessagesContent.includes(content));

    // Hide messages in the chat that match the deleted messages
    messages.forEach(message => {
      if (deletedMessagesSet.has(getMessageContent(message))) {
        message.style.display = 'none';
      }
    });

    // Store the updated deleted messages array in localStorage
    localStorage.setItem('deletedChatMessagesContent', JSON.stringify(newDeletedMessages));
  } // wipeDeletedMessages END

  // Declare toggleButton variable outside of the function so it is a global variable
  let toggleButton;

  // Function to create the button only if localStorage "deletedChatMessagesContent" has at least one deleted message value
  function createToggleButton() {
    // Retrieve the stored deleted messages array
    const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');

    // Only create the toggle button if there are deleted messages to show/hide
    if (deletedMessages.length > 0) {
      // Check if the button already exists in the DOM
      toggleButton = document.getElementById('toggleButton');
      if (toggleButton === null) {
        // Create the toggle button
        toggleButton = document.createElement('button');
        toggleButton.id = 'toggleButton';
        toggleButton.classList.add("toggle-button-hidden");
        toggleButton.addEventListener('click', toggleHiddenMessages);
        toggleButton.style.position = 'absolute';
        toggleButton.style.top = '0';
        toggleButton.style.right = '0';
        toggleButton.style.padding = '8px 16px';
        // Initial textContent if at least one message is hidden
        toggleButton.innerText = 'Hidden';
        // Initial styles for the Hidden button
        toggleButton.style.transition = 'filter 300ms';
        toggleButton.style.filter = 'hue-rotate(0) brightness(1)';
        let backupTextContent = toggleButton.textContent;

        // Set the hover styles
        toggleButton.addEventListener('mouseenter', () => {
          if (isCtrlKeyPressed) {
            backupTextContent = toggleButton.textContent;
            toggleButton.textContent = 'Restore';
            toggleButton.style.filter = 'hue-rotate(180deg) brightness(2)';
          } else {
            toggleButton.style.filter = 'hue-rotate(0) brightness(2)';
          }
        });

        // Set the mouse leave styles
        toggleButton.addEventListener('mouseleave', () => {
          const isRestore = toggleButton.textContent === 'Restore';
          if (isCtrlKeyPressed || !isCtrlKeyPressed && isRestore) {
            toggleButton.textContent = backupTextContent;
          }
          toggleButton.style.filter = 'hue-rotate(0) brightness(1)';
        });

        messagesContainer.appendChild(toggleButton);
      }
    }
  } // createToggleButton END

  // Function to toggle messages display state from "NONE" to "BLOCK" and reverse
  function toggleHiddenMessages() {
    const messages = document.querySelectorAll('.messages-content div p');
    // Retrieve the stored deleted messages array
    const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');

    if (isCtrlKeyPressed) {
      // Set deletedChatMessagesContent in local storage as an empty array
      localStorage.setItem('deletedChatMessagesContent', JSON.stringify([]));

      // Display all messages
      messages.forEach(message => {
        message.style.display = 'block';
        message.style.removeProperty('background-color');
        message.style.removeProperty('box-shadow');
        message.style.removeProperty('background-clip');
      });

      toggleButton.remove();
    }

    if (!isCtrlKeyPressed) {

      // Check if there are any deleted messages in the local storage
      if (deletedMessages.length === 0) {
        // Hide the toggle button if there are no deleted messages
        toggleButton.style.display = 'none';
        return;
      } else {
        // Show the toggle button if there are deleted messages
        toggleButton.style.display = 'block';
      }

      // Toggle the display of each message that matches the key "deletedChatMessagesContent" data
      messages.forEach(message => {
        const messageContent = getMessageContent(message);

        if (deletedMessages.includes(messageContent)) {
          // Show hidden messages if innerText is "Hidden" and display equal "NONE"
          if (toggleButton.innerText === 'Hidden') {
            if (message.style.display === 'none') {
              // Change display to "BLOCK"
              message.style.display = 'block';
              // Wrap the message into visible selection to visually know what message will be deleted
              message.style.setProperty('background-color', 'hsla(0, 50%, 30%, .5)', 'important');
              message.style.setProperty('box-shadow', 'inset 0px 0px 0px 1px rgb(191, 64, 64)', 'important');
              message.style.setProperty('background-clip', 'padding-box', 'important');
            }
            // Show hidden messages if innerText is "Show" and display equal "NONE"
          } else if (toggleButton.innerText === 'Show') {
            if (message.style.display === 'none') {
              message.style.display = 'block';
              // Wrap the message into visible selection to visually know what message will be deleted
              message.style.setProperty('background-color', 'hsla(0, 50%, 30%, .5)', 'important');
              message.style.setProperty('box-shadow', 'inset 0px 0px 0px 1px rgb(191, 64, 64)', 'important');
              message.style.setProperty('background-clip', 'padding-box', 'important');
            }
          } else if (toggleButton.innerText === 'Hide') {
            if (message.style.display === 'block') {
              message.style.display = 'none';
              message.style.removeProperty('background-color');
              message.style.removeProperty('box-shadow');
              message.style.removeProperty('background-clip');
            }
          }
        }
      });

      // Toggle the button text and style
      if (toggleButton.innerText === 'Hide') {
        toggleButton.innerText = 'Show';
        toggleButton.className = 'toggle-button-show'; // Replace the class with the show style
      } else {
        toggleButton.innerText = 'Hide';
        toggleButton.className = 'toggle-button-hide'; // Replace the class with the hide style
      }

    }

  } // toggleHiddenMessages END

  // CHAT SWITCHER

  const currentLocationIncludes = part => window.location.href.includes(part);

  // Helper function to dynamically retrieve the current chat elements.
  const getChatElements = () => ({
    chatField: document.querySelector('.chat .text'),
    chatSend: document.querySelector('.chat .send')
  });

  // Function to extract a system message from the chat field's value.
  // Returns the message string if found, or null otherwise.
  function getChatSystemMessage(chatField) {
    if (!chatField) return null;
    const value = chatField.value;
    if (value.includes(blockedChatMessage)) return blockedChatMessage;
    if (value.includes(lostConnectionMessage)) return lostConnectionMessage;
    return null;
  }

  // Timeout settings.
  const extraTimeout = 5000;
  const minimalTimeout = 1000;

  // Define system messages.
  const blockedChatMessage = 'Вы не можете отправлять сообщения';
  const lostConnectionMessage = 'Связь с сервером потеряна';

  if (currentLocationIncludes('gamelist')) {
    // Function to handle changes when the chat field is disabled.
    function handleChatStateChange(timeout, chatField, chatSend) {
      if (chatField.disabled) {
        const systemMessage = getChatSystemMessage(chatField);
        if (systemMessage === blockedChatMessage) {
          // Re-enable the chat field and send button, and update their styles.
          chatField.disabled = chatSend.disabled = false;
          chatSend.style.setProperty('background-color', 'rgb(160, 35, 35)', 'important');
          chatSend.style.setProperty(
            'background-image',
            `url("data:image/svg+xml,${encodeURIComponent(icons.deniedSVG)}")`,
            'important'
          );
          chatSend.style.setProperty('background-repeat', 'no-repeat', 'important');
          chatSend.style.setProperty('background-position', 'center', 'important');
          chatSend.style.setProperty('color', 'transparent', 'important');
          chatField.value = null;
          console.log('Chat field was blocked, re-enabled.');
        } else if (systemMessage === lostConnectionMessage) {
          // Schedule a reload using timeout.
          console.log('Lost connection, reloading...');
          setTimeout(() => {
            window.location.reload();
          }, timeout);
        }
      }
    }

    // Create a MutationObserver to watch for attribute changes.
    const observer = new MutationObserver(() => {
      // Get updated chat elements.
      const { chatField, chatSend } = getChatElements();
      // Handle the change when the 'disabled' attribute is modified.
      handleChatStateChange(extraTimeout, chatField, chatSend);
    });

    // Get the chat field element.
    const { chatField: chatInputText } = getChatElements();
    // Start observing the chatField for changes to the 'disabled' attribute.
    if (chatInputText)
      observer.observe(chatInputText, { attributes: true, attributeFilter: ['disabled'] });

    // Compact visibilitychange event: When the document becomes visible,
    // set a shorter timeout duration and check the chat state.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const { chatField, chatSend } = getChatElements();
        handleChatStateChange(minimalTimeout, chatField, chatSend);
      }
    });
  }

  // Get all elements with the 'general' class
  let generalChatTabs = document.querySelectorAll('.general');
  // Get all elements with the 'game' class
  let gameChatTabs = document.querySelectorAll('.game');

  // Function to set focus on the chat input field based on the current URL on page load
  function setChatFieldFocus() {
    // Check if the chat is closed or opened
    const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');

    // Determine the current URL and chat type based on URL keywords
    const currentURL = window.location.href;
    let chatInput; // Variable to store the chat input element

    if (currentURL.includes('gamelist')) {
      // If the URL contains "gamelist," it's a general chat
      chatInput = document.querySelector('#chat-general .text');
    } else if (currentURL.includes('gmid')) {
      // If the URL contains "gmid," it's a game chat
      chatInput = document.querySelector('[id^="chat-game"] .text');
    }

    // Run if the chat is not closed and a chat input element is found
    if (!chatHidden && chatInput) {
      chatInput.focus(); // Set focus on the selected chat input field
    }
  }

  // Function to set focus on the chat input field based on active chat tab on tab key press
  function toggleFocusAndSwitchTab() {
    // Check if the chat is closed or opened
    const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');

    // Get general chat tabs and game chat tabs
    let generalChatTabs = document.querySelectorAll('.general.c, .general.c.active');
    let gameChatTabs = document.querySelectorAll('.game.c, .game.c.active');

    // Find the first visible general chat tab that is not active
    let visibleGeneralChatTab = Array.from(generalChatTabs).find(function (tab) {
      let computedStyle = window.getComputedStyle(tab);
      return computedStyle.display !== 'none' && !tab.classList.contains('active');
    });

    // Find the first visible game chat tab that is not active
    let visibleGameChatTab = Array.from(gameChatTabs).find(function (tab) {
      let computedStyle = window.getComputedStyle(tab);
      return computedStyle.display !== 'none' && !tab.classList.contains('active');
    });

    // Run if a chat tab is found
    if (!chatHidden && (visibleGeneralChatTab || visibleGameChatTab)) {
      // Click on the visible chat tab
      if (visibleGeneralChatTab) {
        visibleGeneralChatTab.click();
      } else if (visibleGameChatTab) {
        visibleGameChatTab.click();
      }

      // Determine the chat input element based on visible tabs
      let chatInput; // Variable to store the chat input element

      if (visibleGeneralChatTab) {
        // If the visible chat tab is a general chat tab, focus on general chat input
        chatInput = document.querySelector('#chat-general .text');
      } else if (visibleGameChatTab) {
        // If the visible chat tab is a game chat tab, focus on game chat input
        chatInput = document.querySelector('[id^="chat-game"] .text');
      }

      // Run if a chat input element is found
      if (chatInput) {
        chatInput.focus(); // Set focus on the selected chat input field
      }
    }
  }

  // Function to handle click event and log the clicked element
  function switchChatTab(event) {
    console.log('Clicked element:', event.target);
    let activeTab = event.target.classList.contains('general') ? 'general' : 'game';
    localStorage.setItem('activeChatTab', activeTab);
  }

  // Add click event listeners to the general chat tabs
  generalChatTabs.forEach(function (tab) {
    tab.addEventListener('click', switchChatTab);
  });

  // Add click event listeners to the game chat tabs
  gameChatTabs.forEach(function (tab) {
    tab.addEventListener('click', switchChatTab);
  });

  // Add keydown event listener to the document
  document.addEventListener('keydown', function (event) {
    // Check if the Tab key is pressed
    if (event.key === 'Tab') {
      // Call toggleFocusAndSwitchTab function when Tab key is pressed
      toggleFocusAndSwitchTab();
      // Prevent the default tab behavior (moving focus to the next element in the DOM)
      event.preventDefault();
    }
  });

  // Function to restore chat tab from localStorage and set the focus for game page
  function restoreChatTabAndFocus() {
    let activeTab = localStorage.getItem('activeChatTab');
    let chatInput; // Variable to store the chat input element to be focused

    if (activeTab === 'general') {
      let visibleGeneralChatTab = Array.from(generalChatTabs).find(function (tab) {
        let computedStyle = window.getComputedStyle(tab);
        return computedStyle.display !== 'none' && !tab.classList.contains('active');
      });
      if (visibleGeneralChatTab) {
        visibleGeneralChatTab.click();
        chatInput = document.querySelector('#chat-general .text');
      }
    } else if (activeTab === 'game') {
      let visibleGameChatTab = Array.from(gameChatTabs).find(function (tab) {
        let computedStyle = window.getComputedStyle(tab);
        return computedStyle.display !== 'none' && !tab.classList.contains('active');
      });
      if (visibleGameChatTab) {
        visibleGameChatTab.click();
        chatInput = document.querySelector('[id^="chat-game"] .text');
      }
    }

    // Set focus on the chat input field if chatInput is defined
    if (chatInput) {
      chatInput.focus();
    }
  }

  // Function to break text into pieces of a maximum length
  function breakSentence(text) {
    const maxLength = 300; // Maximum length of each piece
    const words = text.split(' '); // Split the text into words
    const pieces = []; // Array to hold the final pieces
    let currentPiece = ''; // Variable to build the current piece

    words.forEach((word) => {
      // Check if adding the next word would exceed maxLength
      if ((currentPiece + word).length > maxLength) {
        // Push the current piece to pieces and reset currentPiece
        pieces.push(currentPiece.trim());
        currentPiece = word + ' '; // Start a new piece with the current word
      } else {
        currentPiece += word + ' '; // Add the word to the current piece
      }
    });

    // Push the last piece if it exists
    if (currentPiece) {
      pieces.push(currentPiece.trim());
    }

    return pieces;
  }

  // Function to send the message in parts
  async function sendMessageInParts(message) {
    const pieces = breakSentence(message); // Break the message into pieces
    const inputField = document.querySelector('.text'); // Get the input field element
    const sendButton = document.querySelector('.send'); // Get the send button element

    // Disable the input field only if the message is longer than 300 characters
    const isLongMessage = message.length > 300;
    if (isLongMessage) {
      inputField.disabled = true; // Disable input field for long messages
    }

    for (let index = 0; index < pieces.length; index++) {
      // Set the input field to the current piece
      const fullMessage = pieces[index]; // Use the current piece
      inputField.value = fullMessage;

      // Log each piece and its length
      console.log(`Sending piece ${index + 1}: "${fullMessage}" (Length: ${fullMessage.length})`);

      // Simulate sending the message
      sendButton.click(); // Click the send button

      // If not the last piece, generate a random delay before sending the next one
      if (index < pieces.length - 1) {
        const randomDelay = Math.floor(Math.random() * 500) + 500; // 500 ms to 1000 ms
        console.log(`Waiting for ${randomDelay} ms before sending the next piece.`);
        await new Promise(resolve => setTimeout(resolve, randomDelay)); // Use await for async delay
      }
    }

    // Re-enable the input field after all pieces have been sent, if it was disabled
    if (isLongMessage) {
      inputField.disabled = false;
    }
  }

  function setupInputFieldListener() {
    const inputField = document.querySelector('.text');
    inputField.setAttribute('maxlength', '1000');

    // Listen for the paste event on the input field
    inputField.addEventListener('paste', (event) => {
      // Prevent the default paste behavior
      event.preventDefault();
      // Get the pasted value from the clipboard
      const pastedValue = event.clipboardData.getData('text');
      // Initialize the processed value to the pasted value
      let processedValue = pastedValue;

      // If the pasted value is a valid and encoded URL, decode it
      if (isValidEncodedURL(pastedValue)) {
        processedValue = decodeURL(pastedValue);
      }

      // Get the current selection's start and end positions in the input field
      const start = inputField.selectionStart;
      const end = inputField.selectionEnd;

      // Insert the processed value into the input field at the current cursor position
      inputField.value = inputField.value.slice(0, start) + processedValue + inputField.value.slice(end);
      // Set the cursor position after the pasted value
      inputField.setSelectionRange(start + processedValue.length, start + processedValue.length);
    });


    inputField.addEventListener('keydown', (event) => {
      const message = inputField.value;
      if (event.key === 'Enter') {
        if (message.length > 300) {
          event.preventDefault();
          sendMessageInParts(message);
          console.log(`Long message processed: "${message}"`);
          inputField.value = '';
        } else {
          console.log(`Short message processed: "${message}"`);
        }
      }
    });
  }

  // Function to set up input field backup and restore
  function setupInputBackup(inputSelector) {
    const inputField = document.querySelector(inputSelector); // Select the input element
    if (inputField) {
      // Restore the input value
      inputField.value = localStorage.getItem('inputBackup') || '';

      // Backup on input with debounce, but only if there's no system message.
      inputField.addEventListener('input', debounce(() => {
        if (!getChatSystemMessage(inputField)) {
          localStorage.setItem('inputBackup', inputField.value);
        }
      }, 250));

      // Clear local storage on Enter
      inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') localStorage.removeItem('inputBackup');
      });
    }
  }

  const storageKey = 'cacheRefreshThresholdHours';
  let storedThreshold = localStorage.getItem(storageKey);
  if (!storedThreshold) localStorage.setItem(storageKey, storedThreshold = defaultCacheRefreshThresholdHours);
  const cacheRefreshThresholdHours = convertToSingleHours(storedThreshold);

  // create a new MutationObserver to wait for the chat to fully load with all messages
  let waitForChatObserver = new MutationObserver(() => {
    // Get the container for all chat messages
    const messagesContainer = document.querySelector('.messages-content div');
    // Get all the message elements from messages container
    const messages = document.querySelectorAll('.messages-content div p');

    // check if the chat element has been added to the DOM
    if (document.contains(messagesContainer)) {

      // check if there are at least 20 messages in the container
      if (messages.length >= 20) {
        // stop observing the DOM
        waitForChatObserver.disconnect();
        // Remove ignored users' messages if the page is not initialized
        removeIgnoredUserMessages();
        // Convert image links to visible image containers
        convertImageLinksToImage('generalMessages');
        // Convert YouTube links to visible iframe containers
        convertVideoLinksToPlayer('generalMessages'); // For general chat
        // Decodes links within the general messages section.
        processEncodedLinks('generalMessages');
        // Restore chat tab from localStorage
        restoreChatTabAndFocus();
        // Call the function with the selector for the input field
        setupInputBackup('#chat-general .text');
        // Call the function to re-highlight all the mention words of the messages
        highlightMentionWords();
        // Call the function to apply the chat message grouping
        applyChatMessageGrouping();
        // Call the function to scroll to the bottom of the chat
        scrollMessagesToBottom();
        // Call the function to refresh the user list and clear the cache if needed
        refreshFetchedUsers(false, cacheRefreshThresholdHours);
        // Refresh experimental custom chat user list on old list changes
        refreshUserList();
        // Call the setChatFieldFocus function when the page loads
        setChatFieldFocus();
        // Execute the function to trigger the process of chat cleaning after the youtube and images convertation to avoid issues
        executeMessageRemover();
        // Initialize the input field listener to handle message sending when Enter is pressed
        setupInputFieldListener();
      }
    }
  });

  // start observing the DOM for changes
  waitForChatObserver.observe(document, { childList: true, subtree: true });
})();