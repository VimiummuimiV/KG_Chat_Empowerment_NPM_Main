import { getFullMessageContent } from "./helpers.js";

// Checks if `needle` is a subsequence of `haystack` (letters in order, possibly skipping some)
function isSubsequence(needle, haystack) {
  let i = 0, j = 0;
  while (i < needle.length && j < haystack.length) {
    if (needle[i] === haystack[j]) i++;
    j++;
  }
  return i === needle.length;
}

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Unified normalize function: removes _, -, spaces (does NOT remove commas or dots)
function normalize(text) {
  return text.replace(/[_\-\s]/g, '').toLowerCase();
}

// Fixed highlighting function that properly handles multiple matches
function highlightMatches(element, queryParts, exactMatch) {
  if (!queryParts.length) return;
  
  // Clear existing search highlights
  element.querySelectorAll('.search-match').forEach(span => {
    span.replaceWith(document.createTextNode(span.textContent));
  });
  element.normalize();
  
  // Process each query part separately to avoid stale node references
  for (const part of queryParts) {
    if (part.length < 2) continue;
    
    highlightSinglePart(element, part, exactMatch);
  }
}

function highlightSinglePart(element, part, exactMatch) {
  // Get fresh text nodes for each part
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let fullText = '';
  let node;
  
  while (node = walker.nextNode()) {
    if (node.textContent.trim()) {
      textNodes.push({ node, start: fullText.length, text: node.textContent });
      fullText += node.textContent;
    }
  }
  
  if (!fullText.trim()) return;
  
  // Find all matches for this part
  const matches = [];
  const searchText = exactMatch ? fullText : fullText.toLowerCase();
  const searchPart = exactMatch ? part : part.toLowerCase();
  
  // Find direct matches
  let index = 0;
  while ((index = searchText.indexOf(searchPart, index)) !== -1) {
    matches.push({ start: index, end: index + searchPart.length });
    index++;
  }
  
  // For fuzzy matching, also try normalized matching
  if (!exactMatch) {
    const normalizedText = normalize(fullText);
    const normalizedPart = normalize(part);
    
    for (let i = 0; i <= fullText.length - normalizedPart.length; i++) {
      for (let len = normalizedPart.length; len <= Math.min(fullText.length - i, normalizedPart.length * 2); len++) {
        if (normalize(fullText.substring(i, i + len)) === normalizedPart) {
          matches.push({ start: i, end: i + len });
          break;
        }
      }
    }
  }
  
  // Remove overlaps and sort
  if (matches.length === 0) return;
  
  const sortedMatches = matches.sort((a, b) => a.start - b.start);
  const uniqueMatches = sortedMatches
    .filter((match, i) => {
      return !sortedMatches.slice(0, i).some(prev => match.start < prev.end && match.end > prev.start);
    })
    .reverse(); // Process from end to avoid index shifting
  
  // Apply highlights
  uniqueMatches.forEach(match => {
    applyHighlightToMatch(textNodes, match);
  });
}

function applyHighlightToMatch(textNodes, match) {
  // Find text nodes that intersect with this match
  const affectedNodes = textNodes.filter(nodeInfo => {
    const nodeEnd = nodeInfo.start + nodeInfo.text.length;
    return match.start < nodeEnd && match.end > nodeInfo.start;
  });
  
  // Process affected nodes
  affectedNodes.forEach(nodeInfo => {
    const nodeEnd = nodeInfo.start + nodeInfo.text.length;
    const localStart = Math.max(0, match.start - nodeInfo.start);
    const localEnd = Math.min(nodeInfo.text.length, match.end - nodeInfo.start);
    
    if (localStart < localEnd && nodeInfo.node.parentNode) {
      const text = nodeInfo.node.textContent;
      const fragment = document.createDocumentFragment();
      
      // Add text before match
      if (localStart > 0) {
        fragment.appendChild(document.createTextNode(text.substring(0, localStart)));
      }
      
      // Add highlighted match
      const span = document.createElement('span');
      span.className = 'search-match';
      span.textContent = text.substring(localStart, localEnd);
      fragment.appendChild(span);
      
      // Add text after match
      if (localEnd < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(localEnd)));
      }
      
      // Replace the node
      nodeInfo.node.parentNode.replaceChild(fragment, nodeInfo.node);
    }
  });
}

/**
 * Retrieves details from message items including usernames and message text.
 * @param {Element[]} messageItems - Array of message item DOM elements
 * @returns {Array<{username: string, messageText: string, usernameElement: Element, messageTextElement: Element}>}
 */
export function getMessageDetails(messageItems) {
  return messageItems.map(item => {
    const usernameElement = item.querySelector('.message-username');
    const username = usernameElement ? usernameElement.textContent.toLowerCase().trim() : '';
    const messageTextElement = item.querySelector('.message-text');
    const messageText = messageTextElement ? getFullMessageContent(messageTextElement).toLowerCase().trim() : '';
    return { 
      username, 
      messageText, 
      usernameElement, 
      messageTextElement,
      originalUsername: usernameElement ? usernameElement.textContent.trim() : '',
      originalMessageText: messageTextElement ? getFullMessageContent(messageTextElement).trim() : ''
    };
  });
}

/**
 * Filters message items based on the provided query and displays matching messages.
 * @param {string} query - The search query
 */
export function filterMessages(query) {
  // If the query contains only digits, hyphens, or colons, do nothing
  if (/^[\d-:]+$/.test(query.trim())) {
    // Clear any existing highlighting when query is cleared
    clearAllHighlighting();
    return;
  }

  // Define search prefixes without colons
  const searchPrefixes = {
    user: {
      en: ['user', 'username', 'nickname', 'name', 'nick'],
      ru: ['пользователь', 'ник', 'имя', 'никнейм']
    },
    word: {
      en: ['msg', 'message', 'content', 'word', 'text'],
      ru: ['сообщение', 'текст', 'слово', 'контент']
    }
  };

  const userPrefixes = [...searchPrefixes.user.en, ...searchPrefixes.user.ru];
  const wordPrefixes = [...searchPrefixes.word.en, ...searchPrefixes.word.ru];
  
  // Create regex patterns for exact match (::) and fuzzy match (:)
  const userExactRegex = new RegExp(`^(${userPrefixes.join('|')})::`, 'i');
  const userFuzzyRegex = new RegExp(`^(${userPrefixes.join('|')}):(?!:)`, 'i');
  const wordExactRegex = new RegExp(`^(${wordPrefixes.join('|')})::`, 'i');
  const wordFuzzyRegex = new RegExp(`^(${wordPrefixes.join('|')}):(?!:)`, 'i');

  let forceUser = false, forceWord = false, exactMatch = false;
  let queryStr = query.trim();
  
  // Check for exact match prefixes first (double colon)
  if (userExactRegex.test(queryStr)) {
    forceUser = true;
    exactMatch = true;
    queryStr = queryStr.replace(userExactRegex, '');
  } else if (wordExactRegex.test(queryStr)) {
    forceWord = true;
    exactMatch = true;
    queryStr = queryStr.replace(wordExactRegex, '');
  } else if (userFuzzyRegex.test(queryStr)) {
    forceUser = true;
    queryStr = queryStr.replace(userFuzzyRegex, '');
  } else if (wordFuzzyRegex.test(queryStr)) {
    forceWord = true;
    queryStr = queryStr.replace(wordFuzzyRegex, '');
  }

  // Determine separator and search logic
  let queryParts = [];
  let originalQueryParts = []; // Keep original parts for highlighting
  let useOrLogic = false; // Default to AND logic
  
  if (queryStr.includes(',')) {
    // Comma separation: OR logic for multiple users/terms
    queryParts = queryStr.split(',').map(part => {
      const trimmed = part.trim();
      return exactMatch ? trimmed.toLowerCase() : normalize(trimmed);
    }).filter(Boolean);
    originalQueryParts = queryStr.split(',').map(part => part.trim()).filter(Boolean);
    useOrLogic = true;
  } else if ([".", "|", "\\", "/"].some(sep => queryStr.includes(sep))) {
    // Dot, pipe, backslash, or slash separation: OR logic for word-only search
    queryParts = queryStr.split(/[.|\\/]/).map(part => {
      const trimmed = part.trim();
      return exactMatch ? trimmed.toLowerCase() : normalize(trimmed);
    }).filter(Boolean);
    originalQueryParts = queryStr.split(/[.|\\/]/).map(part => part.trim()).filter(Boolean);
    useOrLogic = true;
    forceWord = true; // Force word search when using these separators
  } else {
    // Single term or space-separated terms: AND logic
    const trimmed = queryStr.trim();
    queryParts = [exactMatch ? trimmed.toLowerCase() : normalize(trimmed)].filter(Boolean);
    originalQueryParts = [trimmed].filter(Boolean);
    useOrLogic = false;
  }

  // Retrieve message and date items within the filterMessages function
  const containerSelector = '.messages-search-container';
  const allElements = Array.from(
    document.querySelectorAll(
      `${containerSelector} > .date-item, ${containerSelector} > .message-item`
    )
  );
  const messageItems = allElements.filter(el => el.classList.contains('message-item'));

  const messageDetails = getMessageDetails(messageItems); // Get the message details
  // Use the query parts for empty check
  const isEmptyQuery = !queryParts.length;

  // Clear all highlighting if empty query
  if (isEmptyQuery) {
    clearAllHighlighting();
  }

  // Username/text search: partial, fuzzy, and subsequence match (for fuzzy matching)
  function normalizedMatch(normalizedValue, part) {
    // Ignore too-short search parts (avoid matching single letters)
    if (part.length < 2) return false;
    // Partial match: search part is contained anywhere in the value
    if (normalizedValue.includes(part)) return true;
    // Fuzzy match: search part is one typo away from the value
    if (part.length >= 3 && levenshtein(normalizedValue, part) === 1) return true;
    // Subsequence match: search part letters appear in order in the value, possibly skipping some
    if (part.length >= 3 && isSubsequence(part, normalizedValue)) return true;
    // No match
    return false;
  }

  // Exact match function (case-insensitive but preserves spaces, hyphens, underscores)
  function exactMatchFunction(originalValue, part, isUsername = false) {
    const val = originalValue.toLowerCase();
    return isUsername ? val === part : val.includes(part);
  }

  // Compact matching logic
  function getMatchTargets(username, messageText, normalizedUsername, normalizedMessageText) {
    if (exactMatch) {
      // For exact match, use original values (lowercased for case-insensitive comparison)
      if (forceUser) return [username];
      if (forceWord) return [messageText];
      return [username, messageText];
    } else {
      // For fuzzy match, use normalized values
      if (forceUser) return [normalizedUsername];
      if (forceWord) return [normalizedMessageText];
      return [normalizedUsername, normalizedMessageText];
    }
  }

  function matchesQuery(targets, queryParts, useOrLogic, isExactMatch, isUserSearch = false) {
    const matchFn = useOrLogic ? 'some' : 'every';
    const matchFunction = isExactMatch ? 
      (target, part) => exactMatchFunction(target, part, isUserSearch) : 
      normalizedMatch;
    return queryParts[matchFn](part => 
      targets.some(target => matchFunction(target, part))
    );
  }

  messageItems.forEach((item, index) => {
    const messageContainer = item.closest('.message-item');
    const messageDetailsItem = messageDetails[index];
    
    const normalizedUsername = normalize(messageDetailsItem.username);
    const normalizedMessageText = normalize(messageDetailsItem.messageText);
    
    const shouldDisplay = isEmptyQuery || 
      matchesQuery(
        getMatchTargets(
          messageDetailsItem.username,
          messageDetailsItem.messageText,
          normalizedUsername,
          normalizedMessageText
        ),
        queryParts,
        useOrLogic,
        exactMatch,
        forceUser
      );

    messageContainer.classList.toggle('hidden-message', !shouldDisplay);

    // Apply highlighting only to visible messages
    if (shouldDisplay && !isEmptyQuery) {
      // Highlight username if not forcing word search only
      if (!forceWord && messageDetailsItem.usernameElement) {
        highlightMatches(
          messageDetailsItem.usernameElement, 
          originalQueryParts, 
          exactMatch
        );
      }
      
      // Highlight message text if not forcing user search only
      if (!forceUser && messageDetailsItem.messageTextElement) {
        highlightMatches(
          messageDetailsItem.messageTextElement, 
          originalQueryParts, 
          exactMatch
        );
      }
    } else if (!shouldDisplay) {
      // Clear highlighting from hidden messages
      if (messageDetailsItem.usernameElement) {
        messageDetailsItem.usernameElement.querySelectorAll('.search-match').forEach(span => {
          span.replaceWith(document.createTextNode(span.textContent));
        });
      }
      if (messageDetailsItem.messageTextElement) {
        messageDetailsItem.messageTextElement.querySelectorAll('.search-match').forEach(span => {
          span.replaceWith(document.createTextNode(span.textContent));
        });
      }
    }
  });

  // --- Hide date headers with no visible messages (class-based) ---
  // Find all date-item elements
  const dateItems = allElements.filter(el => el.classList.contains('date-item'));
  for (let i = 0; i < dateItems.length; i++) {
    const dateItem = dateItems[i];
    // Find all message-items between this dateItem and the next dateItem
    let nextDateIndex = allElements.indexOf(dateItem) + 1;
    let hasVisibleMessage = false;
    while (nextDateIndex < allElements.length && !allElements[nextDateIndex].classList.contains('date-item')) {
      const el = allElements[nextDateIndex];
      if (el.classList.contains('message-item') && !el.classList.contains('hidden-message')) {
        hasVisibleMessage = true;
        break;
      }
      nextDateIndex++;
    }
    // Show or hide the date header using a class
    dateItem.classList.toggle('hidden-date', !hasVisibleMessage);
  }
}

// Helper function to clear all highlighting
function clearAllHighlighting() {
  document.querySelectorAll('.search-match').forEach(span => {
    span.replaceWith(document.createTextNode(span.textContent));
  });
}