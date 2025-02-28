// Declare variables for the sound switcher button and its icon
let soundSwitcher, soundSwitcherIcon;

export function createSoundSwitcherButton(panel) {
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
  panel.appendChild(soundSwitcher);
}

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