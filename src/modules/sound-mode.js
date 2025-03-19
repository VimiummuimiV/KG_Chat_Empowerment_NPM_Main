import { silenceSVG, beepSVG, voiceSVG, rangeIsOutSVG } from './icons.js';
import { KG_Chat_Empowerment } from './panels/settings/settings.js'; // settings

import { isCtrlKeyPressed, isAltKeyPressed } from './helpers.js'; // helpers definitions

import { addPulseEffect } from './animations.js'; // animations

import {
  minVoiceSpeed,
  maxVoiceSpeed,
  minVoicePitch,
  maxVoicePitch,
  defaultVoiceSpeed,
  defaultVoicePitch
 } from './definitions.js';

export let voiceSpeed = KG_Chat_Empowerment.voiceSettings.voiceSpeed ?? defaultVoiceSpeed;
export let voicePitch = KG_Chat_Empowerment.voiceSettings.voicePitch ?? defaultVoicePitch;

// Declare variables for the sound switcher button and its icon
let soundSwitcher, soundSwitcherIcon;

export function createSoundSwitcherButton(panel) {
  soundSwitcher = document.createElement('div');
  const state = KG_Chat_Empowerment.messageSettings.messageNotificationState || 'silence';
  soundSwitcher.classList.add("empowerment-button", "sound-switcher-button");
  soundSwitcher.id = state;
  soundSwitcher.title = KG_Chat_Empowerment.messageSettings.messageNotificationTitle || 'Do not disturb';

  soundSwitcherIcon = document.createElement('span');
  soundSwitcherIcon.classList.add('sound-switcher-icon');
  soundSwitcher.appendChild(soundSwitcherIcon);
  panel.appendChild(soundSwitcher);

  soundSwitcher.addEventListener('click', function () {
    if (!isCtrlKeyPressed && !isAltKeyPressed) {
      document.querySelector('.current-voice-speed')?.remove();
      document.querySelector('.current-voice-pitch')?.remove();
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
      localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));
      updateSoundSwitcherIcon();
    }
  });

  soundSwitcher.addEventListener('mousedown', handleMouseDown);
  soundSwitcher.addEventListener('contextmenu', e => e.preventDefault());
  updateSoundSwitcherIcon();
}

function updateSoundSwitcherIcon() {
  soundSwitcherIcon.innerHTML =
    soundSwitcher.id === 'silence' ? silenceSVG :
      soundSwitcher.id === 'beep' ? beepSVG : voiceSVG;
}

function getVoiceSettingsPercentage() {
  return {
    speed: `${((voiceSpeed - minVoiceSpeed) / (maxVoiceSpeed - minVoiceSpeed)) * 100}%`,
    pitch: `${((voicePitch - minVoicePitch) / (maxVoicePitch - minVoicePitch)) * 100}%`
  };
}

function showVoiceSettings() {
  let voiceSettings = document.querySelector('.voice-settings'),
    currentSpeed = document.querySelector('.current-voice-speed'),
    currentPitch = document.querySelector('.current-voice-pitch');

  if (isCtrlKeyPressed) {
    if (!voiceSettings) {
      voiceSettings = document.createElement('div');
      voiceSettings.classList.add('voice-settings');
      soundSwitcher.appendChild(voiceSettings);
      void voiceSettings.offsetWidth;
      voiceSettings.style.opacity = '1';
    }
    currentPitch?.remove();
    if (!currentSpeed) {
      currentSpeed = document.createElement('span');
      currentSpeed.classList.add('current-voice-speed');
      voiceSettings.appendChild(currentSpeed);
    }
    let speedInfo = currentSpeed.querySelector('.voice-value-info') || document.createElement('span');
    if (!currentSpeed.querySelector('.voice-value-info')) {
      speedInfo.classList.add("voice-speed", "voice-value-info");
      currentSpeed.appendChild(speedInfo);
    }
    speedInfo.innerHTML = (voiceSpeed <= minVoiceSpeed || voiceSpeed >= maxVoiceSpeed)
      ? rangeIsOutSVG : `SPEED ${Number(voiceSpeed).toFixed(1)}`;
    let speedProgress = currentSpeed.querySelector('.voice-speed-progress') || document.createElement('span');
    if (!currentSpeed.querySelector('.voice-speed-progress')) {
      speedProgress.classList.add('voice-speed-progress');
      const fill = document.createElement('span');
      fill.classList.add('voice-speed-progress-fill');
      speedProgress.appendChild(fill);
      currentSpeed.appendChild(speedProgress);
    }
    currentSpeed.querySelector('.voice-speed-progress-fill').style.width = getVoiceSettingsPercentage().speed;
    if (voiceSettings.timeoutId) clearTimeout(voiceSettings.timeoutId);
    voiceSettings.timeoutId = setTimeout(() => {
      voiceSettings.style.opacity = '0';
      setTimeout(() => voiceSettings.remove(), 500);
    }, 2000);
  } else if (isAltKeyPressed) {
    if (!voiceSettings) {
      voiceSettings = document.createElement('div');
      voiceSettings.classList.add('voice-settings');
      soundSwitcher.appendChild(voiceSettings);
      void voiceSettings.offsetWidth;
      voiceSettings.style.opacity = '1';
    }
    currentSpeed?.remove();
    if (!currentPitch) {
      currentPitch = document.createElement('span');
      currentPitch.classList.add('current-voice-pitch');
      voiceSettings.appendChild(currentPitch);
    }
    let pitchInfo = currentPitch.querySelector('.voice-value-info') || document.createElement('span');
    if (!currentPitch.querySelector('.voice-value-info')) {
      pitchInfo.classList.add("voice-pitch", "voice-value-info");
      currentPitch.appendChild(pitchInfo);
    }
    pitchInfo.innerHTML = (voicePitch <= minVoicePitch || voicePitch >= maxVoicePitch)
      ? rangeIsOutSVG : `PITCH ${voicePitch.toFixed(1)}`;
    let pitchProgress = currentPitch.querySelector('.voice-pitch-progress') || document.createElement('span');
    if (!currentPitch.querySelector('.voice-pitch-progress')) {
      pitchProgress.classList.add('voice-pitch-progress');
      const fill = document.createElement('span');
      fill.classList.add('voice-pitch-progress-fill');
      pitchProgress.appendChild(fill);
      currentPitch.appendChild(pitchProgress);
    }
    currentPitch.querySelector('.voice-pitch-progress-fill').style.width = getVoiceSettingsPercentage().pitch;
    if (voiceSettings.timeoutId) clearTimeout(voiceSettings.timeoutId);
    voiceSettings.timeoutId = setTimeout(() => {
      voiceSettings.style.opacity = '0';
      setTimeout(() => voiceSettings.remove(), 500);
    }, 2000);
  } else {
    voiceSettings?.remove();
  }
}

let holdTimeout = null, holdInterval = null;

function handleMouseDown(event) {
  event.preventDefault();
  const params = getAdjustmentParams(event);
  if (!params) return;
  const { prop, step } = params;
  adjustValue(prop, step);
  holdTimeout = setTimeout(() => {
    holdInterval = setInterval(() => {
      if (!adjustValue(prop, step)) clearInterval(holdInterval);
    }, 100);
  }, 500);
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
  const isLeft = event.button === 0, isCtrl = event.ctrlKey || event.metaKey, isAlt = event.altKey;
  if (!isCtrl && !isAlt) return null;
  const prop = isCtrl ? 'voiceSpeed' : 'voicePitch', step = isLeft ? -0.1 : 0.1;
  const current = KG_Chat_Empowerment.voiceSettings[prop];
  const [min, max] = prop === 'voiceSpeed'
    ? [minVoiceSpeed, maxVoiceSpeed]
    : [minVoicePitch, maxVoicePitch];
  return (step < 0 && current <= min) || (step > 0 && current >= max) ? null : { prop, step };
}

function adjustValue(prop, step) {
  const current = parseFloat(KG_Chat_Empowerment.voiceSettings[prop]);
  const [min, max] = prop === 'voiceSpeed'
    ? [minVoiceSpeed, maxVoiceSpeed]
    : [minVoicePitch, maxVoicePitch];
  const clamped = Math.min(max, Math.max(min, current + step));
  if (current === clamped) return false;
  updateVoiceSetting(prop, clamped);
  return step > 0 ? clamped < max : clamped > min;
}

function updateVoiceSetting(prop, value) {
  const rounded = parseFloat(value.toFixed(1));
  KG_Chat_Empowerment.voiceSettings[prop] = rounded;
  if (prop === 'voiceSpeed') voiceSpeed = rounded;
  else if (prop === 'voicePitch') voicePitch = rounded;
  localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));
  showVoiceSettings();
}
