// Emoji icon constants
const INFO = '📌️';
const EDIT = '✏️';
const WARN = '⚠️';
const SEARCH = '🔍';
const USER = '👤';
const EXAMPLE = '📋';

export const chatlogsParserMessages = {
  // Mode selection messages
  selectParseMode: { // Prompt
    en: [
      `${INFO} Select parse mode`,
      '1. Single date',
      '2. From date',
      '3. Date range',
      '4. From start',
      '5. From registered date'
    ].join('\n'),
    ru: [
      `${INFO} Выберите режим парсинга`,
      '1. Одна дата',
      '2. С даты',
      '3. Диапазон дат',
      '4. С самого начала',
      '5. С даты регистрации'
    ].join('\n')
  },
  invalidSelection: { // Alert
    en: `${WARN} Invalid selection.`,
    ru: `${WARN} Неверный выбор.`
  },

  // Date input messages
  enterDateRange: { // Prompt
    en: [
      `${EDIT} Enter date range`,
      `${EXAMPLE} Examples:`,
      '2024-01-01 - 2024-01-07',
      '20240101 - 20240107',
      '2024:01:01 - 2024:01:07',
      '240101 - 240107',
      '24-02-02 - 24-03-03'
    ].join('\n'),
    ru: [
      `${EDIT} Введите диапазон дат`,
      `${EXAMPLE} Примеры:`,
      '2024-01-01 - 2024-01-07',
      '20240101 - 20240107',
      '2024:01:01 - 2024:01:07',
      '240101 - 240107',
      '24-02-02 - 24-03-03'
    ].join('\n')
  },
  invalidRange: { // Alert
    en: `${WARN} Invalid range format or one/both dates out of bounds. Please try again.`,
    ru: `${WARN} Неверный формат диапазона или одна/обе даты вне допустимого диапазона. Пожалуйста, попробуйте снова.`
  },
  enterFromDate: { // Prompt
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
  invalidFromDate: { // Alert
    en: `${WARN} Invalid FROM date format or date out of bounds. Please try again.`,
    ru: `${WARN} Неверный формат начальной даты или дата вне допустимого диапазона. Пожалуйста, попробуйте снова.`
  },
  enterSingleDate: { // Prompt
    en: [
      `${EDIT} Enter a date`,
      `${EXAMPLE} Examples:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101'
    ].join('\n'),
    ru: [
      `${EDIT} Введите дату`,
      `${EXAMPLE} Примеры:`,
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101'
    ].join('\n')
  },
  invalidDate: { // Alert
    en: `${WARN} Invalid date format or date out of bounds. Please try again.`,
    ru: `${WARN} Неверный формат даты или дата вне допустимого диапазона. Пожалуйста, попробуйте снова.`
  },

  // Username input messages
  enterUsernames: { // Prompt
    en: [
      `${USER} Enter username(s) to parse (comma-separated):`,
      `${INFO} Leave empty to search messages from all users.`
    ].join('\n'),
    ru: [
      `${USER} Введите имя или имена пользователей для парсинга (через запятую):`,
      `${INFO} Оставьте пустым, чтобы искать сообщения всех пользователей.`
    ].join('\n')
  },
  userNotFound: { // Alert
    en: username => `${WARN} User not found: ${username}`,
    ru: username => `${WARN} Пользователь не найден: ${username}`
  },
  usersNotFound: { // Alert
    en: usernames => `${WARN} The following usernames are invalid or not found:\n${usernames.join(', ')}`,
    ru: usernames => `${WARN} Следующие имена пользователей неверны или не найдены:\n${usernames.join(', ')}`
  },
  retrieveHistoryPrompt: { // Prompt
    en: `${INFO} Do you want to retrieve all previous history usernames for this user? (1 - yes, 2 - no)`,
    ru: `${INFO} Хотите получить все предыдущие имена пользователей для этого пользователя? (1 - да, 2 - нет)`
  },
  confirmUsernames: { // Prompt
    en: `${EDIT} Confirm or edit the list of usernames to parse (comma-separated):`,
    ru: `${EDIT} Подтвердите или отредактируйте список имён для парсинга (через запятую):`
  },

  // Mode 5 specific messages (fromregistered)
  noUsersSelected: { // Alert
    en: `${WARN} No users selected.`,
    ru: `${WARN} Не выбраны пользователи.`
  },
  unableToGetRegDate: { // Alert
    en: `${WARN} Could not get registration date.`,
    ru: `${WARN} Не удалось получить дату регистрации.`
  },
  editStartDate: { // Prompt
    en: minDate => `${EDIT} From which date to start parsing? (registration date: ${minDate})`,
    ru: minDate => `${EDIT} С какой даты начать парсинг? (дата регистрации: ${minDate})`
  },
  invalidEditedDate: { // Alert
    en: `${WARN} Invalid date format.`,
    ru: `${WARN} Неверный формат даты.`
  },
  dateBeforeMinimal: { // Alert
    en: minAllowed => `${WARN} Chat logs are only available from ${minAllowed}. Using this date.`,
    ru: minAllowed => `${WARN} Логи чата доступны только с ${minAllowed}. Используется эта дата.`
  },

  // Search terms messages
  enterSearchTerms: { // Prompt
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
  searchAllUsersRequired: { // Alert
    en: `${WARN} When searching all users, you must provide search terms to filter messages.`,
    ru: `${WARN} При поиске по всем пользователям необходимо указать поисковые слова для фильтрации сообщений.`
  },

  // No messages found messages
  noMessagesFoundAll: { // UI Message
    en: searchTerms => `${WARN} No messages found containing the search terms: ${searchTerms.join(', ')}`,
    ru: searchTerms => `${WARN} Сообщения, содержащие слова: ${searchTerms.join(', ')}, не найдены.`
  },
  noMessagesFoundSome: { // UI Message
    en: searchTerms => `${WARN} No messages found for the selected user(s) containing the search terms: ${searchTerms.join(', ')}`,
    ru: searchTerms => `${WARN} Сообщения выбранных пользователей, содержащие слова: ${searchTerms.join(', ')}, не найдены.`
  },
  noMessagesFound: { // UI Message
    en: `${WARN} No messages found for the selected user(s).`,
    ru: `${WARN} Сообщения для выбранных пользователей не найдены.`
  },

  // Deletion messages
  deleteConfirm: { // Confirm
    en: `${WARN} Are you sure you want to delete all saved chatlogs?`,
    ru: `${WARN} Вы уверены, что хотите удалить все сохранённые чатлоги?`
  },
  deleteSuccess: { // Alert
    en: `${INFO} All chatlogs deleted and cache size reset.`,
    ru: `${INFO} Все чатлоги удалены, размер кэша сброшен.`
  }
};
