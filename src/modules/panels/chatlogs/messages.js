export const chatlogsParserMessages = {
  selectParseMode: {
    en: [
      'Select parse mode',
      '1. Single date',
      '2. From date',
      '3. Date range',
      '4. From start'
    ].join('\n'),
    ru: [
      'Выберите режим парсинга',
      '1. Одна дата',
      '2. С даты',
      '3. Диапазон дат',
      '4. С самого начала'
    ].join('\n')
  },
  enterDateRange: {
    en: [
      'Enter date range',
      'Examples:',
      '2024-01-01 - 2024-01-07',
      '20240101 - 20240107',
      '2024:01:01 - 2024:01:07',
      '240101 - 240107',
      '24-02-02 - 24-03-03',
    ].join('\n'),
    ru: [
      'Введите диапазон дат',
      'Примеры:',
      '2024-01-01 - 2024-01-07',
      '20240101 - 20240107',
      '2024:01:01 - 2024:01:07',
      '240101 - 240107',
      '24-02-02 - 24-03-03',
    ].join('\n')
  },
  invalidRange: {
    en: 'Invalid range format or one/both dates out of bounds. Please try again.',
    ru: 'Неверный формат диапазона или одна/обе даты вне допустимого диапазона. Пожалуйста, попробуйте снова.'
  },
  enterFromDate: {
    en: [
      'Enter FROM date',
      'Examples:',
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
      'Range will be FROM this date to today.'
    ].join('\n'),
    ru: [
      'Введите начальную дату',
      'Примеры:',
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
      'Диапазон будет с этой даты до сегодня.'
    ].join('\n')
  },
  invalidFromDate: {
    en: 'Invalid FROM date format or date out of bounds. Please try again.',
    ru: 'Неверный формат начальной даты или дата вне допустимого диапазона. Пожалуйста, попробуйте снова.'
  },
  enterSingleDate: {
    en: [
      'Enter a date',
      'Examples:',
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
    ].join('\n'),
    ru: [
      'Введите дату',
      'Примеры:',
      '2024-01-01',
      '20240101',
      '2024:01:01',
      '240101',
    ].join('\n')
  },
  invalidDate: {
    en: 'Invalid date format or date out of bounds. Please try again.',
    ru: 'Неверный формат даты или дата вне допустимого диапазона. Пожалуйста, попробуйте снова.'
  },
  invalidSelection: {
    en: 'Invalid selection.',
    ru: 'Неверный выбор.'
  },
  enterUsernames: {
    en: [
      'Enter username(s) to parse (comma-separated):',
      'Leave empty to search messages from all users.'
    ].join('\n'),
    ru: [
      'Введите имя или имена пользователей для парсинга (через запятую):',
      'Оставьте пустым, чтобы искать сообщения всех пользователей.'
    ].join('\n')
  },
  userNotFound: {
    en: username => `User not found: ${username}`,
    ru: username => `Пользователь не найден: ${username}`
  },
  usersNotFound: {
    en: usernames => `The following usernames are invalid or not found:\n${usernames.join(', ')}`,
    ru: usernames => `Следующие имена пользователей неверны или не найдены:\n${usernames.join(', ')}`
  },
  retrieveHistoryPrompt: {
    en: 'Do you want to retrieve all previous history usernames for this user? (1 - yes, 2 - no)',
    ru: 'Хотите получить все предыдущие имена пользователей для этого пользователя? (1 - да, 2 - нет)'
  },
  confirmUsernames: {
    en: 'Confirm or edit the list of usernames to parse (comma-separated):',
    ru: 'Подтвердите или отредактируйте список имён для парсинга (через запятую):'
  },
  enterSearchTerms: {
    en: searchAllUsers => [
      'Enter search terms to filter messages (comma-separated):',
      searchAllUsers
        ? 'This will search through all users\' messages for the specified terms.'
        : 'Leave empty to show all messages from selected users.',
      'Examples:',
      'hello, dude',
      'creature, spammer, troll',
      'Note: Search is case-insensitive and will find messages containing ANY of the terms.'
    ].join('\n'),
    ru: searchAllUsers => [
      'Введите поисковое слово или слова для фильтрации сообщений (через запятую):',
      searchAllUsers
        ? 'Будет производиться поиск по всем сообщениям пользователей для указанных слов.'
        : 'Оставьте пустым, для поиска всех сообщений выбранных пользователей.',
      'Примеры:',
      'привет, чувак',
      'чучело, спамер, тролль',
      'Примечание: поиск не чувствителен к регистру и найдёт сообщения, содержащие ЛЮБОЕ из слов.'
    ].join('\n')
  },
  searchAllUsersRequired: {
    en: 'When searching all users, you must provide search terms to filter messages.',
    ru: 'При поиске по всем пользователям необходимо указать поисковые слова для фильтрации сообщений.'
  },
  noMessagesFoundAll: {
    en: searchTerms => `No messages found containing the search terms: ${searchTerms.join(', ')}`,
    ru: searchTerms => `Сообщения, содержащие слова: ${searchTerms.join(', ')}, не найдены.`
  },
  noMessagesFoundSome: {
    en: searchTerms => `No messages found for the selected user(s) containing the search terms: ${searchTerms.join(', ')}`,
    ru: searchTerms => `Сообщения выбранных пользователей, содержащие слова: ${searchTerms.join(', ')}, не найдены.`
  },
  noMessagesFound: {
    en: 'No messages found for the selected user(s).',
    ru: 'Сообщения для выбранных пользователей не найдены.'
  }
};
