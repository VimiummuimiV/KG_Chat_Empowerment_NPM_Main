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
    store.put({ date, html });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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
    store.delete(date);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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

export async function getTotalChatlogsSizeFromIndexedDB() {
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
      const totalKB = (totalBytes / 1024).toFixed(2);
      resolve(totalKB);
    };
    req.onerror = () => reject(req.error);
  });
}
