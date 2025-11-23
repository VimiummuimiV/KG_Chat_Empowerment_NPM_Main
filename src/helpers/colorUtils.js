import { extractHexColor, getDataByName } from "./apiData.js";
import { USER_DATA_CACHE_KEY } from "../definitions.js";

export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const delta = max - min;
    s = l < 0.5 ? delta / (max + min) : delta / (2 - max - min);
    h = (
      max === r
        ? (g - b) / delta + (g < b ? 6 : 0)
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4
    ) / 6;
  }
  h = Math.round(h * 360);
  s = Math.min(Math.round(s * 100), 90);
  l = Math.round(l * 100);
  if (h > 215 && h < 280) {
    h = h < 255 ? 215 : 280;
  }
  return { h, s, l };
}

export function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) r = g = b = l * 255;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      return t < 1 / 6 ? p + (q - p) * 6 * t :
        t < 1 / 2 ? q :
          t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 :
            p;
    };
    r = Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255);
    g = Math.round(hue2rgb(p, q, h / 360) * 255);
    b = Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert HSL to HEX
 * @param {number} h - Hue degree between 0 and 360
 * @param {number} s - Saturation percentage between 0 and 100
 * @param {number} l - Lightness percentage between 0 and 100
 * @returns {string} Hex color string in the form "#rrggbb"
 */
export function hslToHex(h, s, l) {
  // normalize s, l to [0,1]
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);

  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(color * 255)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Converts an RGB color string to HEX
 * @param {string} rgb - RGB color string (e.g., "rgb(128, 128, 128)")
 * @returns {string} - HEX color string (e.g., "#808080")
 */
export function rgbToHex(rgb) {
  if (!rgb || typeof rgb !== 'string') return '#808080'; // Fallback to gray
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (!match) return '#808080'; // Fallback to gray if invalid
  const [, r, g, b] = match.map(Number);
  // Ensure values are within valid range (0-255)
  const validR = Math.max(0, Math.min(255, r));
  const validG = Math.max(0, Math.min(255, g));
  const validB = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) + (validR << 16) + (validG << 8) + validB).toString(16).slice(1).padStart(6, '0')}`;
}

/**
 * Converts a hexadecimal color string to its RGB components.
 *
 * @param {string} hex - A hex color string in the format '#RRGGBB' or 'RRGGBB'.
 * @returns {{ r: number, g: number, b: number }} An object with the red, green, and blue values (0-255).
 * @throws {Error} If the input is not a valid hex color string.
 *
 * @example
 * // returns { r: 255, g: 165, b: 0 }
 * const rgb = hexToRgb('#FFA500');
 */
export function hexToRgb(hex) {
  // Remove leading '#' if present
  const normalizedHex = hex.replace(/^#/, '');

  // Validate hex string length and characters
  if (!/^[0-9A-Fa-f]{6}$/.test(normalizedHex)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  // Parse the three pairs of hex digits
  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);

  return { r, g, b };
}

/**
 * Normalizes a username color to ensure minimum lightness and consistent output.
 * @param {string|object} inputColor - The color value (HEX string, RGB string, or HSL object/string)
 * @param {"hex"|"rgb"|"hsl"} [inputType="rgb"] - The type of the input color
 * @param {number} [minLightness=60] - Minimum lightness for contrast boost (0-100)
 * @returns {string} - Normalized HEX color string (e.g., "#808080")
 */
export function normalizeUsernameColor(inputColor, inputType = "rgb", minLightness = 65) {
  let r, g, b, h, s, l;
  if (inputType === "hex") {
    // Convert HEX to RGB
    const rgb = hexToRgb(inputColor);
    r = rgb.r; g = rgb.g; b = rgb.b;
    ({ h, s, l } = rgbToHsl(r, g, b));
  } else if (inputType === "rgb") {
    // Parse RGB string
    if (typeof inputColor === "string") {
      [r, g, b] = inputColor.match(/\d+/g).map(Number);
    } else if (typeof inputColor === "object" && inputColor.r !== undefined) {
      r = inputColor.r; g = inputColor.g; b = inputColor.b;
    }
    ({ h, s, l } = rgbToHsl(r, g, b));
  } else if (inputType === "hsl") {
    // Accept either HSL object or string
    if (typeof inputColor === "string") {
      [h, s, l] = inputColor.match(/\d+/g).map(Number);
    } else if (typeof inputColor === "object" && inputColor.h !== undefined) {
      h = inputColor.h; s = inputColor.s; l = inputColor.l;
    }
  } else {
    throw new Error("Unsupported inputType for normalizeUsernameColor: " + inputType);
  }

  // Adjust lightness to ensure it's at least minLightness (default 60 for more contrast)
  const normalizedLightness = l < minLightness ? minLightness : l;
  const rgbString = hslToRgb(h, s, normalizedLightness);
  return rgbToHex(rgbString);
}

/**
 * Loads and caches username colors and IDs for a list of usernames.
 * Updates localStorage cache USER_DATA_CACHE_KEY.
 * Returns updated userData object.
 */
export async function cacheUserData(usernames, userDataKey = USER_DATA_CACHE_KEY) {
  let userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
  const usernamesToFetch = usernames.filter(username => !(username in userData));
  if (usernamesToFetch.length) {
    const userDataResults = await Promise.all(
      usernamesToFetch.map(username => getDataByName(username, 'allUserData'))
    );
    usernamesToFetch.forEach((username, i) => {
      const fetched = userDataResults[i];
      if (fetched) {
        const carColor = fetched.car ? extractHexColor(fetched.car.color) : null;
        userData[username] = {
          id: fetched.id || null,
          color: carColor && carColor.startsWith('#')
            ? normalizeUsernameColor(carColor, "hex")
            : '#808080',
            change: 'auto'
        };
      } else {
        userData[username] = {
          id: null,
          color: '#808080',
          change: 'auto'
        };
      }
    });
    localStorage.setItem(userDataKey, JSON.stringify(userData));
  }
  return userData;
}