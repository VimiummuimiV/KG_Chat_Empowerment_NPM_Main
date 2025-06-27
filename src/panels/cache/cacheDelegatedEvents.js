import { loadProfileIntoIframe } from "../../helpers/iframeProfileLoader.js";
import { createStaticNotification } from "../../components/notifications/notifications.js";
import { calculateTimeOnSite } from "./cacheHelpers.js";
import { adjustVisibility } from "../../helpers/elementVisibility.js";
import { enterSVG, leaveSVG } from "../../icons.js";
import { profileBaseUrl, myUserId } from "../../definitions.js";

export function setupCacheDelegatedEvents(fetchedUsersContainer) {
  // Delegated event listener for metrics and login elements
  fetchedUsersContainer.addEventListener('click', (event) => {
    const metric = event.target.closest('.best-speed, .rating-level, .cars-count, .friends-count');
    if (metric) {
      const url = metric.dataset.url;
      if (url) loadProfileIntoIframe(url);
      return;
    }

    const login = event.target.closest('.login');
    if (login) {
      event.preventDefault();
      const userId = login.href.split('/').pop();
      const profileUrl = profileBaseUrl + userId;
      const messageInProfile = `${profileBaseUrl}${myUserId}/messages/${userId}/`;
      if (event.ctrlKey && event.shiftKey) {
        const newTab = window.open(messageInProfile, '_blank');
        if (newTab) newTab.focus();
      } else if (event.ctrlKey) {
        loadProfileIntoIframe(messageInProfile);
      } else {
        loadProfileIntoIframe(profileUrl);
      }
      return;
    }

    const visits = event.target.closest('.visits');
    if (visits) {
      event.stopPropagation();
      let shouldProcessActionLog = true;
      const userId = visits.dataset.userId;
      const users = JSON.parse(localStorage.getItem('fetchedUsers')) || {};
      const user = users[userId];
      const actionLog = user?.actionLog;

      if (user) {
        let actionLogContainer = document.querySelector('.action-log');
        if (!actionLogContainer) {
          actionLogContainer = document.createElement('div');
          actionLogContainer.className = 'action-log';
          fetchedUsersContainer.appendChild(actionLogContainer);
          adjustVisibility(actionLogContainer, 'show', 1);
        } else {
          actionLogContainer.replaceChildren();
        }

        if (actionLog && shouldProcessActionLog) {
          actionLog.forEach((action, index) => {
            if (!shouldProcessActionLog || typeof action !== 'object' || !action) return;
            const { type, timestamp } = action;
            const userAction = visits.closest('.user-item').querySelector('.login').textContent || 'Unknown User';
            const actionIconType = type === 'enter' ? enterSVG : leaveSVG;
            const userPresence = type === 'enter';
            setTimeout(() => {
              if (shouldProcessActionLog) {
                createStaticNotification(userAction, actionIconType, timestamp, userPresence, 'cachePanel');
              }
            }, 10 * (index + 1));
          });
        }
        const closeActionLog = (e) => {
          if (!actionLogContainer.contains(e.target) || e.code === 'Space') {
            if (e.code === 'Space') e.preventDefault();
            adjustVisibility(actionLogContainer, 'hide', 0);
            shouldProcessActionLog = false;
            ['click', 'keydown'].forEach(evt => document.removeEventListener(evt, closeActionLog));
          }
        };
        ['click', 'keydown'].forEach(evt => document.addEventListener(evt, closeActionLog));
      } else {
        console.error('User data not found');
      }
    }
  });

  // Delegated event listener for hover effects on registered elements
  fetchedUsersContainer.addEventListener('mouseover', (event) => {
    const registered = event.target.closest('.registered');
    if (registered && fetchedUsersContainer.contains(registered)) {
      registered._originalContent = registered.textContent;
      registered._hoverTimer = setTimeout(() => {
        const userItem = registered.closest('.user-item');
        const login = userItem?.querySelector('.login');
        const userId = login?.href?.split('/').pop();
        const users = JSON.parse(localStorage.getItem('fetchedUsers')) || {};
        const userData = users[userId] || { registered: registered.textContent };
        registered.textContent = calculateTimeOnSite(userData.registered);
      }, 300);
    }
  });

  fetchedUsersContainer.addEventListener('mouseout', (event) => {
    const registered = event.target.closest('.registered');
    if (registered && fetchedUsersContainer.contains(registered)) {
      clearTimeout(registered._hoverTimer);
      if (registered._originalContent) {
        registered.textContent = registered._originalContent;
      }
    }
  });
}