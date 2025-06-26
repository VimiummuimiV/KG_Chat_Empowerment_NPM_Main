// Utility for getting all relevant chat DOM elements
export const getChatElements = () => {
  const activeTab = localStorage.getItem('activeChatTab') || 'game';
  const isGameLocation = window.location.href.includes('gmid');

  // Determine selectors based on activeTab and isGameLocation
  const chatFieldSelector = isGameLocation
    ? (activeTab === 'game' ? '[id^="chat-game"] .text' : '#chat-general .text')
    : '#chat-general .text';

  const chatSendSelector = isGameLocation
    ? (activeTab === 'game' ? '[id^="chat-game"] .send' : '#chat-general .send')
    : '#chat-general .send';

  const messagesContainerSelector = isGameLocation
    ? (activeTab === 'game' ? '[id^="chat-game"] .messages' : '#chat-general .messages')
    : '#chat-general .messages';

  // Get user lists for both chat types
  const userList = {
    game: document.querySelector('[id^="chat-game"] .userlist-content'),
    general: document.querySelector('#chat-general .userlist-content')
  };

  // Get the currently active tab based on localStorage's activeTab value (used for restore)
  const activeChatTab = document.querySelector(
    isGameLocation
      ? (activeTab === 'game' ? '.game.c' : '.general.c')
      : (activeTab === 'general' ? '.general.c' : '.game.c')
  );

  // Get next tab to switch (either general or game)
  const nextChatTab = document.querySelector(
    isGameLocation
      ? (document.querySelector('.game.c.active') ? '.general.c' : '.game.c')
      : (document.querySelector('.general.c.active') ? '.game.c' : '.general.c')
  );

  // Select all messages from both general and game chats
  const allMessages = document.querySelectorAll('.messages-content p');

  // Query the messages container
  const messagesContainer = document.querySelector(messagesContainerSelector);

  return {
    chatField: document.querySelector(chatFieldSelector),
    chatSend: document.querySelector(chatSendSelector),
    activeChatTab,
    nextChatTab,
    chatHidden: document.querySelector('#chat-wrapper.chat-hidden'),
    allMessages,
    messagesContainer,
    userList
  };
};
