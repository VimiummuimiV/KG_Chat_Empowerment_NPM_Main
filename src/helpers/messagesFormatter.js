import { getCurrentLanguage, getMessageTextWithImgTitles } from "../helpers/helpers.js";
import { getUsernameHue, hslToHex } from "./colorUtils.js";

const lang = getCurrentLanguage();

/**
 * Formats messages for export in BBCode, Markdown, or Plain text
 * @param {HTMLElement} container - DOM element containing messages
 * @param {string} format - 'bbcode', 'markdown', or 'plain'
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted message string
 */
export function formatMessages(container, format, options = {}) {
  const {
    date = null,
    includeDateHeaders = true,
    includeMessageLinks = true,
    hueStep = 15,
    prefix = ''
  } = options;

  // Hue map for consistent username colors
  const usernameHueMap = {};

  // Gather visible elements
  const elements = Array.from(
    container.querySelectorAll(
      '.date-item, .message-item'
    )
  ).filter(el => {
    const style = window.getComputedStyle(el);
    return style.contentVisibility !== 'hidden' && style.display !== 'none';
  });

  let output = '';
  let isFirstLine = true;
  
  // BBCode header
  if (format === 'bbcode') output += '[hide]\n';
  
  // Track current date for grouping
  let currentDate = null;

  elements.forEach(el => {
    if (el.classList.contains('date-item') && includeDateHeaders) {
      // Get date text without emoji icon
      const dateTextElement = el.querySelector('.date-text');
      const dateText = dateTextElement ? 
        dateTextElement.textContent : 
        el.textContent.replace(/[📅⏳]+$/, '').trim();
      
      currentDate = dateText;
      
      if (!isFirstLine) output += '\n';
      
      if (format === 'bbcode') {
        output += `[b][color=gray]${dateText}[/color][/b]\n`;
      } else if (format === 'markdown') {
        output += `**${dateText}**\n`;
      } else {
        output += `${dateText}\n`;
      }
      isFirstLine = false;

      output += `${prefix}: `;
    }
    else if (el.classList.contains('message-item')) {
      // Message item
      const time = el.querySelector('.message-time')?.textContent || '';
      const username = el.querySelector('.message-username')?.textContent || '';
      const messageTextElement = el.querySelector('.message-text');
      const message = messageTextElement ? 
        getMessageTextWithImgTitles(messageTextElement) : '';
      
      // Create message URL
      const effectiveDate = date || currentDate || new Date().toISOString().slice(0,10);
      const url = includeMessageLinks ? 
        `https://klavogonki.ru/chatlogs/${effectiveDate}.html#${time.replace(/[\[\]]/g, '')}` : '';
      
      // Get username color
      const hue = getUsernameHue(username, hueStep, usernameHueMap);
      const color = hslToHex(hue, 80, 50);
      
      if (format === 'bbcode') {
        const bbMessage = message
          .replace(/(^|\s|\():(\w+):(?=\s|\.|,|!|\?|$)/g, 
            (m, pre, word) => `${pre}[img]https://klavogonki.ru/img/smilies/${word}.gif[/img]`);
        
        output += url ? 
          `[url=${url}]${time}[/url] ` : 
          `${time} `;
          
        output += `[color=${color}]${username}[/color] ${bbMessage}\n`;
      } 
      else if (format === 'markdown') {
        output += url ? 
          `[${time}](${url}) ` : 
          `${time} `;
          
        output += `**${username}** ${message}\n`;
      } 
      else {
        output += `[${time}] `;
        output += `(${username}) ${message}\n`;
      }
      isFirstLine = false;
    }
  });

  if (format === 'bbcode') output += '[/hide]\n';
  return output;
}

/**
 * Handles export logic for Alt+Click and Alt+Shift+Click
 * @param {MouseEvent} event - Click event
 * @param {HTMLElement} container - Messages container
 * @param {Object} options - Export options
 */
export function handleExportClick(event, container, options = {}) {
  // Only handle Alt+Click events
  if (!event.altKey) return;
  
  // Prompt for format
  const formatMap = { '1': 'bbcode', '2': 'markdown', '3': 'plain' };
  const promptText = lang === 'ru' ? 
    'Формат экспорта? (1 = BBCode, 2 = Markdown, 3 = Plain)' : 
    'Export format? (1 = BBCode, 2 = Markdown, 3 = Plain)';
  
  let formatNum = prompt(promptText, '1');
  // Exit if user cancels the prompt
  if (formatNum === null) return;

  let format = formatMap[formatNum.trim()];
  if (!format) format = 'bbcode';

  // Generate formatted output
  const output = formatMessages(container, format, options);
  if (!output) return;

  // Alt+Shift+Click: Save as file
  if (event.shiftKey) {
    const blob = new Blob([output], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    
    // Generate filename
    const prefix = options.prefix;
    const datePart = options.date ? `_${options.date}` : '';
    a.download = `${prefix}_${datePart}_${format}.txt`;
    
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  } 
  // Alt+Click: Copy to clipboard
  else {
    navigator.clipboard.writeText(output).catch(() => {
      alert(lang === 'ru' ? 'Не удалось скопировать сообщения' : 'Failed to copy messages');
    });
  }
}