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
}).then(() => {
  return runUITests();
}).then(() => {
  return runNLPTests();
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
  await new Promise(resolve => setTimeout(resolve, 50));
  
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

// ==========================================
// MockElement DOM helper class for UI tests
// ==========================================
class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.classList = {
      add: (cls) => this.classes.add(cls),
      remove: (cls) => this.classes.delete(cls),
      contains: (cls) => this.classes.has(cls),
      toggle: (cls) => {
        if (this.classes.has(cls)) this.classes.delete(cls);
        else this.classes.add(cls);
      }
    };
    this.classes = new Set();
    this.listeners = {};
    this.children = [];
    this._innerHTML = '';
    this._textContent = '';
    this.attributes = new Map();
    this.style = {};
  }
  get innerHTML() {
    if (this._innerHTML) return this._innerHTML;
    return this.children.map(child => {
      if (typeof child === 'string') return child;
      return child.innerHTML || child.textContent || '';
    }).join('');
  }
  set innerHTML(val) {
    this._innerHTML = val;
  }
  get textContent() {
    if (this._textContent) return this._textContent;
    return this.children.map(child => {
      if (typeof child === 'string') return child;
      return child.textContent || '';
    }).join('');
  }
  set textContent(val) {
    this._textContent = val;
  }
  setAttribute(name, val) { this.attributes.set(name, String(val)); }
  getAttribute(name) { return this.attributes.get(name); }
  appendChild(child) {
    this.children.push(child);
    if (child && typeof child === 'object') {
      child.parentNode = this;
    }
  }
  addEventListener(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  dispatchEvent(event, data = {}) {
    let stopped = false;
    if (typeof data === 'object') {
      if (!data.stopPropagation) {
        data.stopPropagation = () => { stopped = true; };
      }
      if (!data.target) {
        data.target = this;
      }
    }
    const list = this.listeners[event] || [];
    for (const cb of list) cb(data);
    
    if (!stopped && this.parentNode && typeof this.parentNode.dispatchEvent === 'function') {
      this.parentNode.dispatchEvent(event, data);
    }
  }
  querySelector(selector) {
    if (selector.startsWith('.')) {
      const cls = selector.substring(1);
      return this._findChild(el => el.classList.contains(cls));
    }
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return this._findChild(el => el.getAttribute('id') === id);
    }
    return this._findChild(el => el.tagName === selector.toUpperCase());
  }
  querySelectorAll(selector) {
    const results = [];
    this._findChildren(results, el => {
      if (selector.startsWith('.')) return el.classList.contains(selector.substring(1));
      if (selector.startsWith('#')) return el.getAttribute('id') === selector.substring(1);
      return el.tagName === selector.toUpperCase();
    });
    return results;
  }
  _findChild(predicate) {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const sub = child._findChild(predicate);
      if (sub) return sub;
    }
    return null;
  }
  _findChildren(results, predicate) {
    for (const child of this.children) {
      if (predicate(child)) results.push(child);
      child._findChildren(results, predicate);
    }
  }
}

// Extend global document object
globalThis.document.createElement = (tag) => new MockElement(tag);

// ==========================================
// 6. UI View & Components Tests (TDD)
// ==========================================
async function runUITests() {
  console.log('Running Task 4 UI View & Component Tests...');
  const { TaskItem, TaskList } = await import('./src/components/item.js');
  
  const dummyTask = {
    id: 't-ui',
    title: 'Test Component Rendering',
    notes: 'Make it visually calm.',
    completed: false,
    dueDate: '2026-06-25',
    priority: 'P2',
    checklistItems: [{ id: 's1', title: 'Subtask 1', completed: false }],
    tags: ['work']
  };

  // 1. Test TaskItem render output
  const itemEl = TaskItem(dummyTask);
  assert.ok(itemEl, 'TaskItem should return a DOM element');
  assert.ok(itemEl.classList.contains('task-item-row'), 'TaskItem should have class task-item-row');
  
  const checkbox = itemEl.querySelector('.task-checkbox');
  assert.ok(checkbox, 'TaskItem should render a checkbox element');
  
  const title = itemEl.querySelector('.task-title');
  assert.ok(title, 'TaskItem should render a title element');
  assert.strictEqual(title.textContent, 'Test Component Rendering', 'TaskItem should render the correct title');
  console.log('✓ TaskItem basic render verified');

  // 1b. Test task completion click handler with 800ms hold state
  let completedEventDispatched = false;
  let completedEventData = null;
  itemEl.addEventListener('task-completed', (data) => {
    completedEventDispatched = true;
    completedEventData = data;
  });

  checkbox.dispatchEvent('click');
  assert.ok(checkbox.classList.contains('checked'), 'Checkbox should be marked checked immediately');
  assert.ok(itemEl.classList.contains('holding-completion'), 'Row should enter holding-completion state');

  // Wait 820ms for resolution
  await new Promise(resolve => setTimeout(resolve, 820));
  assert.ok(completedEventDispatched, 'task-completed event should be dispatched after 800ms');
  assert.strictEqual(completedEventData.id, 't-ui', 'Event payload should carry task ID');
  assert.strictEqual(completedEventData.completed, true, 'Event payload should indicate completion status is true');
  console.log('✓ Task completion click hold state verified');

  // 1c. Test task selection/click handler to open detail drawer
  let selectedEventDispatched = false;
  let selectedEventData = null;
  itemEl.addEventListener('task-selected', (data) => {
    selectedEventDispatched = true;
    selectedEventData = data;
  });

  itemEl.dispatchEvent('click');
  assert.ok(selectedEventDispatched, 'task-selected event should be dispatched when task row is clicked');
  assert.strictEqual(selectedEventData.id, 't-ui', 'Selected event payload should carry task ID');
  console.log('✓ Task item row selection click verified');

  // 2. Test TaskList renders empty state when empty
  const emptyListEl = TaskList([], {});
  const emptyState = emptyListEl.querySelector('.empty-state');
  assert.ok(emptyState, 'TaskList should render an empty state container when tasks list is empty');
  console.log('✓ TaskList empty state verified');

  // 3. Test TaskList groups tasks by project
  const dummyProject = { id: 'p-ui', name: 'UI Feature Work' };
  const taskWithProject = { ...dummyTask, projectId: 'p-ui' };
  const listEl = TaskList([taskWithProject], { 'p-ui': dummyProject });
  
  const projectHeader = listEl.querySelector('.project-header');
  assert.ok(projectHeader, 'TaskList should render project headers for grouped tasks');
  assert.ok(projectHeader.textContent.includes('UI Feature Work'), 'Project header should render project name');
  console.log('✓ TaskList project grouping verified');

  // 4. Test TaskDetailPanel rendering and saving
  const { TaskDetailPanel } = await import('./src/components/item.js');
  let panelSavedData = null;
  const panelEl = TaskDetailPanel(dummyTask, {
    onSave: (updatedData) => {
      panelSavedData = updatedData;
    }
  });

  assert.ok(panelEl, 'TaskDetailPanel should return a DOM element');
  assert.ok(panelEl.classList.contains('task-detail-panel'), 'TaskDetailPanel should have class task-detail-panel');

  const titleInput = panelEl.querySelector('.detail-title-input');
  assert.ok(titleInput, 'Detail panel should have a title input field');
  
  // Simulate editing title and triggering change / save
  titleInput.value = 'Updated Task Title';
  titleInput.dispatchEvent('change');
  
  assert.ok(panelSavedData, 'onSave callback should be triggered when detail panel values change');
  assert.strictEqual(panelSavedData.title, 'Updated Task Title', 'Updated title should be propagated via onSave');
  console.log('✓ TaskDetailPanel render and save logic verified');

  // 5. Test src/components/views.js renders views
  const { TodayView, OnboardingView, SettingsView, UpcomingView } = await import('./src/components/views.js');
  
  const todayEl = TodayView([], {});
  assert.ok(todayEl, 'TodayView should return a DOM element');
  assert.ok(todayEl.classList.contains('today-view-container'), 'TodayView should have class today-view-container');
  console.log('✓ TodayView render verified');

  // 5b. Test selecting a task in TodayView opens details panel
  const dummyTaskWithDetail = {
    id: 't-detail',
    title: 'Detailed Task',
    notes: 'Notes here',
    completed: false
  };
  const todayViewEl = TodayView([dummyTaskWithDetail], {});
  const taskRow = todayViewEl.querySelector('#task-t-detail');
  assert.ok(taskRow, 'Task row should exist in TodayView');
  
  // Before click, detail panel should not be present
  let detailPanel = todayViewEl.querySelector('.task-detail-panel');
  assert.strictEqual(detailPanel, null, 'Detail panel should not be present initially');

  // Simulate clicking task row
  taskRow.dispatchEvent('click');

  // After click, detail panel should be present
  detailPanel = todayViewEl.querySelector('.task-detail-panel');
  assert.ok(detailPanel, 'Detail panel should be rendered after clicking task row');
  console.log('✓ TodayView opens detail panel on task row click');


  const onboardingEl = OnboardingView();
  assert.ok(onboardingEl, 'OnboardingView should return a DOM element');
  assert.ok(onboardingEl.classList.contains('onboarding-view-container'), 'OnboardingView should have class onboarding-view-container');
  console.log('✓ OnboardingView render verified');

  const settingsEl = SettingsView();
  assert.ok(settingsEl, 'SettingsView should return a DOM element');
  assert.ok(settingsEl.classList.contains('settings-view-container'), 'SettingsView should have class settings-view-container');
  console.log('✓ SettingsView render verified');

  const dummyUpcomingTasks = [
    { id: 'tu1', title: 'Task Due Tomorrow', completed: false, dueDate: '2026-06-26' },
    { id: 'tu2', title: 'Task Due Next Week', completed: false, dueDate: '2026-07-02' }
  ];
  const upcomingEl = UpcomingView(dummyUpcomingTasks, {});
  assert.ok(upcomingEl, 'UpcomingView should return a DOM element');
  assert.ok(upcomingEl.classList.contains('upcoming-view-container'), 'UpcomingView should have class upcoming-view-container');
  
  const groupHeaders = upcomingEl.querySelectorAll('.date-group-header');
  assert.ok(groupHeaders.length >= 2, 'UpcomingView should group tasks by due date');
  console.log('✓ UpcomingView grouping and rendering verified');

  console.log('✓ All Task 4 UI Component Tests Passed!');
}

// ==========================================
// 7. Natural Language Parsing Tests (TDD)
// ==========================================
async function runNLPTests() {
  console.log('Running Task 5 NLP Date Parsing Tests...');
  const { parseNaturalLanguage } = await import('./src/utils.js');
  
  // Test case 1: Today date and tags
  const res1 = parseNaturalLanguage('Buy milk today #errand #grocery');
  assert.strictEqual(res1.title, 'Buy milk');
  const todayStr = new Date().toISOString().split('T')[0];
  assert.strictEqual(res1.dueDate, todayStr);
  assert.deepStrictEqual(res1.tags.sort(), ['errand', 'grocery'].sort());
  assert.strictEqual(res1.priority, null);

  // Test case 2: Tomorrow date, priority and tag
  const res2 = parseNaturalLanguage('Send weekly report tomorrow !p1 #work');
  assert.strictEqual(res2.title, 'Send weekly report');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  assert.strictEqual(res2.dueDate, tomorrowStr);
  assert.deepStrictEqual(res2.tags, ['work']);
  assert.strictEqual(res2.priority, 'P1');

  // Test case 3: No date, priority P3, no tag
  const res3 = parseNaturalLanguage('Fix styling !p3');
  assert.strictEqual(res3.title, 'Fix styling');
  assert.strictEqual(res3.dueDate, null);
  assert.deepStrictEqual(res3.tags, []);
  assert.strictEqual(res3.priority, 'P3');

  // 4. Test QuickEntry component
  const { QuickEntry } = await import('./src/components/quickentry.js');
  let savedTask = null;
  const quickEntryEl = QuickEntry({
    onSave: (task) => {
      savedTask = task;
    }
  });

  assert.ok(quickEntryEl, 'QuickEntry should return a DOM element');
  assert.ok(quickEntryEl.classList.contains('quick-entry-overlay'), 'QuickEntry should have class quick-entry-overlay');

  const input = quickEntryEl.querySelector('.quick-entry-input');
  assert.ok(input, 'QuickEntry should have an input field');

  const preview = quickEntryEl.querySelector('.quick-entry-preview');
  assert.ok(preview, 'QuickEntry should have a preview container');

  // Simulate typing input and triggering input event
  input.value = 'Buy milk today #errand';
  input.dispatchEvent('input');

  // Verify preview is updated (e.g., has chips for date and tags)
  const chips = quickEntryEl.querySelectorAll('.preview-chip');
  assert.ok(chips.length >= 2, 'Preview should render chips for extracted metadata');
  
  // Simulate pressing Enter to save
  input.dispatchEvent('keydown', { key: 'Enter' });
  assert.ok(savedTask, 'onSave should be called on Enter');
  assert.strictEqual(savedTask.title, 'Buy milk');
  assert.deepStrictEqual(savedTask.tags, ['errand']);
  console.log('✓ QuickEntry component and live-preview verified');

  console.log('✓ All Task 5 NLP Tests Passed!');
}

