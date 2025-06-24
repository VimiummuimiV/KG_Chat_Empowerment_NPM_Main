const DB_NAME = 'chatlogsDB';
const STORE_NAME = 'chatlogs';
const DB_VERSION = 1;

export function initChatlogsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'date' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveChatlogToIndexedDB(date, html) {
  const db = await initChatlogsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(date);
    req.onsuccess = () => {
      const prevSize = req.result && typeof req.result.html === 'string'
        ? new Blob([req.result.html]).size
        : 0;
      const newSize = new Blob([html]).size;
      store.put({ date, html });
      tx.oncomplete = () => {
        // Update cache
        let totalKB = getCachedTotalSize();
        totalKB = totalKB + (newSize - prevSize) / 1024;
        setCachedTotalSize(totalKB);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function readChatlogFromIndexedDB(date) {
  const db = await initChatlogsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(date);
    req.onsuccess = () => resolve(req.result ? req.result.html : null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteChatlogFromIndexedDB(date) {
  const db = await initChatlogsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(date);
    req.onsuccess = () => {
      const prevSize = req.result && typeof req.result.html === 'string'
        ? new Blob([req.result.html]).size
        : 0;
      store.delete(date);
      tx.oncomplete = () => {
        // Update cache
        let totalKB = getCachedTotalSize();
        totalKB = totalKB - prevSize / 1024;
        setCachedTotalSize(Math.max(0, totalKB));
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listAllChatlogDates() {
  const db = await initChatlogsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- Caching logic for total chatlogs size ---
const TOTAL_SIZE_CACHE_KEY = 'chatlogsTotalSizeKB';

function getCachedTotalSize() {
  return parseFloat(localStorage.getItem(TOTAL_SIZE_CACHE_KEY) || '0');
}
function setCachedTotalSize(sizeKB) {
  localStorage.setItem(TOTAL_SIZE_CACHE_KEY, Number(sizeKB).toFixed(2));
}

// Use this for fast UI display
export function getTotalChatlogsSizeCached() {
  return getCachedTotalSize();
}

// Optionally, provide a way to recalculate (e.g. on a button click)
export async function recalculateTotalChatlogsSize() {
  const db = await initChatlogsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      let totalBytes = 0;
      if (Array.isArray(req.result)) {
        for (const entry of req.result) {
          if (entry && typeof entry.html === 'string') {
            totalBytes += new Blob([entry.html]).size;
          }
        }
      }
      const totalKB = totalBytes / 1024;
      setCachedTotalSize(totalKB);
      resolve(totalKB);
    };
    req.onerror = () => reject(req.error);
  });
}
