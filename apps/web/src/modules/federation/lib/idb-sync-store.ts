/**
 * IndexedDB Sync State Store
 *
 * Persists sync state for federation across browser sessions.
 */

import type { SyncStateStore, CardSyncState, PlatformId } from './types';

const DB_NAME = 'character-architect-federation';
const DB_VERSION = 1;
const STORE_NAME = 'sync-state';

/**
 * Create an IndexedDB-backed sync state store
 */
export function createIndexedDBSyncStore(): SyncStateStore {
  let db: IDBDatabase | null = null;

  async function getDb(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'federatedId' });
          store.createIndex('localId', 'localId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  return {
    async get(federatedId: string): Promise<CardSyncState | null> {
      const database = await getDb();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(federatedId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    },

    async set(state: CardSyncState): Promise<void> {
      const database = await getDb();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(state);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async delete(federatedId: string): Promise<void> {
      const database = await getDb();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(federatedId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async list(): Promise<CardSyncState[]> {
      const database = await getDb();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    },

    async findByPlatformId(platform: PlatformId, platformId: string): Promise<CardSyncState | null> {
      const allStates = await this.list();
      return allStates.find(s => s.platformIds[platform] === platformId) || null;
    },
  };
}
