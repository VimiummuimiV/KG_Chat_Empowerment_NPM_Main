import {
  createTrackedItem,
  createMentionItem,
  createReplacementItem,
  createModeratorItem,
  createIgnoredItem,
  createToggleItem
} from './settingsCreators.js';

// Process toggle settings separately with categorization and defaults
export const toggleSettingsConfig = [
  {
    emoji: '👀',
    description: 'Show chat static notifications',
    image: 'https://i.imgur.com/oUPSi9I.jpeg',
    category: 'notifications',
    type: 'static'
  },
  {
    emoji: '👀',
    description: 'Show global dynamic notifications',
    image: 'https://i.imgur.com/8ffCdUG.jpeg',
    category: 'notifications',
    type: 'dynamic'
  },
  {
    emoji: '🔊',
    description: 'Play sound and voice notifications, messages only when the tab is inactive',
    image: 'https://i.imgur.com/6PXFIES.jpeg',
    category: 'sound',
    type: 'activity'
  },
  {
    emoji: '🔊',
    description: 'Play a beep sound and speak feedback when the user enters or leaves the chat',
    image: 'https://i.imgur.com/6PXFIES.jpeg',
    category: 'sound',
    type: 'presence'
  },
  {
    emoji: '🔊',
    description: 'Switch to google TTS engine if available',
    image: 'https://i.imgur.com/0H94LII.jpeg',
    category: 'sound',
    type: 'gTTS'
  },
  {
    emoji: '📦️',
    description: 'Create participants counter',
    image: 'https://i.imgur.com/rqIVAgH.jpeg',
    category: 'elements',
    type: 'counter'
  },
  {
    emoji: '🌐',
    description: 'Interface language',
    image: '',
    category: 'ui',
    type: 'language',
    languages: [
      { value: 'en', label: '🇬🇧 English' },
      { value: 'ru', label: '🇷🇺 Русский' }
    ]
  }
];

// Define all settings keys in camelCase format
export const settingsConfig = [
  {
    type: 'tracked',
    emoji: '👀',
    key: 'usersToTrack',
    selector: '.settings-tracked-container',
    creator: createTrackedItem
  },
  {
    type: 'mention',
    emoji: '📢',
    key: 'mentionKeywords',
    selector: '.settings-mention-container',
    creator: createMentionItem
  },
  {
    type: 'replacement',
    emoji: '♻️',
    key: 'usernameReplacements',
    selector: '.settings-replacement-container',
    creator: createReplacementItem
  },
  {
    type: 'moderator',
    emoji: '⚔️',
    key: 'moderator',
    selector: '.settings-moderator-container',
    creator: createModeratorItem
  },
  {
    type: 'ignored',
    emoji: '🛑',
    key: 'ignored',
    selector: '.settings-ignored-container',
    creator: createIgnoredItem
  },
  {
    type: 'toggle',
    emoji: '🔘',
    key: 'toggle',
    selector: '.settings-toggle-container',
    creator: createToggleItem
  }
];