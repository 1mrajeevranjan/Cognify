import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Navigator Mock Setup for Service Worker tests
let serviceWorkerRegistered = false;
let serviceWorkerScript = null;

Object.defineProperty(globalThis, 'navigator', {
  value: {
    serviceWorker: {
      register(scriptPath) {
        serviceWorkerRegistered = true;
        serviceWorkerScript = scriptPath;
        return Promise.resolve({ scope: '/' });
      }
    }
  },
  writable: true,
  configurable: true
});

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
  assert.ok(css.includes('.meta-priority'), 'css/app.css must define .meta-priority');
  assert.ok(css.includes('.meta-date'), 'css/app.css must define .meta-date');
  assert.ok(css.includes('.meta-tag'), 'css/app.css must define .meta-tag');
  
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
      ['settings', new Map()],
      ['sessions', new Map()],
      ['habits', new Map()],
      ['habitLogs', new Map()],
      ['workspaces', new Map()],
      ['workspace_members', new Map()],
      ['task_comments', new Map()],
      ['calendars', new Map()],
      ['calendar_events', new Map()]
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
}).then(() => {
  return runPWATests();
}).then(() => {
  return runReminderTests();
}).then(() => {
  return runOnboardingAndSettingsTests();
}).then(() => {
  return runPhase2Tests();
}).then(() => {
  return runPhase3Tests();
}).then(() => {
  return runFinalAudit();
}).then(() => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  ✅  ALL SYSTEMS PASS — Cognify Phase 3   ');
  console.log('═══════════════════════════════════════════');
  console.log('');
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
class MockCustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail || null;
    this.bubbles = init.bubbles || false;
    this.target = null;
    this._propagationStopped = false;
  }
  stopPropagation() {
    this._propagationStopped = true;
  }
}
globalThis.CustomEvent = MockCustomEvent;

class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.classList = {
      add: (...clss) => clss.forEach(cls => this.classes.add(cls)),
      remove: (...clss) => clss.forEach(cls => this.classes.delete(cls)),
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
    this.dataset = {};
  }
  get className() {
    return Array.from(this.classes).join(' ');
  }
  set className(val) {
    this.classes.clear();
    if (val) {
      val.split(' ').forEach(cls => this.classes.add(cls));
    }
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
    this.children = [];
    const classRegex = /class="([^"]+)"/g;
    let match;
    while ((match = classRegex.exec(val)) !== null) {
      const classes = match[1].split(' ');
      const dummyEl = new MockElement('div');
      classes.forEach(c => dummyEl.classList.add(c));
      this.appendChild(dummyEl);
    }
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
    let eventObj;
    let eventType;
    if (typeof event === 'string') {
      // Convert legacy string events to CustomEvent-like shapes
      eventType = event;
      eventObj = {
        type: event,
        detail: data,
        bubbles: true,
        target: this,
        _propagationStopped: false,
        stopPropagation() { this._propagationStopped = true; }
      };
      Object.assign(eventObj, data);
    } else {
      eventType = event.type;
      eventObj = event;
      if (!eventObj.target) eventObj.target = this;
    }

    const list = this.listeners[eventType] || [];
    for (const cb of list) cb(eventObj);
    
    const propagationStopped = eventObj._propagationStopped;
    const bubbles = eventObj.bubbles;

    if (!propagationStopped && bubbles && this.parentNode && typeof this.parentNode.dispatchEvent === 'function') {
      this.parentNode.dispatchEvent(eventObj);
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
  let completedEvent = null;
  itemEl.addEventListener('task-completed', (e) => {
    completedEvent = e;
  });

  checkbox.dispatchEvent('click');
  assert.ok(checkbox.classList.contains('checked'), 'Checkbox should be marked checked immediately');
  assert.ok(itemEl.classList.contains('holding-completion'), 'Row should enter holding-completion state');

  // Wait 820ms for resolution
  await new Promise(resolve => setTimeout(resolve, 820));
  assert.ok(completedEvent, 'task-completed event should be dispatched after 800ms');
  assert.ok(completedEvent instanceof globalThis.CustomEvent, 'task-completed event should be a CustomEvent');
  assert.strictEqual(completedEvent.detail.id, 't-ui', 'Event payload should carry task ID');
  assert.strictEqual(completedEvent.detail.completed, true, 'Event payload should indicate completion status is true');
  console.log('✓ Task completion click hold state verified');

  // 1c. Test task selection/click handler to open detail drawer
  let selectedEvent = null;
  itemEl.addEventListener('task-selected', (e) => {
    selectedEvent = e;
  });

  itemEl.dispatchEvent('click');
  assert.ok(selectedEvent, 'task-selected event should be dispatched when task row is clicked');
  assert.ok(selectedEvent instanceof globalThis.CustomEvent, 'task-selected event should be a CustomEvent');
  assert.strictEqual(selectedEvent.detail.id, 't-ui', 'Selected event payload should carry task ID');
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

  // 6b. Test rescheduling controls in UpcomingView
  const dummyTaskToReschedule = { id: 'tr-1', title: 'Reschedule Me', completed: false, dueDate: '2026-06-25' };
  const upcomingViewEl2 = UpcomingView([dummyTaskToReschedule], {});
  
  // Find reschedule button
  const rescheduleBtn = upcomingViewEl2.querySelector('.reschedule-btn');
  assert.ok(rescheduleBtn, 'Reschedule button should exist in UpcomingView rows');

  // Trigger click on reschedule button
  rescheduleBtn.dispatchEvent('click');

  // Find tomorrow option button
  const tomorrowBtn = upcomingViewEl2.querySelector('.reschedule-tomorrow');
  assert.ok(tomorrowBtn, 'Tomorrow option should be present in reschedule controls');

  // Listen to task-updated event
  let updatedTaskData = null;
  upcomingViewEl2.addEventListener('task-updated', (data) => {
    updatedTaskData = data.detail || data;
  });

  tomorrowBtn.dispatchEvent('click');

  assert.ok(updatedTaskData, 'task-updated event should be dispatched after rescheduling');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  assert.strictEqual(updatedTaskData.dueDate, tomorrowStr, 'Task due date should be rescheduled to tomorrow');
  console.log('✓ UpcomingView rescheduling controls verified');

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

// ==========================================
// 8. PWA & Offline Caching Tests (TDD)
// ==========================================
async function runPWATests() {
  console.log('Running Task 7 PWA & Offline Caching Tests...');

  // 1. Verify manifest.json exists and is valid
  const manifestPath = path.resolve('manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(manifest.name, 'manifest.json must define a name');
  assert.ok(manifest.short_name, 'manifest.json must define a short_name');
  assert.ok(manifest.start_url, 'manifest.json must define a start_url');
  assert.ok(manifest.display, 'manifest.json must define display mode');

  // 2. Verify sw.js exists and implements service worker lifecycle events
  const swPath = path.resolve('sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes('install'), 'sw.js must implement install event listener');
  assert.ok(swContent.includes('fetch'), 'sw.js must implement fetch event listener');

  // 3. Verify service worker was registered on boot
  assert.ok(serviceWorkerRegistered, 'Service Worker must be registered during boot sequence');
  assert.strictEqual(serviceWorkerScript, 'sw.js', 'Service worker must register sw.js');

  console.log('✓ All Task 7 PWA Tests Passed!');
}

// Reminders Mock Setup
let notificationInstantiated = false;
let notificationTitle = null;
let notificationOptions = null;
let notificationPermissionGranted = 'default';

globalThis.Notification = class MockNotification {
  static get permission() {
    return notificationPermissionGranted;
  }
  static requestPermission() {
    notificationPermissionGranted = 'granted';
    return Promise.resolve(notificationPermissionGranted);
  }
  constructor(title, options) {
    notificationInstantiated = true;
    notificationTitle = title;
    notificationOptions = options;
  }
};

let audioContextCreated = false;
let oscStarted = false;
let oscStopped = false;
let oscFreqVal = null;

class MockOscillator {
  constructor() {
    this.frequency = {
      setValueAtTime: (val) => { oscFreqVal = val; }
    };
  }
  connect() {}
  start() { oscStarted = true; }
  stop() { oscStopped = true; }
}

class MockGainNode {
  constructor() {
    this.gain = {
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {}
    };
  }
  connect() {}
}

globalThis.AudioContext = class MockAudioContext {
  constructor() {
    audioContextCreated = true;
    this.currentTime = 0;
    this.destination = {};
  }
  createOscillator() { return new MockOscillator(); }
  createGain() { return new MockGainNode(); }
};

async function runReminderTests() {
  console.log('Running Task 8 Local Reminders & Audio Alerts Tests...');

  // Reset mocks state
  notificationInstantiated = false;
  notificationTitle = null;
  notificationOptions = null;
  notificationPermissionGranted = 'default';
  audioContextCreated = false;
  oscStarted = false;
  oscStopped = false;
  oscFreqVal = null;

  const { Notifier } = await import('./src/utils.js');
  const { TaskStore } = await import('./src/store.js');

  const store = new TaskStore();
  await store.init();

  const notifier = new Notifier(store);

  // Test permission request
  const perm = await notifier.requestPermission();
  assert.strictEqual(perm, 'granted', 'requestPermission should return granted');
  assert.strictEqual(notificationPermissionGranted, 'granted', 'Notification.requestPermission should toggle permission to granted');
  console.log('✓ requestPermission verified');

  // Seed a task with a past reminder timestamp
  const task = {
    id: 'tr-rem',
    title: 'Water the plants',
    completed: false,
    reminderTimestamp: Date.now() - 5000 // 5 seconds ago
  };
  await store.put('tasks', task);

  // Run reminder checks
  notifier.checkReminders();

  // Verify web notification was triggered
  assert.ok(notificationInstantiated, 'Web Notification should be triggered when reminder timestamp is met');
  assert.strictEqual(notificationTitle, 'Cognify Reminder', 'Notification title should be Cognify Reminder');
  assert.strictEqual(notificationOptions.body, 'Water the plants', 'Notification body should be task title');
  console.log('✓ Web Push Notification trigger verified');

  // Verify Web Audio alert was played
  assert.ok(audioContextCreated, 'AudioContext should be created to play sound');
  assert.ok(oscStarted, 'Oscillator should be started to play alert sound');
  assert.ok(oscStopped, 'Oscillator should be stopped after playing');
  assert.strictEqual(oscFreqVal, 880, 'Beep alert frequency should be A5 (880Hz)');
  console.log('✓ Foreground Web Audio beep verified');

  // Verify app notifier is running
  const { notifier: appNotifier } = await import('./src/app.js');
  assert.ok(appNotifier, 'App must export notifier instance');
  assert.ok(appNotifier.checkInterval, 'App notifier check loop must be active');
  appNotifier.stopChecking(); // Clean up so tests can exit
  console.log('✓ Main App Notifier integration verified');

  console.log('✓ All Task 8 Reminder Tests Passed!');
}

// ==========================================
// 10. Onboarding & App Settings Tests (TDD)
// ==========================================
async function runOnboardingAndSettingsTests() {
  console.log('Running Task 9 Onboarding & App Settings Tests...');
  const { OnboardingView, SettingsView } = await import('./src/components/views.js');
  const { TaskStore } = await import('./src/store.js');

  const store = new TaskStore();
  await store.init();

  // Reset onboarding settings
  await store.delete('settings', 'onboarded');

  // 1. Test OnboardingView elements and flow
  const onboardingEl = OnboardingView(store);
  assert.ok(onboardingEl, 'OnboardingView should return a DOM element');
  assert.ok(onboardingEl.classList.contains('onboarding-view-container'), 'OnboardingView should have onboarding-view-container class');

  const startBtn = onboardingEl.querySelector('.get-started-btn');
  assert.ok(startBtn, 'OnboardingView must have a "Get Started" button');

  // Click start onboarding
  let onboardingRedirected = false;
  window.location.hash = '#onboarding';
  
  startBtn.dispatchEvent('click');

  // Verify DB setting updated
  const onboardedSetting = await store.get('settings', 'onboarded');
  assert.ok(onboardedSetting && onboardedSetting.value === true, 'Onboarding should save onboarded: true in settings store');
  
  // Wait a moment for location hash redirect
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.strictEqual(window.location.hash, '#today', 'Onboarding should redirect to #today on completion');
  console.log('✓ OnboardingView flows verified');

  // 2. Test SettingsView actions
  const settingsEl = SettingsView(store);
  assert.ok(settingsEl, 'SettingsView should return a DOM element');
  assert.ok(settingsEl.classList.contains('settings-view-container'), 'SettingsView should have settings-view-container class');

  const clearBtn = settingsEl.querySelector('.clear-data-btn');
  assert.ok(clearBtn, 'SettingsView must have a "Clear All Data" button');

  // Populate mock data to clear
  await store.put('tasks', { id: 't-clear', title: 'Clear Me', completed: false });
  let tasksBefore = await store.getAll('tasks');
  assert.ok(tasksBefore.length > 0, 'Database should contain tasks before clearing');

  // Click clear
  clearBtn.dispatchEvent('click');

  // Wait for clear operations
  await new Promise(resolve => setTimeout(resolve, 100));

  // Verify DB is cleared
  const tasksAfter = await store.getAll('tasks');
  assert.strictEqual(tasksAfter.length, 0, 'Tasks store should be completely cleared after data clear action');

  const onboardedAfterClear = await store.get('settings', 'onboarded');
  assert.ok(!onboardedAfterClear, 'onboarded setting should be deleted or false after clear');
  assert.strictEqual(window.location.hash, '#onboarding', 'Settings clear data should redirect back to onboarding screen');
  console.log('✓ SettingsView clear data action verified');

  console.log('✓ All Task 9 Onboarding & Settings Tests Passed!');
}

// ==========================================
// 11. Final Quality Audit (Task 10)
// ==========================================
async function runFinalAudit() {
  console.log('Running Task 10 Final Quality Audit...');

  // 1. All required source files exist
  const requiredFiles = [
    'index.html',
    'css/app.css',
    'src/app.js',
    'src/store.js',
    'src/utils.js',
    'src/components/views.js',
    'src/components/item.js',
    'src/components/quickentry.js',
    'src/components/pomodoro.js',
    'src/components/habits.js',
    'src/components/kanban.js',
    'src/components/workspaces.js',
    'src/components/workload.js',
    'src/components/analytics.js',
    'src/components/eisenhower.js',
    'src/components/calendar.js',
    'src/components/weeklyreview.js',
    'src/import.js',
    'src/ai.js',
    'src/supabase.js',
    'sw.js',
    'manifest.json',
    'lib/chrono.js',
    'lib/supabase.js',
    'package.json',
    'CLAUDE.md',
    'supabase_schema.sql'
  ];
  for (const f of requiredFiles) {
    assert.ok(fs.existsSync(path.resolve(f)), `Required file missing: ${f}`);
  }
  console.log(`✓ All ${requiredFiles.length} required files present`);

  // 2. CSS contains all core design tokens
  const css = fs.readFileSync(path.resolve('css/app.css'), 'utf8');
  for (const token of ['--background', '--foreground', '--accent', '--sidebar-background', '--font-sans']) {
    assert.ok(css.includes(token), `css/app.css must define ${token}`);
  }
  // Onboarding & Settings classes
  assert.ok(css.includes('.onboarding-view-container'), 'css must style .onboarding-view-container');
  assert.ok(css.includes('.settings-view-container'), 'css must style .settings-view-container');
  assert.ok(css.includes('.get-started-btn'), 'css must style .get-started-btn');
  assert.ok(css.includes('.danger-section'), 'css must style .danger-section');
  assert.ok(css.includes('body.dark-theme'), 'css must define explicit dark-theme override');
  assert.ok(css.includes('body.light-theme'), 'css must define explicit light-theme override');
  console.log('✓ CSS design tokens and view classes verified');

  // 3. app.js passes store to OnboardingView and SettingsView
  const appJs = fs.readFileSync(path.resolve('src/app.js'), 'utf8');
  assert.ok(appJs.includes('OnboardingView(store)'), 'app.js must pass store to OnboardingView');
  assert.ok(appJs.includes('SettingsView(store)'), 'app.js must pass store to SettingsView');
  assert.ok(appJs.includes('notifier.startChecking'), 'app.js must start the reminder check loop');
  assert.ok(appJs.includes('serviceWorker'), 'app.js must register the service worker');
  console.log('✓ app.js integration wiring verified');

  // 4. views.js exports all required views
  const viewsJs = fs.readFileSync(path.resolve('src/components/views.js'), 'utf8');
  for (const fn of ['TodayView', 'OnboardingView', 'SettingsView', 'UpcomingView', 'InboxView', 'SomedayView', 'LogbookView']) {
    assert.ok(viewsJs.includes(`export function ${fn}`), `views.js must export ${fn}`);
  }
  assert.ok(viewsJs.includes('get-started-btn'), 'OnboardingView must render get-started-btn');
  assert.ok(viewsJs.includes('clear-data-btn'), 'SettingsView must render clear-data-btn');
  assert.ok(viewsJs.includes('theme-swatch'), 'SettingsView must render theme-swatch swatches');
  console.log('✓ views.js exports and view elements verified');

  // 5. sw.js implements install + fetch
  const sw = fs.readFileSync(path.resolve('sw.js'), 'utf8');
  assert.ok(sw.includes('install'), 'sw.js must handle install event');
  assert.ok(sw.includes('fetch'), 'sw.js must handle fetch event');
  console.log('✓ Service Worker lifecycle handlers verified');

  // 6. manifest.json is valid JSON with required fields
  const manifest = JSON.parse(fs.readFileSync(path.resolve('manifest.json'), 'utf8'));
  for (const field of ['name', 'short_name', 'start_url', 'display']) {
    assert.ok(manifest[field], `manifest.json must define ${field}`);
  }
  console.log('✓ PWA manifest verified');

  // 7. CLAUDE.md documents the test command
  const claude = fs.readFileSync(path.resolve('CLAUDE.md'), 'utf8');
  assert.ok(claude.includes('node tests.js'), 'CLAUDE.md must document the test command');
  console.log('✓ CLAUDE.md test command documented');

  console.log('✓ All Task 10 Final Audit Checks Passed!');
}

async function runPhase2Tests() {
  console.log('Running Phase 2 Core Feature Tests...');

  // 1. Verify all new Phase 2 files exist
  const newFiles = [
    'src/components/pomodoro.js',
    'src/components/habits.js',
    'src/components/kanban.js',
    'src/import.js',
    'src/ai.js'
  ];
  for (const f of newFiles) {
    assert.ok(fs.existsSync(path.resolve(f)), `Phase 2 required file missing: ${f}`);
  }
  console.log('✓ All Phase 2 source files present');

  // 2. Test Pomodoro View and Widget Rendering
  const { PomodoroWidget } = await import('./src/components/pomodoro.js');
  const pomodoroWidget = PomodoroWidget();
  assert.ok(pomodoroWidget, 'PomodoroWidget should return a DOM element');
  assert.ok(pomodoroWidget.querySelector('.pomodoro-ring'), 'PomodoroWidget must render .pomodoro-ring');
  assert.ok(pomodoroWidget.querySelector('.pomodoro-start-btn'), 'PomodoroWidget must render .pomodoro-start-btn');
  console.log('✓ Pomodoro widget verified');

  // 3. Test Habits View and Form Rendering
  const { HabitsView } = await import('./src/components/habits.js');
  const habitsView = HabitsView(null);
  assert.ok(habitsView, 'HabitsView should return a DOM element');
  assert.ok(habitsView.classList.contains('habits-view-container'), 'HabitsView must have .habits-view-container class');
  assert.ok(habitsView.querySelector('.add-habit-btn'), 'HabitsView must have a habit add button');
  console.log('✓ Habits view verified');

  // 4. Test AI Task Breakdown and sort logic
  const { breakdownTask, suggestDailyOrder } = await import('./src/ai.js');
  const emptyRes = await breakdownTask('Buy bread', '');
  assert.deepStrictEqual(emptyRes, [], 'breakdownTask with empty key returns []');
  
  // Test suggestDailyOrder handles empty lists
  const emptySuggest = await suggestDailyOrder([], 'key');
  assert.deepStrictEqual(emptySuggest, [], 'suggestDailyOrder handles empty list');
  console.log('✓ AI gateway methods error boundaries verified');

  // 5. Test VoiceCapture error boundaries
  const { VoiceCapture } = await import('./src/utils.js');
  const vc = new VoiceCapture();
  assert.ok(typeof vc.start === 'function', 'VoiceCapture must have start() method');
  // Re-save existing window variables if any
  const oldSR = globalThis.SpeechRecognition;
  const oldWSR = globalThis.webkitSpeechRecognition;
  delete globalThis.SpeechRecognition;
  delete globalThis.webkitSpeechRecognition;
  try {
    await vc.start();
    assert.fail('Should reject when SpeechRecognition is not supported');
  } catch (e) {
    assert.strictEqual(e.message, 'not-supported', 'VoiceCapture rejects with not-supported when API is missing');
  }
  globalThis.SpeechRecognition = oldSR;
  globalThis.webkitSpeechRecognition = oldWSR;
  console.log('✓ VoiceCapture error boundaries verified');

  // 6. Test Data Import (Todoist & Notion)
  const { importTodoist, importNotion } = await import('./src/import.js');
  let todoistTasks = [];
  const mockStore = {
    getAllCached: () => [],
    put: async (storeName, val) => {
      if (storeName === 'tasks') todoistTasks.push(val);
    }
  };
  const todoistText = JSON.stringify({
    items: [
      { content: 'Todoist Task 1', priority: 4, due: { date: '2026-07-01' } },
      { content: 'Todoist Task 2', priority: 1 }
    ]
  });
  const tImport = await importTodoist(todoistText, mockStore);
  assert.strictEqual(tImport.imported, 2, 'importTodoist should import 2 tasks');
  assert.strictEqual(todoistTasks[0].title, 'Todoist Task 1', 'Imported Todoist task title maps correctly');
  assert.strictEqual(todoistTasks[0].priority, 'P1', 'Todoist priority 4 maps to P1');

  let notionTasks = [];
  const mockNotionStore = {
    getAllCached: () => [],
    put: async (storeName, val) => {
      if (storeName === 'tasks') notionTasks.push(val);
    }
  };
  const csvText = `Name,Notes,Date,Tags,Status\nNotion Task 1,Some notes,2026-07-02,work,Done`;
  const nImport = await importNotion(csvText, mockNotionStore);
  assert.strictEqual(nImport.imported, 1, 'importNotion should import 1 task');
  assert.strictEqual(notionTasks[0].title, 'Notion Task 1', 'Notion name maps to title');
  assert.strictEqual(notionTasks[0].completed, true, 'Notion Status Done maps to completed: true');
  console.log('✓ Todoist & Notion schema importers verified');

  // 7. Test Kanban View
  const { KanbanView } = await import('./src/components/kanban.js');
  const kanbanTasks = [
    { id: 'k1', title: 'Task 1', completed: false, dueDate: null },
    { id: 'k2', title: 'Task 2', completed: false, dueDate: '2026-07-01' },
    { id: 'k3', title: 'Task 3', completed: true, dueDate: null }
  ];
  const kanbanBoard = KanbanView(kanbanTasks, {}, null);
  assert.ok(kanbanBoard.classList.contains('kanban-board'), 'KanbanView renders .kanban-board container');
  const cols = kanbanBoard.querySelectorAll('.kanban-column');
  assert.strictEqual(cols.length, 3, 'Kanban board has exactly 3 columns');
  console.log('✓ Kanban board layout verified');

  // 8. Test Daily Briefing suggestions & score algorithm
  const { DailyBriefing } = await import('./src/utils.js');
  const briefing = new DailyBriefing(null);
  assert.deepStrictEqual(briefing.suggest([]), [], 'DailyBriefing returns empty suggestions for empty task list');
  const tasksList = [
    { id: 'b1', title: 'P2 Future Task', priority: 'P2', completed: false, dueDate: '2026-08-01' },
    { id: 'b2', title: 'P1 Task', priority: 'P1', completed: false, dueDate: null },
    { id: 'b3', title: 'Overdue Task', priority: 'P3', completed: false, dueDate: '2020-01-01' }
  ];
  const suggestions = briefing.suggest(tasksList);
  assert.strictEqual(suggestions[0].id, 'b3', 'Overdue task scores highest (priority + overdue_bonus)');
  assert.strictEqual(suggestions[1].id, 'b2', 'P1 task scores next');
  console.log('✓ DailyBriefing local prioritization scoring verified');

  console.log('✓ All Phase 2 Core Feature Tests Passed!');
}

async function runPhase3Tests() {
  console.log('Running Phase 3 Integration Tests...');

  // 1. Verify files exist
  const phase3Files = [
    'src/components/workspaces.js',
    'src/components/workload.js',
    'src/components/analytics.js',
    'src/components/eisenhower.js',
    'src/supabase.js',
    'supabase_schema.sql'
  ];
  for (const f of phase3Files) {
    assert.ok(fs.existsSync(path.resolve(f)), `Phase 3 required file missing: ${f}`);
  }
  console.log('✓ All Phase 3 source files present');

  // 2. Mock Supabase object in globalThis
  const mockSupabase = {
    auth: {
      user: () => ({ id: 'u123', email: 'test@example.com' }),
      getSession: async () => ({ data: { session: { user: { id: 'u123', email: 'test@example.com' } } } }),
      onAuthStateChange: (cb) => {
        cb('SIGNED_IN', { user: { id: 'u123', email: 'test@example.com' } });
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signOut: async () => {}
    },
    from: (table) => ({
      upsert: async () => ({ error: null }),
      delete: () => ({ eq: async () => ({ error: null }) }),
      select: async () => ({ data: [], error: null })
    }),
    channel: () => ({
      on: function() { return this; },
      subscribe: () => {}
    })
  };
  
  globalThis.supabase = mockSupabase;

  // 3. Test WorkspacesView rendering
  const { WorkspacesView } = await import('./src/components/workspaces.js');
  const mockStore = {
    getAllCached: (name) => {
      if (name === 'workspaces') return [{ id: 'w1', name: 'Design Team' }];
      if (name === 'workspace_members') return [{ id: 'm1', workspaceId: 'w1', email: 'alice@example.com', role: 'member' }];
      return [];
    },
    put: async () => {}
  };
  const workspacesEl = WorkspacesView(mockStore);
  assert.ok(workspacesEl, 'WorkspacesView should render');
  assert.ok(workspacesEl.querySelector('.workspaces-list'), 'WorkspacesView has .workspaces-list element');
  assert.ok(workspacesEl.querySelector('.add-workspace-btn'), 'WorkspacesView has add button');
  console.log('✓ Workspaces view verified');

  // 4. Test WorkloadView rendering & grouping
  const { WorkloadView } = await import('./src/components/workload.js');
  const mockWorkloadStore = {
    getAllCached: (name) => {
      if (name === 'tasks') return [
        { id: 't1', title: 'Task 1', completed: false, assigneeEmail: 'alice@example.com' },
        { id: 't2', title: 'Task 2', completed: false, assigneeEmail: 'bob@example.com' }
      ];
      if (name === 'workspace_members') return [
        { id: 'm1', email: 'alice@example.com' },
        { id: 'm2', email: 'bob@example.com' }
      ];
      return [];
    }
  };
  const workloadEl = WorkloadView(mockWorkloadStore);
  assert.ok(workloadEl, 'WorkloadView should render');
  assert.ok(workloadEl.querySelector('.workload-columns'), 'WorkloadView has .workload-columns element');
  console.log('✓ Workload view verified');

  // 5. Test AnalyticsView calculations
  const { AnalyticsView } = await import('./src/components/analytics.js');
  const mockAnalyticsStore = {
    getAllCached: (name) => {
      if (name === 'tasks') return [
        { id: 't1', completed: true },
        { id: 't2', completed: false }
      ];
      if (name === 'sessions') return [{ id: 's1', duration: 1500 }];
      return [];
    }
  };
  const analyticsEl = AnalyticsView(mockAnalyticsStore);
  assert.ok(analyticsEl, 'AnalyticsView should render');
  assert.ok(analyticsEl.querySelector('.analytics-dashboard'), 'AnalyticsView has .analytics-dashboard element');
  console.log('✓ Analytics view verified');

  // Eisenhower Matrix
  const { EisenhowerView } = await import('./src/components/eisenhower.js');
  const todayStr = new Date().toISOString().split('T')[0];
  const eTasks = [
    { id: 'e1', title: 'Urgent Important', completed: false, priority: 'P1', dueDate: todayStr }
  ];
  const mockEisenhowerStore = {
    getAllCached: () => eTasks,
    getCached: () => eTasks[0],
    put: async () => {}
  };
  const eisenhowerEl = EisenhowerView(eTasks, mockEisenhowerStore);
  assert.ok(eisenhowerEl, 'EisenhowerView should render');
  assert.ok(eisenhowerEl.querySelector('.eisenhower-grid'), 'EisenhowerView has .eisenhower-grid element');
  console.log('✓ Eisenhower matrix view verified');

  // 7. Test CalendarView
  const { CalendarView } = await import('./src/components/calendar.js');
  const mockCalendarStore = {
    getAllCached: (name) => {
      if (name === 'calendars') return [{ id: 'cal1', name: 'Personal Feed', color: '#ff0000' }];
      if (name === 'calendar_events') return [{ id: 'ev1', calendarId: 'cal1', title: 'Sprint Planning', start: Date.now(), end: Date.now() + 3600000 }];
      return [];
    }
  };
  const calendarEl = CalendarView(mockCalendarStore);
  assert.ok(calendarEl, 'CalendarView should render');
  assert.ok(calendarEl.querySelector('.calendar-list'), 'CalendarView must render sidebar calendar list');
  assert.ok(calendarEl.querySelector('.calendar-hour-slot'), 'CalendarView must render hourly grid slots');
  console.log('✓ Calendar view verified');

  // 8. Test WeeklyReviewView
  const { WeeklyReviewView } = await import('./src/components/weeklyreview.js');
  const mockReviewStore = {
    getAllCached: (name) => {
      if (name === 'tasks') return [{ id: 't1', title: 'Clean Inbox Item', completed: false, projectId: null }];
      if (name === 'habits') return [{ id: 'h1', name: 'Gym', streak: 4 }];
      return [];
    },
    put: async () => {}
  };
  const reviewEl = WeeklyReviewView(mockReviewStore);
  assert.ok(reviewEl, 'WeeklyReviewView should render');
  assert.ok(reviewEl.querySelector('.wizard-container'), 'WeeklyReviewView must render wizard step container');
  console.log('✓ Weekly Review view verified');

  // Clean up global mock
  delete globalThis.supabase;
  console.log('✓ All Phase 3 Integration Tests Passed!');
}

