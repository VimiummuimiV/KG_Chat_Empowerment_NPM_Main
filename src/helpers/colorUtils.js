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

export function normalizeUsernameColor(initialColor) {
  const [r, g, b] = initialColor.match(/\d+/g).map(Number);
  const { h, s, l } = rgbToHsl(r, g, b);

  // Adjust lightness to ensure it's at least 50
  const normalizedLightness = l < 50 ? 50 : l;
  const finalColor = hslToRgb(h, s, normalizedLightness);

  // Round the RGB values in one go
  return finalColor;
}

/**
 * Generates consistent hue for username using step-based hashing
 * @param {string} username - Username to generate hue for
 * @param {number} hueStep - Hue increment step (default 15)
 * @param {Object} hueMap - Cache object for storing hues
 * @returns {number} - Hue value between 0-360
 */
export function getUsernameHue(username, hueStep = 15, hueMap = {}) {
  if (hueMap[username]) return hueMap[username];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  
  // Generate hue in 0-210 range with step increments
  const hue = Math.abs(hash) % (210 / hueStep) * hueStep;
  hueMap[username] = hue;
  return hue;
}