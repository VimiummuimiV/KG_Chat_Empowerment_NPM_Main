import { modeEverySVG, modeMentionSVG } from './icons.js'; // icons
import { KG_Chat_Empowerment } from './panels/settings/settings.js'; // settings

import { isCtrlKeyPressed, isAltKeyPressed } from './helpers.js'; // helpers definitions

import { addPulseEffect } from './animations.js'; // animations

let messageMode, messageModeIcon;

export function createMessageModeButton(panel) {
  messageMode = document.createElement('div');
  const state = KG_Chat_Empowerment.messageSettings.messageModeState || 'every-message';
  messageMode.classList.add("empowerment-button", "message-mode-button");
  messageMode.id = state;
  messageMode.title = KG_Chat_Empowerment.messageSettings.messageModeTitle || 'Notify about every message';

  messageModeIcon = document.createElement('span');
  messageModeIcon.classList.add('message-mode-icon');
  messageMode.appendChild(messageModeIcon);
  panel.appendChild(messageMode);

  messageMode.addEventListener('click', function () {
    if (!isCtrlKeyPressed || !isAltKeyPressed) {
      addPulseEffect(this);
      if (this.id === 'every-message') {
        this.id = 'mention-message';
        this.title = 'Notify about mention message';
        KG_Chat_Empowerment.messageSettings.messageModeState = 'mention-message';
        KG_Chat_Empowerment.messageSettings.messageModeTitle = 'Notify about mention message';
      } else {
        this.id = 'every-message';
        this.title = 'Notify about every message';
        KG_Chat_Empowerment.messageSettings.messageModeState = 'every-message';
        KG_Chat_Empowerment.messageSettings.messageModeTitle = 'Notify about every message';
      }
      localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));
      updateMessageModeIcon();
    }
  });
  updateMessageModeIcon();
}

function updateMessageModeIcon() {
  messageModeIcon.innerHTML = messageMode.id === 'every-message' ? modeEverySVG : modeMentionSVG;
}
