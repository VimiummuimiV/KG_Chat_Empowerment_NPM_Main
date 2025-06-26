import { modeEverySVG, modeMentionSVG } from '../../icons.js';
import { KG_Chat_Empowerment } from '../../panels/settings/settings.js';

import { isCtrlKeyPressed, isAltKeyPressed } from '../../helpers/hotkeyState.js';

import { addPulseEffect } from '../../animations.js';
import { createCustomTooltip } from '../../components/tooltip.js';

let messageMode, messageModeIcon;

export function createMessageModeButton(panel) {
  const tooltipTexts = {
    'every-message': { en: 'Notify about every message', ru: 'Уведомлять о каждом сообщении' },
    'mention-message': { en: 'Notify about mention message', ru: 'Уведомлять только о сообщениях с упоминанием' }
  };
  messageMode = document.createElement('div');
  const state = KG_Chat_Empowerment.messageSettings.messageModeState || 'every-message';
  messageMode.classList.add("empowerment-button", "message-mode-button");
  messageMode.id = state;
  createCustomTooltip(messageMode, tooltipTexts[state]);

  messageModeIcon = document.createElement('span');
  messageModeIcon.classList.add('message-mode-icon');
  messageMode.appendChild(messageModeIcon);
  panel.appendChild(messageMode);

  messageMode.addEventListener('click', function () {
    if (!isCtrlKeyPressed && !isAltKeyPressed) {
      addPulseEffect(this);
      if (this.id === 'every-message') {
        this.id = 'mention-message';
        createCustomTooltip(this, tooltipTexts['mention-message']);
        KG_Chat_Empowerment.messageSettings.messageModeState = 'mention-message';
        KG_Chat_Empowerment.messageSettings.messageModeTitle = tooltipTexts['mention-message'].en;
      } else {
        this.id = 'every-message';
        createCustomTooltip(this, tooltipTexts['every-message']);
        KG_Chat_Empowerment.messageSettings.messageModeState = 'every-message';
        KG_Chat_Empowerment.messageSettings.messageModeTitle = tooltipTexts['every-message'].en;
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
