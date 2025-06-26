// Checks if a URL is valid and contains encoded characters.
export function isEncodedURL(url) {
  const urlPattern = /^https?:\/\//; // Regex pattern to check if the value is a URL
  const encodedPattern = /%[0-9A-Fa-f]{2}/; // Regex pattern to check if the URL is encoded
  return urlPattern.test(url) && encodedPattern.test(url);
}

// Decodes a URL and replaces spaces with underscores.
export function decodeURL(url) {
  const [base] = url.split('#'); // Split at the '#' symbol and take the base part
  return decodeURIComponent(base).replace(/ /g, '_'); // Decode and replace spaces with underscores
}

/**
 * Processes and decodes all encoded links in a given message container type.
 * @param {string} type - One of 'generalMessages', 'chatlogsMessages', 'personalMessages'.
 */
export function processEncodedLinks(type) {
  document.querySelector(({
    generalMessages: ".messages-content div", // General messages container
    chatlogsMessages: ".chat-logs-container", // Chat logs container
    personalMessages: ".messages-container-wrapper" // Personal messages container
  })[type])?.querySelectorAll('a:not(.media):not(.decoded)').forEach(link => {
    try {
      if (isEncodedURL(link.href)) {
        let decoded = decodeURL(link.href);
        link.href = link.textContent = decoded;
        link.classList.add('decoded');
      }
    } catch (error) {
      console.error('Error decoding link:', error, link.href);
    }
  });
}
