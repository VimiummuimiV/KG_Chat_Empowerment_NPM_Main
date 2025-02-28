// Declare variables for the message mode button and its icon
let messageMode, messageModeIcon;

export function createMessageModeButton(panel) {
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
  panel.appendChild(messageMode);
}

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