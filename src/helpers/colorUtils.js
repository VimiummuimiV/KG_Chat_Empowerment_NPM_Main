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

export function normalizeUsernameColor(initialColor) {
  const [r, g, b] = initialColor.match(/\d+/g).map(Number);
  const { h, s, l } = rgbToHsl(r, g, b);

  // Adjust lightness to ensure it's at least 50
  const normalizedLightness = l < 50 ? 50 : l;
  const finalColor = hslToRgb(h, s, normalizedLightness);

  // Round the RGB values in one go
  return finalColor;
}