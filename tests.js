import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('Running Task 1 Layout & Setup Verification...');

// 1. Verify index.html structure
try {
  const htmlPath = path.resolve('index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
  
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('id="splash"'), 'index.html must contain a splash screen element');
  assert.ok(html.includes('id="sidebar"'), 'index.html must contain a sidebar element');
  assert.ok(html.includes('<main'), 'index.html must contain a main element');
  assert.ok(html.includes('css/app.css'), 'index.html must link css/app.css');
  
  console.log('✓ HTML Structure Verification Passed');
} catch (err) {
  console.error('✗ HTML Structure Verification Failed:', err.message);
  process.exit(1);
}

// 2. Verify css/app.css has key design tokens
try {
  const cssPath = path.resolve('css/app.css');
  assert.ok(fs.existsSync(cssPath), 'css/app.css must exist');
  
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.ok(css.includes('--background'), 'css/app.css must define --background variable');
  assert.ok(css.includes('--foreground'), 'css/app.css must define --foreground variable');
  assert.ok(css.includes('--accent'), 'css/app.css must define --accent variable');
  
  console.log('✓ CSS Design Tokens Verification Passed');
} catch (err) {
  console.error('✗ CSS Design Tokens Verification Failed:', err.message);
  process.exit(1);
}

// 3. Verify src/app.js exists
try {
  const appPath = path.resolve('src/app.js');
  assert.ok(fs.existsSync(appPath), 'src/app.js must exist');
  console.log('✓ Entry App Script Verification Passed');
} catch (err) {
  console.error('✗ Entry App Script Verification Failed:', err.message);
  process.exit(1);
}

// ==========================================
// IndexedDB Mock Setup for Node environment
// ==========================================
class MockRequest {
  constructor() {
    this.onsuccess = null;
    this.onerror = null;
  }
}

class MockStore {
  constructor(name, dataMap) {
    this.name = name;
    this.dataMap = dataMap;
  }
  get(key) {
    const req = new MockRequest();
    setTimeout(() => {
      req.result = this.dataMap.get(key);
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 0);
    return req;
  }
  getAll() {
    const req = new MockRequest();
    setTimeout(() => {
      req.result = Array.from(this.dataMap.values());
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 0);
    return req;
  }
  put(value) {
    const req = new MockRequest();
    setTimeout(() => {
      const id = value.id || value.key;
      this.dataMap.set(id, value);
      req.result = id;
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 0);
    return req;
  }
  delete(key) {
    const req = new MockRequest();
    setTimeout(() => {
      this.dataMap.delete(key);
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 0);
    return req;
  }
}

class MockTransaction {
  constructor(stores, mode, db) {
    this.stores = Array.isArray(stores) ? stores : [stores];
    this.mode = mode;
    this.db = db;
    this.oncomplete = null;
    this.onerror = null;
  }
  objectStore(name) {
    return new MockStore(name, this.db.storeData.get(name));
  }
}

class MockDatabase {
  constructor() {
    this.storeData = new Map([
      ['tasks', new Map()],
      ['projects', new Map()],
      ['areas', new Map()],
      ['settings', new Map()]
    ]);
  }
  transaction(storeNames, mode) {
    const tx = new MockTransaction(storeNames, mode, this);
    setTimeout(() => {
      if (tx.oncomplete) tx.oncomplete();
    }, 2);
    return tx;
  }
  createObjectStore(name, options) {
    return {};
  }
}

globalThis.indexedDB = {
  open(name, version) {
    const req = new MockRequest();
    setTimeout(() => {
      const db = new MockDatabase();
      req.result = db;
      if (req.onsuccess) {
        req.onsuccess({ target: req });
      }
    }, 0);
    return req;
  }
};

// ==========================================
// 4. TaskStore Behavior Tests (TDD)
// ==========================================
async function runStoreTests() {
  console.log('Running Task 2 Store & IndexedDB Tests...');
  const { TaskStore } = await import('./src/store.js');
  const store = new TaskStore();
  
  // Test init
  await store.init();
  console.log('✓ Store initialization successful');

  // Test put and get (IndexedDB & Cache sync)
  const task = { id: 't1', title: 'Buy milk', completed: false, tags: ['errand'] };
  await store.put('tasks', task);
  
  // Test instant cached get (synchronous)
  const cachedTask = store.getCached('tasks', 't1');
  assert.deepStrictEqual(cachedTask, task, 'Cached read should return task instantly');
  console.log('✓ Synchronous in-memory caching verified');

  // Test async store get (IndexedDB fetch)
  const dbTask = await store.get('tasks', 't1');
  assert.deepStrictEqual(dbTask, task, 'Async database read should return same task');
  console.log('✓ Async IndexedDB read/write verified');

  // Test subscription updates
  let subNotified = false;
  let subData = null;
  store.subscribe('tasks', (data) => {
    subNotified = true;
    subData = data;
  });

  const updatedTask = { ...task, completed: true };
  await store.put('tasks', updatedTask);
  
  assert.ok(subNotified, 'Subscriber should be notified on put updates');
  assert.deepStrictEqual(store.getCached('tasks', 't1'), updatedTask, 'Cache should update on update');
  console.log('✓ Reactive store subscriptions verified');

  // Test delete
  await store.delete('tasks', 't1');
  assert.strictEqual(store.getCached('tasks', 't1'), undefined, 'Cache should clear on delete');
  const deletedTask = await store.get('tasks', 't1');
  assert.strictEqual(deletedTask, undefined, 'Database read should return undefined after delete');
  console.log('✓ Delete and cache clear verified');

  console.log('✓ All Task 2 Store Tests Passed!');
}

runStoreTests().then(() => {
  return runRoutingTests();
}).catch(err => {
  console.error('✗ Tests Failed:', err);
  process.exit(1);
});

// ==========================================
// Mock DOM Setup for app.js/routing tests
// ==========================================
const mockSplashClasses = new Set();
const mockSidebarNav = { innerHTML: '', querySelectorAll: () => [] };
const mockViewContainer = { innerHTML: '' };

globalThis.window = {
  location: {
    hash: '',
    search: '',
  },
  addEventListener(event, callback) {
    if (event === 'hashchange') {
      this.hashchangeListener = callback;
    }
  },
  dispatchEvent(event) {
    if (event === 'hashchange' && this.hashchangeListener) {
      this.hashchangeListener();
    }
  }
};

globalThis.document = {
  getElementById(id) {
    if (id === 'splash') {
      return {
        classList: {
          add: (cls) => mockSplashClasses.add(cls),
          remove: (cls) => mockSplashClasses.delete(cls)
        }
      };
    }
    if (id === 'view-container') {
      return mockViewContainer;
    }
    if (id === 'sidebar-nav') {
      return mockSidebarNav;
    }
    return null;
  },
  querySelector(selector) {
    if (selector === '#splash') return this.getElementById('splash');
    if (selector === '#view-container') return mockViewContainer;
    if (selector === '#sidebar-nav') return mockSidebarNav;
    return null;
  }
};

// ==========================================
// 5. App Routing & Boot Behavior Tests (TDD)
// ==========================================
async function runRoutingTests() {
  console.log('Running Task 3 App Routing & Boot Tests...');
  mockSplashClasses.clear();
  
  // Verify app triggers database boot and hide splash screen
  const appModule = await import('./src/app.js');
  
  // Wait to let async boot loop execute
  await new Promise(resolve => setTimeout(resolve, 10));
  
  assert.ok(mockSplashClasses.has('hidden'), 'Splash screen should be hidden after initialization');
  console.log('✓ Splash screen fade-out verified');

  // Verify routing behaves based on URL hash changes
  window.location.hash = '#today';
  window.dispatchEvent('hashchange');
  
  // Verify view-container loads content
  assert.ok(mockViewContainer.innerHTML.includes('Today') || mockViewContainer.innerHTML !== '', 'View container should load views upon hashchange');
  console.log('✓ URL Hash-change routing verified');

  console.log('✓ All Task 3 Routing Tests Passed!');
}
