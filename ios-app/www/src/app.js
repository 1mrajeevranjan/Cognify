import { TaskStore } from './store.js';
import { TodayView, OnboardingView, SettingsView, UpcomingView, InboxView, SomedayView, LogbookView, PomodoroView, FocusView, HabitsView, KanbanView, AuthView, WorkspacesView, WorkloadView, AnalyticsView, EisenhowerView, CalendarView, WeeklyReviewView } from './components/views.js';
import { QuickEntry } from './components/quickentry.js';
import { Notifier } from './utils.js';
import { supabase } from './supabase.js';

export let currentUser = null;

export const store = new TaskStore();
export const notifier = new Notifier(store);
let appInitialized = false;

function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (window.Capacitor || /iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Mac/.test(navigator.platform || '') || /Macintosh|Electron/.test(ua)) return 'macos';
  return 'web';
}

const PLATFORM = detectPlatform();
if (typeof document !== 'undefined') {
  if (document.documentElement && document.documentElement.dataset) {
    document.documentElement.dataset.platform = PLATFORM;
  }
  if (document.body && document.body.classList) {
    document.body.classList.add(`platform-${PLATFORM}`);
  }
}

function iconMarkup(name) {
  const svg = (paths) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${paths}
    </svg>
  `;

  const icons = {
    inbox: svg('<path d="M4 12h4l2 3h4l2-3h4"/><path d="M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"/>'),
    today: svg('<path d="M12 3v18"/><path d="M3 12h18"/><circle cx="12" cy="12" r="3.5"/>'),
    upcoming: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/>'),
    someday: svg('<path d="M12 7v5l3 3"/><circle cx="12" cy="12" r="8"/>'),
    logbook: svg('<path d="m9 12 2 2 4-5"/><circle cx="12" cy="12" r="8"/>'),
    habits: svg('<path d="M12 3c1.4 2.4 4.2 4.6 4.2 8.1A4.2 4.2 0 0 1 12 15a4.2 4.2 0 0 1-4.2-3.9C7.8 7.6 10.6 5.4 12 3Z"/><path d="M12 15c-1.8 1.3-3 3-3 4.8 0 .7.2 1.4.5 2.2"/><path d="M12 15c1.8 1.3 3 3 3 4.8 0 .7-.2 1.4-.5 2.2"/>'),
    pomodoro: svg('<circle cx="12" cy="13" r="7"/><path d="M12 13V9"/><path d="M15 4H9"/><path d="M17 6 15.5 7.5"/>'),
    kanban: svg('<rect x="3" y="5" width="5" height="14" rx="1.5"/><rect x="10" y="5" width="5" height="9" rx="1.5"/><rect x="17" y="5" width="4" height="12" rx="1.5"/>'),
    matrix: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    teams: svg('<path d="M16 20a4 4 0 0 0-8 0"/><circle cx="12" cy="10" r="3"/><path d="M20 19a3 3 0 0 0-2.6-2.9"/><path d="M4 19a3 3 0 0 1 2.6-2.9"/><path d="M17.5 7.5a2.5 2.5 0 0 0-1.5-2.3"/><path d="M6.5 7.5A2.5 2.5 0 0 1 8 5.2"/>'),
    workload: svg('<path d="M5 19V9"/><path d="M12 19V5"/><path d="M19 19v-7"/>'),
    analytics: svg('<path d="M4 19h16"/><path d="m6 15 4-4 3 2 5-6"/>'),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3 10h18"/><path d="M8 14h3"/><path d="M13 14h3"/>'),
    review: svg('<path d="M8 7h8"/><path d="M8 12h8"/><path d="M8 17h5"/><path d="M6 3h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1L4.8 8A2 2 0 1 1 7.6 5.2l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1A2 2 0 1 1 18.3 8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.7Z"/>'),
    person: svg('<path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="9" r="4"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    plus: svg('<path d="M12 5v14"/><path d="M5 12h14"/>'),
    sidebar: svg('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M9 5v14"/>'),
    menu: svg('<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>')
  };

  return icons[name] || icons.inbox;
}

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.add('mobile-open');
  overlay.classList.add('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('active');
}

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
  { route: 'inbox',    label: 'Inbox',    icon: 'inbox' },
  { route: 'today',    label: 'Today',    icon: 'today' },
  { route: 'upcoming', label: 'Upcoming', icon: 'upcoming' },
  { route: 'someday',  label: 'Someday',  icon: 'someday' },
  { route: 'logbook',  label: 'Logbook',  icon: 'logbook' },
  { route: 'habits',   label: 'Habits',   icon: 'habits' },
  { route: 'pomodoro', label: 'Pomodoro', icon: 'pomodoro' },
  { route: 'kanban',   label: 'Kanban',   icon: 'kanban' },
  { route: 'eisenhower', label: 'Matrix', icon: 'matrix' },
  { route: 'workspaces', label: 'Teams',  icon: 'teams' },
  { route: 'workload', label: 'Workload', icon: 'workload' },
  { route: 'analytics', label: 'Analytics', icon: 'analytics' },
  { route: 'calendar',  label: 'Calendar',  icon: 'calendar' },
  { route: 'weeklyreview', label: 'Review', icon: 'review' },
  { route: 'settings', label: 'Settings', icon: 'settings' },
];

const MOBILE_TAB_ITEMS = ['inbox', 'today', 'upcoming', 'calendar'];

// Render (or update) sidebar links + active highlight
function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav || !nav.dataset) return;

  const current = (window.location.hash || '#today').substring(1);

  // Build fresh if empty, otherwise just toggle active class
  if (!nav.dataset.built) {
    nav.innerHTML = '';
    for (const item of NAV_ITEMS) {
      if (!currentUser && ['workspaces', 'workload'].includes(item.route)) continue;
      const a = document.createElement('a');
      a.href = `#${item.route}`;
      a.className = 'sidebar-link';
      a.dataset.route = item.route;
      a.innerHTML = `<span class="sidebar-icon">${iconMarkup(item.icon)}</span><span class="sidebar-label">${item.label}</span>`;
      nav.appendChild(a);
    }
    
    // Add Auth/Logout action at bottom of sidebar
    const divider = document.createElement('div');
    divider.className = 'sidebar-divider';
    divider.style.borderTop = '1px solid var(--border)';
    divider.style.margin = 'var(--spacing-sm) 0';
    nav.appendChild(divider);
    
    const authLink = document.createElement('a');
    if (currentUser) {
      authLink.href = '#';
      authLink.className = 'sidebar-link auth-status-link';
      authLink.innerHTML = `<span class="sidebar-icon">${iconMarkup('person')}</span><span class="sidebar-label">Sign Out</span>`;
      authLink.addEventListener('click', async (e) => {
        e.preventDefault();
        if (supabase) {
          await supabase.auth.signOut();
          window.location.hash = '#auth';
        }
      });
    } else {
      authLink.href = '#auth';
      authLink.className = 'sidebar-link auth-status-link';
      authLink.innerHTML = `<span class="sidebar-icon">${iconMarkup('lock')}</span><span class="sidebar-label">Sign In</span>`;
    }
    nav.appendChild(authLink);
    
    nav.dataset.built = '1';
  }

  for (const a of nav.querySelectorAll('.sidebar-link')) {
    a.classList.toggle('active', a.dataset.route === current);
  }
}

function renderMobileTabbar() {
  const tabbar = document.getElementById('mobile-tabbar');
  if (!tabbar || !tabbar.dataset) return;

  const current = (window.location.hash || '#today').substring(1);

  if (!tabbar.dataset.built) {
    tabbar.innerHTML = '';

    // ponytail: 4 core destinations here, full nav stays in sidebar.
    for (const route of MOBILE_TAB_ITEMS) {
      const item = NAV_ITEMS.find((entry) => entry.route === route);
      if (!item) continue;

      const link = document.createElement('a');
      link.href = `#${item.route}`;
      link.className = 'mobile-tab-link';
      link.dataset.route = item.route;
      link.innerHTML = `
        <span class="mobile-tab-icon">${iconMarkup(item.icon)}</span>
        <span class="mobile-tab-label">${item.label}</span>
      `;
      tabbar.appendChild(link);
    }

    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'mobile-tab-link mobile-tab-more';
    menuButton.innerHTML = `
      <span class="mobile-tab-icon">${iconMarkup('menu')}</span>
      <span class="mobile-tab-label">More</span>
    `;
    menuButton.addEventListener('click', openSidebar);
    tabbar.appendChild(menuButton);

    tabbar.dataset.built = '1';
  }

  for (const item of tabbar.querySelectorAll('.mobile-tab-link[data-route]')) {
    item.classList.toggle('active', item.dataset.route === current);
  }
}

function updateMacToolbar(route) {
  const title = document.getElementById('mac-toolbar-title');
  if (!title) return;

  const item = NAV_ITEMS.find((entry) => entry.route === route);
  title.textContent = item ? item.label : 'Cognify';
}

function toggleMacSidebar() {
  if (document.body) document.body.classList.toggle('mac-sidebar-collapsed');
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
  },
  eisenhower: () => {
    const tasks = store.getAllCached('tasks');
    return EisenhowerView(tasks, store);
  },
  workspaces: () => {
    if (!currentUser) {
      window.location.hash = '#auth';
      return document.createElement('div');
    }
    return WorkspacesView(store);
  },
  workload: () => {
    if (!currentUser) {
      window.location.hash = '#auth';
      return document.createElement('div');
    }
    return WorkloadView(store);
  },
  analytics: () => {
    return AnalyticsView(store);
  },
  calendar: () => {
    return CalendarView(store);
  },
  weeklyreview: () => {
    return WeeklyReviewView(store);
  },
  auth: () => AuthView(store)
};

// Route switching logic
function navigate() {
  renderSidebar();
  renderMobileTabbar();
  const hash = window.location.hash || '#today';
  const viewContainer = document.getElementById('view-container');
  if (!viewContainer) return;

  const route = hash.substring(1);
  updateMacToolbar(route);
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
  
  // Close mobile sidebar on navigation
  closeSidebar();
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

    // 3b. Setup Supabase Auth state listener
    if (supabase) {
      supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        const nav = document.getElementById('sidebar-nav');
        if (nav) delete nav.dataset.built;
        renderSidebar();
        if (appInitialized) navigate();
      });
      supabase.auth.getSession().then(({ data }) => {
        currentUser = data?.session?.user || null;
        const nav = document.getElementById('sidebar-nav');
        if (nav) delete nav.dataset.built;
        renderSidebar();
      });
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
      if ((e.ctrlKey && e.code === 'Space') || (e.metaKey && e.key.toLowerCase() === 'k')) {
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

    // 6b. Shell actions
    const quickAddButtons = ['sidebar-quick-add', 'mobile-quick-add', 'mac-quick-add'];
    for (const id of quickAddButtons) {
      const button = document.getElementById(id);
      if (button) {
        if (id === 'mac-quick-add') button.innerHTML = iconMarkup('plus');
        button.addEventListener('click', openQuickEntry);
      }
    }

    const macSidebarToggle = document.getElementById('mac-sidebar-toggle');
    if (macSidebarToggle) {
      macSidebarToggle.innerHTML = iconMarkup('sidebar');
      macSidebarToggle.addEventListener('click', toggleMacSidebar);
    }

    window.addEventListener('cognify-open-quick-entry', openQuickEntry);
    window.addEventListener('cognify-toggle-sidebar', toggleMacSidebar);

    const menuBtn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('sidebar-overlay');
    if (menuBtn) {
      menuBtn.innerHTML = iconMarkup('menu');
      menuBtn.addEventListener('click', openSidebar);
    }
    if (overlay) {
      overlay.addEventListener('click', closeSidebar);
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
