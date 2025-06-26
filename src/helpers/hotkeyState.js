// Tracks the state of Ctrl and Alt keys globally
export let isCtrlKeyPressed = false;
export let isAltKeyPressed = false;

function setKeyState(key, value) {
  if (key === 'Control') isCtrlKeyPressed = value;
  if (key === 'Alt') isAltKeyPressed = value;
}

['keydown', 'keyup'].forEach(eventType =>
  document.addEventListener(eventType, event => setKeyState(event.key, eventType === 'keydown'))
);

['blur', 'focus'].forEach(eventType =>
  document.addEventListener(eventType, () => {
    if (isCtrlKeyPressed || isAltKeyPressed) {
      console.log(`${isCtrlKeyPressed ? 'Ctrl ' : ''}${isAltKeyPressed ? 'Alt ' : ''}key was true`);
      isCtrlKeyPressed = false;
      isAltKeyPressed = false;
    }
  })
);
