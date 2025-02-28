// Font configuration array
const fonts = [
  { family: 'Montserrat', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { family: 'Orbitron', weights: ['400', '500', '600', '700', '800', '900'] },
  { family: 'Roboto Mono', weights: ['100', '200', '300', '400', '500', '600', '700'] }
];

// Helper function to inject individual fonts
function appendFontLink(fontFamily, fontWeights) {
  const existingFont = document.querySelector(`.font-${fontFamily.replace(/\s/g, '-')}`);
  if (!existingFont) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s/g, '+')}:wght@${fontWeights.join(';')}&display=swap`;
    fontLink.classList.add(`font-${fontFamily.replace(/\s/g, '-')}`);
    document.head.appendChild(fontLink);
  }
}

export async function setupFonts() {
  try {
    fonts.forEach(font => {
      appendFontLink(font.family, font.weights);
    });
  } catch (error) {
    console.error('Font loading failed:', error);
  }
}