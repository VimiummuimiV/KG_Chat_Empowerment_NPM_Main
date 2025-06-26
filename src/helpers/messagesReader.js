import { textToSpeech } from '../components/voice-engine.js';
import { voiceSpeed } from '../components/mode/sound-mode.js';

let isReading = false;
const newMessages = new Set();

export function addMessageToQueue(message) {
  if (!newMessages.has(message)) {
    newMessages.add(message);
    if (!isReading) {
      isReading = true;
      processMessages();
    }
  }
}

async function processMessages() {
  for (const message of newMessages) {
    await textToSpeech(message, voiceSpeed);
    newMessages.delete(message);
  }
  isReading = false;
}
