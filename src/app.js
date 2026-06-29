import { TaskStore } from './store.js';
import { TodayView, OnboardingView, SettingsView, UpcomingView, InboxView, SomedayView, LogbookView, PomodoroView, FocusView, HabitsView, KanbanView } from './components/views.js';
import { QuickEntry } from './components/quickentry.js';
import { Notifier } from './utils.js';

export const store = new TaskStore();
export const notifier = new Notifier(store);
let appInitialized = false;

// Helper to open Quick Entry overlay
function openQuickEntry() {
  // Avoid duplicate overlay
  if (document.querySelector('.quick-entry-overlay')) return;
  
  const entry = QuickEntry({
    onSave: async (parsedTask) => {
      const newTask = {
        id: `t-${Date.now()}`,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        checklistItems: [],
        ...parsedTask
      };
      await store.put('tasks', newTask);
    }
  }, store);
  
  if (document.body && document.body.appendChild) {
    document.body.appendChild(entry);
    const input = entry.querySelector('.quick-entry-input');
    if (input && input.focus) input.focus();
  }
}

// Sidebar nav definition — route : { label, icon }
const NAV_ITEMS = [
  { route: 'inbox',    label: 'Inbox',    icon: '📥' },
  { route: 'today',    label: 'Today',    icon: '⭐' },
  { route: 'upcoming', label: 'Upcoming', icon: '📅' },
  { route: 'someday',  label: 'Someday',  icon: '🌤️' },
  { route: 'logbook',  label: 'Logbook',  icon: '✅' },
  { route: 'habits',   label: 'Habits',   icon: '🔥' },
  { route: 'pomodoro', label: 'Pomodoro', icon: '⏱️' },
  { route: 'kanban',   label: 'Kanban',   icon: '🗂️' },
  { route: 'settings', label: 'Settings', icon: '⚙️' },
];

// Render (or update) sidebar links + active highlight
function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav || !nav.dataset) return;

  const current = (window.location.hash || '#today').substring(1);

  // Build fresh if empty, otherwise just toggle active class
  if (!nav.dataset.built) {
    nav.innerHTML = '';
    for (const item of NAV_ITEMS) {
      const a = document.createElement('a');
      a.href = `#${item.route}`;
      a.className = 'sidebar-link';
      a.dataset.route = item.route;
      a.innerHTML = `<span class="sidebar-icon">${item.icon}</span><span class="sidebar-label">${item.label}</span>`;
      nav.appendChild(a);
    }
    nav.dataset.built = '1';
  }

  for (const a of nav.querySelectorAll('.sidebar-link')) {
    a.classList.toggle('active', a.dataset.route === current);
  }
}

// Simple view templates
const views = {
  onboarding: () => OnboardingView(store),
  today: () => {
    const tasks = store.getAllCached('tasks');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => !t.completed && (t.dueDate === todayStr || (t.dueDate && t.dueDate < todayStr)));
    
    const projects = {};
    for (const proj of store.getAllCached('projects')) {
      projects[proj.id] = proj;
    }
    return TodayView(todayTasks, projects);
  },
  inbox: () => {
    const tasks = store.getAllCached('tasks').filter(t => !t.completed && !t.projectId);
    const projects = {};
    for (const proj of store.getAllCached('projects')) {
      projects[proj.id] = proj;
    }
    return InboxView(tasks, projects);
  },
  upcoming: () => {
    const tasks = store.getAllCached('tasks');
    const projects = {};
    for (const proj of store.getAllCached('projects')) {
      projects[proj.id] = proj;
    }
    return UpcomingView(tasks, projects);
  },
  someday: () => {
    const tasks = store.getAllCached('tasks').filter(t => !t.completed && !t.dueDate);
    const projects = {};
    for (const proj of store.getAllCached('projects')) {
      projects[proj.id] = proj;
    }
    return SomedayView(tasks, projects);
  },
  logbook: () => {
    const tasks = store.getAllCached('tasks').filter(t => t.completed);
    const projects = {};
    for (const proj of store.getAllCached('projects')) {
      projects[proj.id] = proj;
    }
    return LogbookView(tasks, projects);
  },
  settings: () => SettingsView(store),
  pomodoro: () => PomodoroView(store),
  focus: () => {
    const taskId = new URLSearchParams(window.location.search || '').get('id');
    return FocusView(taskId, store);
  },
  habits: () => HabitsView(store),
  kanban: () => {
    const tasks = store.getAllCached('tasks');
    const projects = {};
    for (const proj of store.getAllCached('projects')) {
      projects[proj.id] = proj;
    }
    return KanbanView(tasks, projects, store);
  }
};

// Route switching logic
function navigate() {
  renderSidebar();
  const hash = window.location.hash || '#today';
  const viewContainer = document.getElementById('view-container');
  if (!viewContainer) return;

  const route = hash.substring(1);
  const renderer = views[route];
  if (renderer) {
    const el = renderer();
    if (typeof el === 'string') {
      viewContainer.innerHTML = el;
    } else if (el) {
      if (el.addEventListener) {
        el.addEventListener('task-updated', async (e) => {
          const data = e.detail || e;
          if (data && data.id) {
            await store.put('tasks', { ...data, updatedAt: Date.now() });
          }
        });
        el.addEventListener('task-completed', async (e) => {
          const data = e.detail || e;
          if (data && data.id) {
            const task = store.getCached('tasks', data.id);
            if (task) {
              await store.put('tasks', { ...task, completed: data.completed, updatedAt: Date.now() });
            }
          }
        });
      }
      if (viewContainer.replaceChildren) {
        viewContainer.replaceChildren(el);
      } else if (viewContainer.appendChild) {
        viewContainer.innerHTML = '';
        viewContainer.appendChild(el);
      } else {
        viewContainer.innerHTML = el.innerHTML || '';
      }
    }
  } else {
    viewContainer.innerHTML = `<h1>View Not Found: ${route}</h1>`;
  }
}

// App Initialization
async function initApp() {
  try {
    // 1. Initialize IndexedDB and warm up cache
    await store.init();

    // 2. Check for seed parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('seed') === 'true') {
      await store.seed();
    }

    // 3. Intercept boot routing based on onboarding status
    const onboarded = store.getCached('settings', 'onboarded');
    if (!onboarded) {
      if (window.location.hash !== '#onboarding') {
        window.location.hash = '#onboarding';
      }
    } else if (!window.location.hash || window.location.hash === '#onboarding') {
      window.location.hash = '#today';
    }

    // Apply saved theme preference
    const themeSetting = store.getCached('settings', 'theme');
    if (themeSetting && themeSetting.value) {
      document.documentElement.setAttribute('data-theme', themeSetting.value);
      if (themeSetting.value === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      } else if (themeSetting.value === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      }
    }

    // Set up subscriptions
    store.subscribe('tasks', () => {
      if (appInitialized) navigate();
    });
    store.subscribe('projects', () => {
      if (appInitialized) navigate();
    });
    store.subscribe('sessions', () => {
      if (appInitialized) navigate();
    });
    store.subscribe('habits', () => {
      if (appInitialized) navigate();
    });
    store.subscribe('habitLogs', () => {
      if (appInitialized) navigate();
    });

    // Set up hash change listener and render initial view
    window.addEventListener('hashchange', navigate);
    appInitialized = true;
    navigate();

    // 4. Hide splash screen overlay once DB is ready
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('hidden');
    }

    // 5. Global hotkey for Quick Entry (Ctrl + Space)
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        openQuickEntry();
      }
    });

    // 6. Global event delegator for "Capture a new task" buttons
    if (document.addEventListener) {
      document.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('empty-cta-btn')) {
          openQuickEntry();
        }
      });
    }

    // 7. Register Service Worker for offline capability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => console.error('SW registration failed:', err));
    }

    // 8. Start local reminder checking loop
    notifier.startChecking(5000);
    notifier.requestPermission().catch(err => console.error('SW permission request failed:', err));
  } catch (err) {
    console.error('App failed to initialize:', err);
  }
}

// Start boot sequence
initApp();


