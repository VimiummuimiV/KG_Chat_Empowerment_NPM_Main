const svgUrl = "http://www.w3.org/2000/svg";
const iconStrokeWidth = 2;
const iconSize = 28;

// SVG icon for entering
const enterSVGStrokeColor = "currentColor";
export const enterSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 12}"
      height="${iconSize - 12}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${enterSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="icon-enter icon-feather icon-log-in">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
    <polyline points="10 17 15 12 10 7"></polyline>
    <line x1="15" y1="12" x2="3" y2="12"></line>
  </svg>`;

// SVG icon for leaving
const leaveSVGStrokeColor = "currentColor";
export const leaveSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 12}"
      height="${iconSize - 12}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${leaveSVGStrokeColor}" stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="icon-leave icon-feather icon-log-out">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>`;

// SVG icon for the moderator with gradient
const moderatorSVGStopColorStart = "rgb(255, 215, 0)";
const moderatorSVGStopColorEnd = "rgb(255, 140, 0)";
export const moderatorSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 10}"
      height="${iconSize - 10}"
      viewBox="0 0 24 24"
      fill="url(#moderatorGradient)"  <!-- Use a gradient fill -->
      stroke="none"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-shield">
    <!-- Define the gradient -->
    <defs>
        <linearGradient id="moderatorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: ${moderatorSVGStopColorStart}; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: ${moderatorSVGStopColorEnd}; stop-opacity: 1" />
        </linearGradient>
    </defs>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>`;

// SVG icon for the tracked with gradient stroke
const trackedSVGStopColorStart = "rgb(135, 206, 250)";
const trackedSVGStopColorEnd = "rgb(0, 191, 255)";
export const trackedSVG = `
  <svg xmlns="${svgUrl}"
       width="${iconSize - 12}"
       height="${iconSize - 12}"
       viewBox="0 0 24 24"
       fill="url(#trackedGradient)"  <!-- Use a gradient fill -->
       class="feather feather-star">
      <!-- Define the gradient for the fill -->
    <defs>
      <linearGradient id="trackedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color: ${trackedSVGStopColorStart}; stop-opacity: 1" />
        <stop offset="100%" style="stop-color: ${trackedSVGStopColorEnd}; stop-opacity: 1" />
      </linearGradient>
    </defs>
    <!-- Use the gradient for the fill -->
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      stroke="url(#trackedGradient)"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round">
    </polygon>
  </svg>`;

// SVG icon for ignored users
const ignoredSVGStrokeColor = "rgb(255, 160, 122)";
export const ignoredSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 12}"
      height="${iconSize - 12}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${ignoredSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-slash">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>`;

// SVG markup for a clock icon
const clockSVGStrokeColor = "currentColor";
export const clockSVG = `
  <svg xmlns="${svgUrl}"
       width="${iconSize - 12}"
       height="${iconSize - 12}"
       viewBox="0 0 24 24"
       fill="none"
       stroke="${clockSVGStrokeColor}"
       stroke-width="${iconStrokeWidth}"
       stroke-linecap="round" stroke-linejoin="round" class="feather feather-clock">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>`;

// SVG for the "chevron right" icon, used in a popup chat messages
const actionSVGStrokeColor = "currentColor";
export const actionSVG = `
    <svg xmlns="${svgUrl}"
        width="${iconSize - 12}"
        height="${iconSize - 12}"
        viewBox="0 0 24 24"
        fill="none"
        stroke="${actionSVGStrokeColor}"
        stroke-width="${iconStrokeWidth}"
        stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>`;

// SVG markup for a user icon
const userSVGStrokeColor = "currentColor";
export const userSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 12}"
      height="${iconSize - 12}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${userSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-user">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>`;

// Button SVG icons "silence", "beep", "voice" representation
const silenceSVGStrokeColor = "hsl(355, 80%, 65%)";
const beepSVGStrokeColor = "hsl(55, 80%, 65%)";
const voiceSVGStrokeColor = "hsl(80, 80%, 40%)";
export const silenceSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize}"
      height="${iconSize}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${silenceSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>`;

export const beepSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize}"
      height="${iconSize}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${beepSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity="0.3"></path>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>`;

export const voiceSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize}"
      height="${iconSize}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${voiceSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>`;

// Icons for message mode button
// Button SVG icons "every", "mention" representation
const modeEverySVGStrokeColor = "hsl(100, 50%, 50%)";
export const modeEverySVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize}"
      height="${iconSize}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${modeEverySVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>`;

const modeMentionSVGStrokeColor = "hsl(180, 60%, 50%)";
export const modeMentionSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize}"
      height="${iconSize}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${modeMentionSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>`;

// Icon for the out of range value
const rangeIsOutSVGStrokeColor = "currentColor";
export const rangeIsOutSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 12}"
      height="${iconSize - 12}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${rangeIsOutSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-slash">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>`;

// Icon for userlistCache
const userlistCacheSVGStrokeColor = "rgb(180, 213, 131)";
export const userlistCacheSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize}"
      height="${iconSize}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${userlistCacheSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-database">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>`;

// Icon for personal messages
const personalMessagesSVGStrokeColor = "rgb(255, 160, 122)";
export const personalMessagesSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize}"
      height="${iconSize}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${personalMessagesSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-mail">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>`;

// Icon for chat logs
const chatLogsSVGStrokeColor = "rgb(100, 149, 237)";
export const chatLogsSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize}"
      height="${iconSize}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${chatLogsSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-message-circle">
      <path 
          d="M21 11.5 a8.38 8.38 0 0 1 -.9 3.8 a8.5 8.5 0 0 1 -7.6 4.7 a8.38 8.38 0 0 1 -3.8 -.9
          L3 21 l1.9 -5.7 a8.38 8.38 0 0 1 -.9 -3.8 a8.5 8.5 0 0 1 4.7 -7.6
          a8.38 8.38 0 0 1 3.8 -.9 h.5 a8.48 8.48 0 0 1 8 8 v.5 z">
      </path>
  </svg>`;

// Icon for media messages
export const mediaMessagesSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-film">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="7" x2="7" y2="7"></line>
    <line x1="2" y1="17" x2="7" y2="17"></line>
    <line x1="17" y1="17" x2="22" y2="17"></line>
    <line x1="17" y1="7" x2="22" y2="7"></line>
  </svg>`;

// Icon for the disabled chat button
const deniedSVGStrokeColor = "rgb(255, 100, 100)";
export const deniedSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 12}"
      height="${iconSize - 12}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${deniedSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-slash">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>`;

// Inline SVG source for the settings icon
const settingsSVGStrokeColor = "rgb(255, 228, 196)";
export const settingsSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${settingsSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-sliders">
    <line x1="4" y1="21" x2="4" y2="14"></line>
    <line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line>
    <line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line>
    <line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>`;

// Inline SVG source for the "x" icon (close button)
const closeSVGStrokeColor = "rgb(144, 238, 144)";
export const closeSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${closeSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-x">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>`;

// Inline SVG source for the "chevrons up" icon
const chevronsSVGStrokeColor = "rgb(211, 211, 211)";
export const chevronsUpSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${chevronsSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevrons-up">
    <polyline points="17 11 12 6 7 11"></polyline>
    <polyline points="17 18 12 13 7 18"></polyline>
  </svg>`;

// Inline SVG source for the "chevron up" icon
export const chevronUpSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${chevronsSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-up">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>`;

// Inline SVG source for the "chevron down" icon
export const chevronDownSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${chevronsSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>`;

// Inline SVG source for the "chevrons down" icon
export const chevronsDownSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${chevronsSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevrons-down">
    <polyline points="7 13 12 18 17 13"></polyline>
    <polyline points="7 6 12 11 17 6"></polyline>
  </svg>`;

// Inline SVG source for the "toggle-right" icon
const toggleRightSVGStrokeColor = "rgb(137, 187, 255)";
export const toggleRightSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 25 25"
      fill="none"
      stroke="${toggleRightSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-toggle-right">
    <rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
    <circle cx="16" cy="12" r="3"></circle>
  </svg>`;

// Inline SVG source for the "toggle-left" icon
const toggleLeftSVGStrokeColor = "rgb(137, 187, 255)";
export const toggleLeftSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 25 25"
      fill="none"
      stroke="${toggleLeftSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-toggle-left">
    <rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
    <circle cx="8" cy="12" r="3"></circle>
  </svg>`;

// Inline SVG source for the "calendar" icon
const calendarSVGStrokeColor = "rgb(176, 196, 222)";
export const calendarSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${calendarSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>`;

// Inline SVG source for the "clipboard" icon
const clipboardSVGStrokeColor = "rgb(176, 196, 222)";
export const clipboardSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${clipboardSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-clipboard">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  </svg>`;

// SVG for the "chevron left" icon, used to change chat logs one day backward
const chevronLeftSVGStrokeColor = "rgb(28, 229, 229)";
export const chevronLeftSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${chevronLeftSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>`;

// SVG for the "chevron right" icon, used to change chat logs one day forward
const chevronRightSVGStrokeColor = "rgb(28, 229, 229)";
export const chevronRightSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${chevronRightSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right">
      <polyline points="9 18 15 12 9 6"></polyline>
  </svg>`;

// SVG for the "shuffle" icon, used to select a random year, month, and day
const shuffleSVGStrokeColor = "rgb(169, 155, 255)";
export const shuffleSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${shuffleSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-shuffle">
    <polyline points="16 3 21 3 21 8"></polyline>
    <line x1="4" y1="20" x2="21" y2="3"></line>
    <polyline points="21 16 21 21 16 21"></polyline>
    <line x1="15" y1="15" x2="21" y2="21"></line>
    <line x1="4" y1="4" x2="9" y2="9"></line>
  </svg>`;

// Inline SVG source for the trash icon
const trashSVGStrokeColor = "rgb(255, 140, 0)";
export const trashSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${trashSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>`;

// Inline SVG source for the users icon
const usersSVGStrokeColor = "currentColor";
export const usersSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${usersSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-users">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>`;

// Inline SVG source for the "import" icon (export button)
const importSVGStrokeColor = "rgb(209, 144, 238)";
export const importSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${importSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-download">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>`;

// Inline SVG source for the "export" icon (import button)
const exportSVGStrokeColor = "rgb(144, 185, 238)";
export const exportSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${exportSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}" stroke-linecap="round"
      stroke-linejoin="round" class="feather feather-upload">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>`;

// Inline SVG source for the "save" icon (save button)
const saveSVGStrokeColor = "rgb(144, 238, 220)";
export const saveSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${saveSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-save">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>`;

// Inline SVG source for the "remove" icon (remove button)
const removeSVGStrokeColor = "rgb(238, 144, 144)";
export const removeSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 12}"
      height="${iconSize - 12}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${removeSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>`;

// Inline SVG source for the "snowflake" icon
const snowflakeSVGStrokeColor = "rgb(176, 196, 222)";
export const snowflakeSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 8}"
      height="${iconSize - 8}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${snowflakeSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-snowflake">
    <g id="snowflake">
      <line x1="12.06" y1="2.74" x2="12.06" y2="12.06" />
      <line x1="20.12" y1="7.4" x2="12.06" y2="12.06" />
      <line x1="20.12" y1="16.71" x2="12.06" y2="12.06" />
      <line x1="12.06" y1="21.37" x2="12.06" y2="12.06" />
      <line x1="3.99" y1="16.71" x2="12.06" y2="12.06" />
      <line x1="3.99" y1="7.4" x2="12.06" y2="12.06" />
      <polyline points="8.96,4.67 12.06,7.77 15.16,4.67"/>
      <polyline points="16.9,5.68 15.76,9.92 20,11.05"/>
      <polyline points="20,13.06 15.76,14.2 16.9,18.43"/>
      <polyline points="15.16,19.44 12.06,16.34 8.96,19.44"/>
      <polyline points="7.21,18.43 8.35,14.2 4.11,13.06"/>
      <polyline points="4.11,11.05 8.35,9.92 7.21,5.68"/>
    </g>
  </svg>`;

// Inline SVG source for the "add" icon (add button)
const addSVGStrokeColor = "rgb(209, 144, 238)";
export const addSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 12}"
      height="${iconSize - 12}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${addSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>`;

// Inline SVG source for the "play" icon (parse inception button)
const playSVGStrokeColor = "hsl(150, 70%, 60%)";
export const playSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${playSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-play">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>`;

// Inline SVG source for the "pause" icon (parse pause button)
const pauseSVGStrokeColor = "hsl(150, 70%, 60%)";
export const pauseSVG = `
  <svg xmlns="${svgUrl}"
      width="${iconSize - 4}"
      height="${iconSize - 4}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${pauseSVGStrokeColor}"
      stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-pause">
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>`;