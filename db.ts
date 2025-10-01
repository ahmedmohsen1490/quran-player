


const DB_NAME = 'quran-player-db';
const DB_VERSION = 2;
const STORE_NAME = 'ayahs';
const TAFSIR_STORE_NAME = 'tafsir';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBRequest).error);
      reject('IndexedDB error: ' + (event.target as IDBRequest).error);
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(TAFSIR_STORE_NAME)) {
        dbInstance.createObjectStore(TAFSIR_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const addAyah = async (reciterId: string, surahId: number, ayahNum: number, audioBlob: Blob): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const id = `${reciterId}-${surahId}-${ayahNum}`;
    const request = store.put({ id, audioBlob });

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
        console.error('Failed to add ayah:', (event.target as IDBRequest).error);
        reject('Failed to add ayah: ' + (event.target as IDBRequest).error);
    };
  });
};

export const getAyah = async (reciterId: string, surahId: number, ayahNum: number): Promise<Blob | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const id = `${reciterId}-${surahId}-${ayahNum}`;
        const request = store.get(id);

        request.onsuccess = (event) => {
            const result = (event.target as IDBRequest).result;
            resolve(result ? result.audioBlob : null);
        };
        request.onerror = (event) => {
            console.error('Failed to get ayah:', (event.target as IDBRequest).error);
            reject('Failed to get ayah: ' + (event.target as IDBRequest).error);
        };
    });
};

export const addTafsir = async (surahId: number, ayahInSurah: number, text: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TAFSIR_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(TAFSIR_STORE_NAME);
        const id = `${surahId}:${ayahInSurah}`;
        const request = store.put({ id, text });

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error('Failed to add tafsir:', (event.target as IDBRequest).error);
            reject('Failed to add tafsir: ' + (event.target as IDBRequest).error);
        };
    });
};

export const getTafsir = async (surahId: number, ayahInSurah: number): Promise<string | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TAFSIR_STORE_NAME], 'readonly');
        const store = transaction.objectStore(TAFSIR_STORE_NAME);
        const id = `${surahId}:${ayahInSurah}`;
        const request = store.get(id);

        request.onsuccess = (event) => {
            const result = (event.target as IDBRequest).result;
            resolve(result ? result.text : null);
        };
        request.onerror = (event) => {
            console.error('Failed to get tafsir:', (event.target as IDBRequest).error);
            reject('Failed to get tafsir: ' + (event.target as IDBRequest).error);
        };
    });
};

export const getAllDownloadedKeys = async (): Promise<string[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        request.onsuccess = (event) => {
            const allKeys = (event.target as IDBRequest).result as string[];
            resolve(allKeys);
        };
        request.onerror = (event) => {
            console.error('Failed to get keys:', (event.target as IDBRequest).error);
            reject('Failed to get keys: ' + (event.target as IDBRequest).error);
        };
    });
};

export const deleteSurahAudio = async (reciterId: string, surahId: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const prefix = `${reciterId}-${surahId}-`;
    // Create a key range that includes all keys starting with the prefix
    const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
    const request = store.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        // Delete the record found by the cursor
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        // No more entries to iterate, so resolve the promise
        resolve();
      }
    };
    request.onerror = (event) => {
      console.error('Failed to delete surah audio:', (event.target as IDBRequest).error);
      reject('Failed to delete surah audio: ' + (event.target as IDBRequest).error);
    };
  });
};

export const deleteTafsirsForSurah = async (surahId: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TAFSIR_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(TAFSIR_STORE_NAME);
    const prefix = `${surahId}:`;
    const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
    const request = store.delete(range);

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('Failed to delete tafsirs for surah:', (event.target as IDBRequest).error);
      reject('Failed to delete tafsirs for surah: ' + (event.target as IDBRequest).error);
    };
  });
};

export const getDownloadedTafsirCountForSurah = async (surahId: number): Promise<number> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TAFSIR_STORE_NAME], 'readonly');
        const store = transaction.objectStore(TAFSIR_STORE_NAME);
        const prefix = `${surahId}:`;
        const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
        const request = store.count(range);

        request.onsuccess = (event) => {
            resolve((event.target as IDBRequest).result);
        };
        request.onerror = (event) => {
            console.error('Failed to count tafsirs for surah:', (event.target as IDBRequest).error);
            reject('Failed to count tafsirs for surah: ' + (event.target as IDBRequest).error);
        };
    });
};