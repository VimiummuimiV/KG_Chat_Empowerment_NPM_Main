// Emoji icon constants
const INFO = '📌️';
const EDIT = '✏️';
const WARN = '⚠️';
const SEARCH = '🔍';
const USER = '👤';
const CONTENT = '📄';
const CHATLOGS = '📜';
const EXAMPLE = '📋';
const DATE = '📅';

export const chatlogsParserMessages = {
  // Mode selection messages
  selectParseMode: { // Prompt
    en: [
      `${INFO} Select parse mode`,
      '1. Single date',
      '2. From date',
      '3. Date range',
      '4. From start',
      '5. From registered date',
      '6. Personal mentions'
    ].join('\n'),
    ru: [
      `${INFO} Выберите режим парсинга`,
      '1. Одна дата',
      '2. С даты',
      '3. Диапазон дат',
      '4. С самого начала',
      '5. С даты регистрации',
      '6. Личные упоминания'
    ].join('\n')
  },
  invalidSelection: { // Alert
    en: `${WARN} Invalid selection.`,
    ru: `${WARN} Неверный выбор.`
  },

  // Date input messages
  enterDateRange: { // Prompt
    en: [
      `${EDIT} Enter ${DATE} date range`,
      `${EXAMPLE} Examples:`,
      '2024-01-01 - 2024-01-07',
      '20240101 - 20240107',
      '2024:01:01 - 2024:01:07',
      '240101 - 240107',
      '24-02-02 - 24-03-03'
    ].join('\n'),
    ru: [
      `${EDIT} Введите диапазон ${DATE} дат`,
      `${EXAMPLE} Примеры:`,
      '2024-01-01 - 2024-01-07',
      '20240101 - 20240107',
      '2024:01:01 - 2024:01:07',
      '240101 - 240107',
      '24-02-02 - 24-03-03'
    ].join('\n')
  },
  invalidRange: { // Alert
    en: `${WARN} Invalid range format or one/both ${DATE} dates out of bounds. Please try again.`,
    ru: `${WARN} Неверный формат диапазона или одна/обе ${DATE} даты вне допустимого диапазона. Пожалуйста, попробуйте снова.`
  },
  enterFromDate: { // Prompt
    en: [
      `${EDIT} Enter FROM ${DATE} date`,
      `${EXAMPLE} Examples:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
      `${INFO} Range will be FROM this ${DATE} date to today.`
    ].join('\n'),
    ru: [
      `${EDIT} Введите начальную ${DATE} дату`,
      `${EXAMPLE} Примеры:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
      `${INFO} Диапазон будет с этой ${DATE} даты до сегодня.`
    ].join('\n')
  },
  invalidFromDate: { // Alert
    en: `${WARN} Invalid FROM ${DATE} date format or date out of bounds. Please try again.`,
    ru: `${WARN} Неверный формат начальной ${DATE} даты или дата вне допустимого диапазона. Пожалуйста, попробуйте снова.`
  },
  enterSingleDate: { // Prompt
    en: [
      `${EDIT} Enter a ${DATE} date`,
      `${EXAMPLE} Examples:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101'
    ].join('\n'),
    ru: [
      `${EDIT} Введите ${DATE} дату`,
      `${EXAMPLE} Примеры:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101'
    ].join('\n')
  },
  invalidDate: { // Alert
    en: `${WARN} Invalid ${DATE} date format or date out of bounds. Please try again.`,
    ru: `${WARN} Неверный формат ${DATE} даты или дата вне допустимого диапазона. Пожалуйста, попробуйте снова.`
  },

  // Username input messages
  enterUsernames: { // Prompt
    en: [
      `${USER} Enter ${USER} username(s) to parse (comma-separated):`,
      `${INFO} Leave empty to search ${CONTENT} messages from all ${USER} users.`
    ].join('\n'),
    ru: [
      `${USER} Введите имя или имена пользователей для парсинга (через запятую):`,
      `${INFO} Оставьте пустым, чтобы искать ${CONTENT} сообщения всех ${USER} пользователей.`
    ].join('\n')
  },
  userPossiblyBanned: { // Confirm
    en: username => `${WARN} User ${USER} ${username} not found. The user may be banned or deleted. Continue anyway?`,
    ru: username => `${WARN} Пользователь ${USER} ${username} не найден. Возможно, пользователь забанен или удалён. Продолжить в любом случае?`
  },
  retrieveHistoryPrompt: { // Prompt
    en: `${INFO} Do you want to retrieve all previous ${USER} history usernames for this user? (1 - yes, 2 - no)`,
    ru: `${INFO} Хотите получить все предыдущие ${USER} имена пользователей для этого пользователя? (1 - да, 2 - нет)`
  },
  confirmUsernames: { // Prompt
    en: `${EDIT} Confirm or edit the list of ${USER} usernames to parse (comma-separated):`,
    ru: `${EDIT} Подтвердите или отредактируйте список ${USER} имён для парсинга (через запятую):`
  },

  // Mode 5 specific messages (fromregistered)
  noUsersSelected: { // Alert
    en: `${WARN} No ${USER} users selected.`,
    ru: `${WARN} Не выбраны ${USER} пользователи.`
  },
  unableToGetRegDate: { // Alert
    en: `${WARN} Could not get registration ${DATE} date.`,
    ru: `${WARN} Не удалось получить ${DATE} дату регистрации.`
  },
  editStartDate: { // Prompt
    en: minDate => `${EDIT} From which ${DATE} to start parsing? (registration date: ${minDate})`,
    ru: minDate => `${EDIT} С какой ${DATE} начать парсинг? (дата регистрации: ${minDate})`
  },
  invalidEditedDate: { // Alert
    en: `${WARN} Invalid ${DATE} date format.`,
    ru: `${WARN} Неверный формат ${DATE} даты.`
  },
  dateBeforeMinimal: { // Alert
    en: minAllowed => `${WARN} ${CHATLOGS} Chat logs are only available from ${minAllowed}. Using this ${DATE} date.`,
    ru: minAllowed => `${WARN} ${CHATLOGS} Логи чата доступны только с ${minAllowed}. Используется эта ${DATE} дата.`
  },

  // Search terms messages
  enterSearchTerms: { // Prompt
    en: searchAllUsers => [
      `${SEARCH} Enter search terms to filter ${CONTENT} messages (comma-separated):`,
      searchAllUsers
        ? `${INFO} This will search through all ${USER} users' ${CONTENT} messages for the specified terms.`
        : `${INFO} Leave empty to show all ${CONTENT} messages from selected ${USER} users.`,
      `${EXAMPLE} Examples:`,
      'hello, dude',
      'creature, spammer, troll',
      `${INFO} Note: Search is case-insensitive and will find ${CONTENT} messages containing ANY of the terms.`
    ].join('\n'),
    ru: searchAllUsers => [
      `${SEARCH} Введите поисковое слово или слова для фильтрации ${CONTENT} сообщений (через запятую):`,
      searchAllUsers
        ? `${INFO} Будет производиться поиск по всем ${CONTENT} сообщениям ${USER} пользователей для указанных слов.`
        : `${INFO} Оставьте пустым, для поиска всех ${CONTENT} сообщений выбранных ${USER} пользователей.`,
      `${EXAMPLE} Примеры:`,
      'привет, чувак',
      'чучело, спамер, тролль',
      `${INFO} Примечание: поиск не чувствителен к регистру и найдёт ${CONTENT} сообщения, содержащие ЛЮБОЕ из слов.`
    ].join('\n')
  },
  searchAllUsersRequired: { // Alert
    en: `${WARN} When searching all ${USER} users, you must provide search terms to filter ${CONTENT} messages.`,
    ru: `${WARN} При поиске по всем ${USER} пользователям необходимо указать поисковые слова для фильтрации ${CONTENT} сообщений.`
  },

  // Search info messages (UI Messages)
  searchInfoAllUsers: {
    en: searchTerms => `${SEARCH} Searching all ${USER} users for ${CONTENT} messages containing: ${searchTerms.join(', ')}`,
    ru: searchTerms => `${SEARCH} Поиск по всем ${USER} пользователям сообщений ${CONTENT}, содержащих: ${searchTerms.join(', ')}`
  },
  searchInfoSomeUsers: {
    en: (usernames, searchTerms) => `${SEARCH} Searching for ${CONTENT} messages from: ${USER} ${usernames.join(', ')}, containing: ${searchTerms.join(', ')}`,
    ru: (usernames, searchTerms) => `${SEARCH} Поиск ${CONTENT} сообщений от: ${USER} ${usernames.join(', ')}, содержащих: ${searchTerms.join(', ')}`
  },
  searchInfoAllFromUsers: {
    en: usernames => `${SEARCH} Showing all ${CONTENT} messages from: ${USER} ${usernames.join(', ')}`,
    ru: usernames => `${SEARCH} Показаны все ${CONTENT} сообщения от: ${USER} ${usernames.join(', ')}`
  },

  // Date progress info message (UI Message)
  dateProgressInfo: { // UI Message
    en: (initialDate, currentDate, percent) => `${DATE} Start: ${initialDate} | Current: ${currentDate} | Progress: ${percent}%`,
    ru: (initialDate, currentDate, percent) => `${DATE} Начало: ${initialDate} | Текущая: ${currentDate} | Прогресс: ${percent}%`
  },

  // No messages found messages (UI Messages)
  noMessagesFoundAll: { // UI Message
    en: searchTerms => `${WARN} No ${CONTENT} messages found containing the search terms: ${searchTerms.join(', ')}`,
    ru: searchTerms => `${WARN} ${CONTENT} Сообщения, содержащие слова: ${searchTerms.join(', ')}, не найдены.`
  },
  noMessagesFoundSome: { // UI Message
    en: searchTerms => `${WARN} No ${CONTENT} messages found for the selected ${USER} user(s) containing the search terms: ${searchTerms.join(', ')}`,
    ru: searchTerms => `${WARN} ${CONTENT} Сообщения выбранных ${USER} пользователей, содержащие слова: ${searchTerms.join(', ')}, не найдены.`
  },
  noMessagesFound: { // UI Message
    en: `${WARN} No ${CONTENT} messages found for the selected ${USER} user(s).`,
    ru: `${WARN} ${CONTENT} Сообщения для выбранных ${USER} пользователей не найдены.`
  },

  // Deletion messages
  deleteConfirm: { // Confirm
    en: `${WARN} Are you sure you want to delete all saved ${CHATLOGS} chatlogs?`,
    ru: `${WARN} Вы уверены, что хотите удалить все сохранённые ${CHATLOGS} чатлоги?`
  },
  deleteSuccess: { // Alert
    en: `${INFO} All ${CHATLOGS} chatlogs deleted and cache size reset.`,
    ru: `${INFO} Все ${CHATLOGS} чатлоги удалены, размер кэша сброшен.`
  },

  // Personal mentions mode messages
  selectPersonalMentionsDateMode: {
    en: [
      `${INFO} Select date mode for personal mentions`,
      '1. Single date',
      '2. From date',
      '3. Date range',
      '4. From start'
    ].join('\n'),
    ru: [
      `${INFO} Выберите режим дат для личных упоминаний`,
      '1. Одна дата',
      '2. С даты',
      '3. Диапазон дат',
      '4. С самого начала'
    ].join('\n')
  },
  enterMentionKeywords: {
    en: `${EDIT} Enter mention keywords to search (comma-separated):`,
    ru: `${EDIT} Введите ключевые слова для поиска упоминаний (через запятую):`
  },
  noMentionKeywords: {
    en: `${WARN} No mention keywords provided. Please enter at least one keyword.`,
    ru: `${WARN} Не указаны ключевые слова для поиска упоминаний. Введите хотя бы одно слово.`
  }
};
