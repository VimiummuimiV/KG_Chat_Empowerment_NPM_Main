import { createCustomTooltip } from "../../components/tooltip.js";

export function setupCacheTooltips(sortButtonsContainer, fetchedUsersContainer) {
  // Delegated tooltips for sort buttons
  createCustomTooltip(
    '.sort-button',
    sortButtonsContainer,
    (el) => {
      if (el.classList.contains('online')) {
        return {
          en: 'Sort by online status',
          ru: 'Сортировать по статусу онлайн'
        };
      }
      if (el.classList.contains('offline')) {
        return {
          en: 'Sort by offline status',
          ru: 'Сортировать по статусу оффлайн'
        };
      }
      if (el.classList.contains('rankSpeed')) {
        return {
          en: 'Sort by rank and speed',
          ru: 'Сортировать по рангу и скорости'
        };
      }
      if (el.classList.contains('ratingLevel')) {
        return {
          en: 'Sort by rating level',
          ru: 'Сортировать по уровню рейтинга'
        };
      }
      if (el.classList.contains('carsCount')) {
        return {
          en: 'Sort by cars count',
          ru: 'Сортировать по количеству машин'
        };
      }
      if (el.classList.contains('friendsCount')) {
        return {
          en: 'Sort by friends count',
          ru: 'Сортировать по количеству друзей'
        };
      }
      if (el.classList.contains('visitsCount')) {
        return {
          en: 'Sort by visits count',
          ru: 'Сортировать по количеству посещений'
        };
      }
      if (el.classList.contains('alpha')) {
        return {
          en: 'Sort alphabetically',
          ru: 'Сортировать по алфавиту'
        };
      }
      if (el.classList.contains('registered')) {
        return {
          en: 'Sort by registration date',
          ru: 'Сортировать по дате регистрации'
        };
      }
    });

  // Delegated tooltips for user metrics
  createCustomTooltip(
    '.waiting,' +
    '.online,' +
    '.offline,' +
    '.login,' +
    '.visits,' +
    '.best-speed,' +
    '.rating-level,' +
    '.cars-count,' +
    '.friends-count',
    fetchedUsersContainer,
    (el) => {
      if (el.classList.contains('waiting')) {
        return {
          en: 'Waiting for presence status',
          ru: 'Ожидание статуса присутствия'
        };
      }
      if (el.classList.contains('online')) {
        return {
          en: 'Online',
          ru: 'Онлайн'
        };
      }
      if (el.classList.contains('offline')) {
        return {
          en: 'Offline',
          ru: 'Оффлайн'
        };
      }

      if (el.classList.contains('login')) {
        return {
          en: ` 
            [Click] to open profile in iframe (summary)
            [Ctrl + Click] to open profile in iframe (messages)
            [Ctrl + Shift + Click] to open profile in a new tab (messages)
          `,
          ru: ` 
            [Клик] открыть профиль в iframe (сводка)
            [Ctrl + Клик] открыть профиль в iframe (сообщения)
            [Ctrl + Shift + Клик] открыть профиль в новой вкладке (сообщения)
          `
        }
      }

      if (el.classList.contains('visits')) {
        const userItem = el.closest('.user-item');
        const loginElement = userItem?.querySelector('.login');
        const loginText = loginElement?.textContent || '';
        return {
          en: `View action log for ${loginText}`,
          ru: `Посмотреть журнал действий для ${loginText}`
        }
      }

      if (el.classList.contains('best-speed')) {
        return { en: 'Best speed', ru: 'Лучшая скорость' };
      }
      if (el.classList.contains('rating-level')) {
        return { en: 'Rating level', ru: 'Уровень рейтинга' };
      }
      if (el.classList.contains('cars-count')) {
        return { en: 'Cars count', ru: 'Количество машин' };
      }
      if (el.classList.contains('friends-count')) {
        return { en: 'Friends count', ru: 'Количество друзей' };
      }
      return { en: '', ru: '' };
    },
    true
  );
}