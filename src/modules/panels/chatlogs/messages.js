// Emoji icon constants
const INFO = '📌️';
const EDIT = '✏️';
const WARN = '⚠️';
const SEARCH = '🔍';
const USER = '👤';
const EXAMPLE = '📋';

export const chatlogsParserMessages = {
  selectParseMode: {
    en: [
      `${INFO} Select parse mode`,
      '1. Single date',
      '2. From date',
      '3. Date range',
      '4. From start'
    ].join('\n'),
    ru: [
      `${INFO} Выберите режим парсинга`,
      '1. Одна дата',
      '2. С даты',
      '3. Диапазон дат',
      '4. С самого начала'
    ].join('\n')
  },
  enterDateRange: {
    en: [
      `${EDIT} Enter date range`,
      `${EXAMPLE} Examples:`,
      '2024-01-01 - 2024-01-07',
      '20240101 - 20240107',
      '2024:01:01 - 2024:01:07',
      '240101 - 240107',
      '24-02-02 - 24-03-03',
    ].join('\n'),
    ru: [
      `${EDIT} Введите диапазон дат`,
      `${EXAMPLE} Примеры:`,
      '2024-01-01 - 2024-01-07',
      '20240101 - 20240107',
      '2024:01:01 - 2024:01:07',
      '240101 - 240107',
      '24-02-02 - 24-03-03',
    ].join('\n')
  },
  invalidRange: {
    en: `${WARN} Invalid range format or one/both dates out of bounds. Please try again.`,
    ru: `${WARN} Неверный формат диапазона или одна/обе даты вне допустимого диапазона. Пожалуйста, попробуйте снова.`
  },
  enterFromDate: {
    en: [
      `${EDIT} Enter FROM date`,
      `${EXAMPLE} Examples:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
      `${INFO} Range will be FROM this date to today.`
    ].join('\n'),
    ru: [
      `${EDIT} Введите начальную дату`,
      `${EXAMPLE} Примеры:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
      `${INFO} Диапазон будет с этой даты до сегодня.`
    ].join('\n')
  },
  invalidFromDate: {
    en: `${WARN} Invalid FROM date format or date out of bounds. Please try again.`,
    ru: `${WARN} Неверный формат начальной даты или дата вне допустимого диапазона. Пожалуйста, попробуйте снова.`
  },
  enterSingleDate: {
    en: [
      `${EDIT} Enter a date`,
      `${EXAMPLE} Examples:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
    ].join('\n'),
    ru: [
      `${EDIT} Введите дату`,
      `${EXAMPLE} Примеры:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
    ].join('\n')
  },
  invalidDate: {
    en: `${WARN} Invalid date format or date out of bounds. Please try again.`,
    ru: `${WARN} Неверный формат даты или дата вне допустимого диапазона. Пожалуйста, попробуйте снова.`
  },
  invalidSelection: {
    en: `${WARN} Invalid selection.`,
    ru: `${WARN} Неверный выбор.`
  },
  enterUsernames: {
    en: [
      `${USER} Enter username(s) to parse (comma-separated):`,
      `${INFO} Leave empty to search messages from all users.`
    ].join('\n'),
    ru: [
      `${USER} Введите имя или имена пользователей для парсинга (через запятую):`,
      `${INFO} Оставьте пустым, чтобы искать сообщения всех пользователей.`
    ].join('\n')
  },
  userNotFound: {
    en: username => `${WARN} User not found: ${username}`,
    ru: username => `${WARN} Пользователь не найден: ${username}`
  },
  usersNotFound: {
    en: usernames => `${WARN} The following usernames are invalid or not found:\n${usernames.join(', ')}`,
    ru: usernames => `${WARN} Следующие имена пользователей неверны или не найдены:\n${usernames.join(', ')}`
  },
  retrieveHistoryPrompt: {
    en: `${INFO} Do you want to retrieve all previous history usernames for this user? (1 - yes, 2 - no)`,
    ru: `${INFO} Хотите получить все предыдущие имена пользователей для этого пользователя? (1 - да, 2 - нет)`
  },
  confirmUsernames: {
    en: `${EDIT} Confirm or edit the list of usernames to parse (comma-separated):`,
    ru: `${EDIT} Подтвердите или отредактируйте список имён для парсинга (через запятую):`
  },
  enterSearchTerms: {
    en: searchAllUsers => [
      `${SEARCH} Enter search terms to filter messages (comma-separated):`,
      searchAllUsers
        ? `${INFO} This will search through all users' messages for the specified terms.`
        : `${INFO} Leave empty to show all messages from selected users.`,
      `${EXAMPLE} Examples:`,
      'hello, dude',
      'creature, spammer, troll',
      `${INFO} Note: Search is case-insensitive and will find messages containing ANY of the terms.`
    ].join('\n'),
    ru: searchAllUsers => [
      `${SEARCH} Введите поисковое слово или слова для фильтрации сообщений (через запятую):`,
      searchAllUsers
        ? `${INFO} Будет производиться поиск по всем сообщениям пользователей для указанных слов.`
        : `${INFO} Оставьте пустым, для поиска всех сообщений выбранных пользователей.`,
      `${EXAMPLE} Примеры:`,
      'привет, чувак',
      'чучело, спамер, тролль',
      `${INFO} Примечание: поиск не чувствителен к регистру и найдёт сообщения, содержащие ЛЮБОЕ из слов.`
    ].join('\n')
  },
  searchAllUsersRequired: {
    en: `${WARN} When searching all users, you must provide search terms to filter messages.`,
    ru: `${WARN} При поиске по всем пользователям необходимо указать поисковые слова для фильтрации сообщений.`
  },
  noMessagesFoundAll: {
    en: searchTerms => `${WARN} No messages found containing the search terms: ${searchTerms.join(', ')}`,
    ru: searchTerms => `${WARN} Сообщения, содержащие слова: ${searchTerms.join(', ')}, не найдены.`
  },
  noMessagesFoundSome: {
    en: searchTerms => `${WARN} No messages found for the selected user(s) containing the search terms: ${searchTerms.join(', ')}`,
    ru: searchTerms => `${WARN} Сообщения выбранных пользователей, содержащие слова: ${searchTerms.join(', ')}, не найдены.`
  },
  noMessagesFound: {
    en: `${WARN} No messages found for the selected user(s).`,
    ru: `${WARN} Сообщения для выбранных пользователей не найдены.`
  }
};
