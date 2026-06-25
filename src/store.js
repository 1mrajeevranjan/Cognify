export class TaskStore {
  constructor() {
    this.db = null;
    this.dbName = 'CognifyDB';
    this.dbVersion = 1;
    
    // In-memory caches for synchronous reads
    this.caches = {
      tasks: new Map(),
      projects: new Map(),
      areas: new Map(),
      settings: new Map()
    };
    
    // Subscriber callbacks per store
    this.subscribers = {
      tasks: new Set(),
      projects: new Set(),
      areas: new Set(),
      settings: new Set()
    };
  }

  // Initialize DB and load caches
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('areas')) {
          db.createObjectStore('areas', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        try {
          // Warm up in-memory caches
          await this._warmCache('tasks');
          await this._warmCache('projects');
          await this._warmCache('areas');
          await this._warmCache('settings');
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Warm up a single cache from DB
  _warmCache(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = req.result || [];
        const cache = this.caches[storeName];
        cache.clear();
        for (const item of list) {
          cache.set(item.id || item.key, item);
        }
        resolve();
      };
      
      req.onerror = () => reject(req.error);
    });
  }

  // Async get from DB
  get(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Async get all from DB
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Async put to DB + Cache + Sub notification
  put(storeName, data) {
    const id = data.id || data.key;
    // Update cache synchronously
    this.caches[storeName].set(id, data);
    this._notify(storeName);

    // Save to IndexedDB asynchronously
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Async delete from DB + Cache + Sub notification
  delete(storeName, id) {
    // Update cache synchronously
    this.caches[storeName].delete(id);
    this._notify(storeName);

    // Delete from IndexedDB asynchronously
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Synchronous reads from in-memory cache
  getCached(storeName, id) {
    return this.caches[storeName].get(id);
  }

  getAllCached(storeName) {
    return Array.from(this.caches[storeName].values());
  }

  // Subscriptions
  subscribe(storeName, callback) {
    this.subscribers[storeName].add(callback);
    // Initial callback invocation
    callback(this.getAllCached(storeName));
    
    // Return unsubscribe function
    return () => this.subscribers[storeName].delete(callback);
  }

  // Notify subscribers with cached list
  _notify(storeName) {
    const list = this.getAllCached(storeName);
    for (const callback of this.subscribers[storeName]) {
      try {
        callback(list);
      } catch (err) {
        console.error('Subscription error:', err);
      }
    }
  }
}
