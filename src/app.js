import { TaskStore } from './store.js';
import { TodayView, OnboardingView, SettingsView } from './components/views.js';

export const store = new TaskStore();
let appInitialized = false;

// Simple view templates (Task 4 will expand these modularly)
const views = {
  onboarding: () => OnboardingView(),
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
    return TodayView(tasks, projects);
  },
  upcoming: () => '<h1>Upcoming</h1>',
  someday: () => '<h1>Someday</h1>',
  logbook: () => '<h1>Logbook</h1>',
  settings: () => SettingsView()
};

// Route switching logic
function navigate() {
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

    // Set up subscriptions
    store.subscribe('tasks', () => {
      if (appInitialized) navigate();
    });
    store.subscribe('projects', () => {
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
  } catch (err) {
    console.error('App failed to initialize:', err);
  }
}

// Start boot sequence
initApp();

