import { TaskStore } from './store.js';

export const store = new TaskStore();

// Simple view templates (Task 4 will expand these modularly)
const views = {
  onboarding: () => '<h1>Onboarding</h1>',
  today: () => '<h1>Today</h1>',
  inbox: () => '<h1>Inbox</h1>',
  upcoming: () => '<h1>Upcoming</h1>',
  someday: () => '<h1>Someday</h1>',
  logbook: () => '<h1>Logbook</h1>',
  settings: () => '<h1>Settings</h1>'
};

// Route switching logic
function navigate() {
  const hash = window.location.hash || '#today';
  const viewContainer = document.getElementById('view-container');
  if (!viewContainer) return;

  const route = hash.substring(1);
  const renderer = views[route];
  if (renderer) {
    viewContainer.innerHTML = renderer();
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

    // Set up hash change listener and render initial view
    window.addEventListener('hashchange', navigate);
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
