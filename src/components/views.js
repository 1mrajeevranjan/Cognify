import { TaskList, TaskItem, TaskDetailPanel } from './item.js';
import { DailyBriefing } from '../utils.js';
import { PomodoroWidget } from './pomodoro.js';
import { HabitsView } from './habits.js';
import { KanbanView } from './kanban.js';
import { supabase } from '../supabase.js';

function createSplitLayoutView(viewClass, headingText, tasks, projects) {
  const el = document.createElement('div');
  el.classList.add(viewClass);
  el.classList.add('view-split-layout');

  const mainPane = document.createElement('div');
  mainPane.classList.add('list-pane');
  el.appendChild(mainPane);

  const heading = document.createElement('h1');
  heading.textContent = headingText;
  mainPane.appendChild(heading);

  const listEl = TaskList(tasks, projects);
  mainPane.appendChild(listEl);

  const detailPane = document.createElement('div');
  detailPane.classList.add('detail-pane');
  el.appendChild(detailPane);

  // Listen for task selection
  el.addEventListener('task-selected', (e) => {
    detailPane.innerHTML = '';
    detailPane.classList.add('open');

    const task = e.detail.task;
    const detailPanel = TaskDetailPanel(task, {
      onSave: (updatedTask) => {
        el.dispatchEvent(new CustomEvent('task-updated', {
          detail: updatedTask,
          bubbles: true
        }));
      }
    });

    // Close button for mobile layout
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('detail-close-btn');
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
      detailPane.classList.remove('open');
    });
    
    if (detailPanel.insertBefore) {
      detailPanel.insertBefore(closeBtn, detailPanel.firstChild);
    } else {
      detailPanel.appendChild(closeBtn);
    }

    detailPane.appendChild(detailPanel);
  });

  return el;
}

export function TodayView(tasks, projects = {}) {
  const el = createSplitLayoutView('today-view-container', 'Today', tasks, projects);
  
  if (tasks && tasks.length > 0) {
    const briefing = new DailyBriefing(null);
    const suggested = briefing.suggest(tasks);
    if (suggested.length > 0) {
      const card = document.createElement('div');
      card.className = 'briefing-card';
      
      const greeting = document.createElement('div');
      greeting.className = 'briefing-greeting';
      greeting.textContent = briefing.greeting();
      card.appendChild(greeting);
      
      const subtitle = document.createElement('p');
      subtitle.className = 'briefing-subtitle';
      subtitle.textContent = 'Suggested focus for today:';
      card.appendChild(subtitle);
      
      const list = document.createElement('ol');
      list.className = 'briefing-list';
      for (const task of suggested) {
        const li = document.createElement('li');
        li.className = 'briefing-task-item';
        li.textContent = task.title;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
          el.dispatchEvent(new CustomEvent('task-selected', {
            detail: { task, id: task.id },
            bubbles: true
          }));
        });
        list.appendChild(li);
      }
      card.appendChild(list);
      
      const listPane = el.querySelector('.list-pane');
      if (listPane) {
        const heading = listPane.querySelector('h1');
        if (heading && heading.nextSibling) {
          listPane.insertBefore(card, heading.nextSibling);
        } else {
          listPane.appendChild(card);
        }
      }
    }
  }
  
  return el;
}

export function InboxView(tasks, projects = {}) {
  return createSplitLayoutView('inbox-view-container', 'Inbox', tasks, projects);
}

export function SomedayView(tasks, projects = {}) {
  return createSplitLayoutView('someday-view-container', 'Someday', tasks, projects);
}

export function LogbookView(tasks, projects = {}) {
  return createSplitLayoutView('logbook-view-container', 'Logbook', tasks, projects);
}

export function OnboardingView(store) {
  const el = document.createElement('div');
  el.classList.add('onboarding-view-container');
  
  const heading = document.createElement('h1');
  heading.textContent = 'Welcome to Cognify';
  el.appendChild(heading);

  const desc = document.createElement('p');
  desc.textContent = 'Your calm, offline-first personal space for focused thinking and capturing.';
  el.appendChild(desc);

  // Features / Shortcuts section
  const section = document.createElement('div');
  section.classList.add('onboarding-features');
  section.innerHTML = `
    <div class="feature-item">
      <h3>Keyboard Shortcut</h3>
      <p>Press <kbd>Ctrl</kbd> + <kbd>Space</kbd> anywhere to trigger Quick Entry floating capture.</p>
    </div>
    <div class="feature-item">
      <h3>Natural Language Capture</h3>
      <p>Type relative dates and metadata naturally, e.g., <em>"Water the plants tomorrow !p1 #home"</em></p>
    </div>
    <div class="feature-item">
      <h3>100% Local & Offline</h3>
      <p>Your data stays on your device in local IndexedDB storage. Zero cloud sync tracking by default.</p>
    </div>
  `;
  el.appendChild(section);

  const startBtn = document.createElement('button');
  startBtn.classList.add('get-started-btn');
  startBtn.textContent = 'Get Started';
  startBtn.addEventListener('click', async () => {
    if (store) {
      await store.put('settings', { key: 'onboarded', value: true });
    }
    window.location.hash = '#today';
  });
  el.appendChild(startBtn);
  
  return el;
}

export function SettingsView(store) {
  const el = document.createElement('div');
  el.classList.add('settings-view-container');
  
  const heading = document.createElement('h1');
  heading.textContent = 'Settings';
  el.appendChild(heading);

  // Theme section
  const themeSection = document.createElement('div');
  themeSection.classList.add('settings-section');
  themeSection.innerHTML = `<h3>Appearance</h3>`;
  
  const THEMES = [
    { name: 'light', label: 'Light', color: '#f5f5f7' },
    { name: 'dark', label: 'Dark', color: '#1a1d24' },
    { name: 'sepia', label: 'Sepia', color: '#f0ebe0' },
    { name: 'ocean', label: 'Ocean', color: '#0e1a26' },
    { name: 'forest', label: 'Forest', color: '#111c13' },
    { name: 'rose', label: 'Rose', color: '#f7f0f2' }
  ];

  const swatchRow = document.createElement('div');
  swatchRow.className = 'theme-swatch-row';

  const currentTheme = store ? (store.getCached('settings', 'theme')?.value || 'light') : 'light';

  for (const theme of THEMES) {
    const swatch = document.createElement('button');
    swatch.className = 'theme-swatch' + (theme.name === currentTheme ? ' theme-swatch-active' : '');
    swatch.title = theme.label;
    swatch.style.background = theme.color;
    swatch.setAttribute('data-theme-name', theme.name);
    swatch.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', theme.name);
      if (theme.name === 'light') {
        document.documentElement.removeAttribute('data-theme');
      }
      document.body.classList.remove('dark-theme', 'light-theme');
      if (theme.name === 'dark') document.body.classList.add('dark-theme');
      if (store) store.put('settings', { key: 'theme', value: theme.name });
      swatchRow.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('theme-swatch-active'));
      swatch.classList.add('theme-swatch-active');
    });
    swatchRow.appendChild(swatch);
  }
  themeSection.appendChild(swatchRow);
  el.appendChild(themeSection);

  // AI Settings Section
  const aiSection = document.createElement('div');
  aiSection.className = 'settings-section';
  aiSection.innerHTML = `<h3>AI Settings</h3>`;
  const keyLabel = document.createElement('label');
  keyLabel.className = 'settings-field-label';
  keyLabel.textContent = 'Gemini API Key';
  const keyInput = document.createElement('input');
  keyInput.type = 'password';
  keyInput.className = 'settings-text-input gemini-key-input';
  keyInput.placeholder = 'AIza...';
  if (store) {
    const existing = store.getCached('settings', 'gemini-api-key');
    if (existing && existing.value) keyInput.value = existing.value;
  }
  const keyHint = document.createElement('small');
  keyHint.className = 'settings-field-hint';
  keyHint.textContent = 'Get a free key at aistudio.google.com';
  const saveKeyBtn = document.createElement('button');
  saveKeyBtn.className = 'settings-action-btn save-key-btn';
  saveKeyBtn.textContent = 'Save API Key';
  saveKeyBtn.addEventListener('click', () => {
    if (store) store.put('settings', { key: 'gemini-api-key', value: keyInput.value });
    saveKeyBtn.textContent = 'Saved!';
    setTimeout(() => { saveKeyBtn.textContent = 'Save API Key'; }, 2000);
  });
  aiSection.appendChild(keyLabel);
  aiSection.appendChild(keyInput);
  aiSection.appendChild(keyHint);
  aiSection.appendChild(saveKeyBtn);
  el.appendChild(aiSection);

  // Backup Import/Export section
  const backupSection = document.createElement('div');
  backupSection.className = 'settings-section';
  backupSection.innerHTML = `<h3>Data Portability</h3>`;

  const exportBtn = document.createElement('button');
  exportBtn.classList.add('backup-export-btn');
  exportBtn.textContent = 'Export JSON Backup';
  exportBtn.addEventListener('click', async () => {
    if (!store) return;
    const tasks = store.getAllCached('tasks');
    const projects = store.getAllCached('projects');
    const areas = store.getAllCached('areas');
    const backupData = JSON.stringify({ tasks, projects, areas }, null, 2);
    
    try {
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cognify-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Backup export failed:', e);
    }
  });
  backupSection.appendChild(exportBtn);

  // Import file input
  const importInput = document.createElement('input');
  importInput.setAttribute('type', 'file');
  importInput.setAttribute('accept', '.json');
  importInput.className = 'visually-hidden';
  
  const importBtn = document.createElement('button');
  importBtn.classList.add('backup-import-btn');
  importBtn.textContent = 'Import JSON Backup';
  importBtn.addEventListener('click', () => importInput.click());

  importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (store && data) {
          if (Array.isArray(data.areas)) {
            for (const area of data.areas) await store.put('areas', area);
          }
          if (Array.isArray(data.projects)) {
            for (const proj of data.projects) await store.put('projects', proj);
          }
          if (Array.isArray(data.tasks)) {
            for (const task of data.tasks) await store.put('tasks', task);
          }
          alert('Backup imported successfully!');
        }
      } catch (err) {
        alert('Failed to parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
  backupSection.appendChild(importInput);
  backupSection.appendChild(importBtn);

  // Todoist import
  const todoistInput = document.createElement('input');
  todoistInput.type = 'file';
  todoistInput.accept = '.json';
  todoistInput.className = 'visually-hidden';
  const todoistBtn = document.createElement('button');
  todoistBtn.className = 'todoist-import-btn';
  todoistBtn.textContent = 'Import from Todoist';
  todoistBtn.addEventListener('click', () => todoistInput.click());
  const importResultDiv = document.createElement('div');
  importResultDiv.className = 'import-result-toast';
  todoistInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const { importTodoist } = await import('../import.js');
    const text = await file.text();
    const result = await importTodoist(text, store);
    importResultDiv.textContent = `✅ Imported ${result.imported} tasks, skipped ${result.skipped} duplicates.`;
  });
  backupSection.appendChild(todoistInput);
  backupSection.appendChild(todoistBtn);

  // Notion import
  const notionInput = document.createElement('input');
  notionInput.type = 'file';
  notionInput.accept = '.csv';
  notionInput.className = 'visually-hidden';
  const notionBtn = document.createElement('button');
  notionBtn.className = 'notion-import-btn';
  notionBtn.textContent = 'Import from Notion';
  notionBtn.addEventListener('click', () => notionInput.click());
  notionInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const { importNotion } = await import('../import.js');
    const text = await file.text();
    const result = await importNotion(text, store);
    importResultDiv.textContent = `✅ Imported ${result.imported} tasks, skipped ${result.skipped} duplicates.`;
  });
  backupSection.appendChild(notionInput);
  backupSection.appendChild(notionBtn);
  backupSection.appendChild(importResultDiv);

  el.appendChild(backupSection);

  // Integrations section
  const integrationsSection = document.createElement('div');
  integrationsSection.className = 'settings-section';
  integrationsSection.innerHTML = `<h3>Developer Integrations</h3>`;
  
  // Slack Webhook URL
  const slackLabel = document.createElement('label');
  slackLabel.className = 'settings-field-label';
  slackLabel.textContent = 'Slack Webhook URL';
  const slackInput = document.createElement('input');
  slackInput.className = 'settings-text-input slack-webhook-input';
  slackInput.placeholder = 'https://hooks.slack.com/...';
  if (store) {
    const existing = store.getCached('settings', 'slack_webhook');
    if (existing && existing.value) slackInput.value = existing.value;
  }
  
  // GitHub PAT
  const githubLabel = document.createElement('label');
  githubLabel.className = 'settings-field-label';
  githubLabel.textContent = 'GitHub Personal Access Token';
  const githubInput = document.createElement('input');
  githubInput.type = 'password';
  githubInput.className = 'settings-text-input github-token-input';
  githubInput.placeholder = 'ghp_...';
  if (store) {
    const existing = store.getCached('settings', 'github_token');
    if (existing && existing.value) githubInput.value = existing.value;
  }

  // GitHub Repo
  const githubRepoLabel = document.createElement('label');
  githubRepoLabel.className = 'settings-field-label';
  githubRepoLabel.textContent = 'GitHub Target Repository (Owner/Repo)';
  const githubRepoInput = document.createElement('input');
  githubRepoInput.className = 'settings-text-input github-repo-input';
  githubRepoInput.placeholder = 'e.g. 1mrajeevranjan/Cognify';
  if (store) {
    const existing = store.getCached('settings', 'github_repo');
    if (existing && existing.value) githubRepoInput.value = existing.value;
  }

  const saveIntBtn = document.createElement('button');
  saveIntBtn.className = 'settings-action-btn save-integrations-btn';
  saveIntBtn.textContent = 'Save Integrations';
  saveIntBtn.addEventListener('click', async () => {
    if (store) {
      await store.put('settings', { key: 'slack_webhook', value: slackInput.value.trim() });
      await store.put('settings', { key: 'github_token', value: githubInput.value.trim() });
      await store.put('settings', { key: 'github_repo', value: githubRepoInput.value.trim() });
    }
    saveIntBtn.textContent = 'Saved!';
    setTimeout(() => { saveIntBtn.textContent = 'Save Integrations'; }, 2000);
  });

  integrationsSection.appendChild(slackLabel);
  integrationsSection.appendChild(slackInput);
  integrationsSection.appendChild(githubLabel);
  integrationsSection.appendChild(githubInput);
  integrationsSection.appendChild(githubRepoLabel);
  integrationsSection.appendChild(githubRepoInput);
  integrationsSection.appendChild(saveIntBtn);
  el.appendChild(integrationsSection);

  // Clear data section
  const dangerSection = document.createElement('div');
  dangerSection.classList.add('settings-section', 'danger-section');
  dangerSection.innerHTML = `<h3>Danger Zone</h3>`;

  const clearBtn = document.createElement('button');
  clearBtn.classList.add('clear-data-btn');
  clearBtn.textContent = 'Clear All Data';
  clearBtn.addEventListener('click', async () => {
    if (store) {
      // Clear tasks
      for (const t of store.getAllCached('tasks')) {
        await store.delete('tasks', t.id);
      }
      // Clear projects
      for (const p of store.getAllCached('projects')) {
        await store.delete('projects', p.id);
      }
      // Clear areas
      for (const a of store.getAllCached('areas')) {
        await store.delete('areas', a.id);
      }
      // Delete onboarded setting
      await store.delete('settings', 'onboarded');
    }
    
    window.location.hash = '#onboarding';
  });
  dangerSection.appendChild(clearBtn);
  el.appendChild(dangerSection);

  return el;
}

export function UpcomingView(tasks, projects = {}) {
  const el = document.createElement('div');
  el.classList.add('upcoming-view-container');
  el.classList.add('view-split-layout');

  const mainPane = document.createElement('div');
  mainPane.classList.add('list-pane');
  el.appendChild(mainPane);

  const heading = document.createElement('h1');
  heading.textContent = 'Upcoming';
  mainPane.appendChild(heading);

  // Filter tasks that have a due date
  const datedTasks = (tasks || []).filter(t => t.dueDate);

  if (datedTasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.classList.add('empty-state');
    const text = document.createElement('p');
    text.textContent = 'No upcoming tasks. Enjoy your day!';
    emptyState.appendChild(text);
    mainPane.appendChild(emptyState);
  } else {
    // Group by due date
    const groups = {};
    for (const task of datedTasks) {
      if (!groups[task.dueDate]) {
        groups[task.dueDate] = [];
      }
      groups[task.dueDate].push(task);
    }

    // Sort dates chronologically
    const sortedDates = Object.keys(groups).sort();

    for (const dateStr of sortedDates) {
      const groupContainer = document.createElement('div');
      groupContainer.classList.add('upcoming-date-group');

      const header = document.createElement('h2');
      header.classList.add('date-group-header');
      
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (dateStr === todayStr) {
        header.textContent = 'Today';
      } else if (dateStr === tomorrowStr) {
        header.textContent = 'Tomorrow';
      } else {
        try {
          const dateObj = new Date(dateStr + 'T00:00:00');
          const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
          header.textContent = dateObj.toLocaleDateString('en-US', options);
        } catch (e) {
          header.textContent = dateStr;
        }
      }
      groupContainer.appendChild(header);

      const listEl = document.createElement('div');
      listEl.classList.add('tasks-group');
      for (const task of groups[dateStr]) {
        listEl.appendChild(TaskItem(task));
      }
      groupContainer.appendChild(listEl);

      mainPane.appendChild(groupContainer);
    }
  }

  const detailPane = document.createElement('div');
  detailPane.classList.add('detail-pane');
  el.appendChild(detailPane);

  // Listen for task selection
  el.addEventListener('task-selected', (e) => {
    detailPane.innerHTML = '';
    detailPane.classList.add('open');

    const task = e.detail.task;
    const detailPanel = TaskDetailPanel(task, {
      onSave: (updatedTask) => {
        el.dispatchEvent(new CustomEvent('task-updated', {
          detail: updatedTask,
          bubbles: true
        }));
      }
    });

    // Close button for mobile layout
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('detail-close-btn');
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
      detailPane.classList.remove('open');
    });
    
    if (detailPanel.insertBefore) {
      detailPanel.insertBefore(closeBtn, detailPanel.firstChild);
    } else {
      detailPanel.appendChild(closeBtn);
    }

    detailPane.appendChild(detailPanel);
  });

  return el;
}

export function PomodoroView(store) {
  const el = document.createElement('div');
  el.className = 'pomodoro-view-container';
  const h1 = document.createElement('h1');
  h1.textContent = 'Pomodoro';
  el.appendChild(h1);
  const widget = PomodoroWidget({ store });
  el.appendChild(widget);
  
  const log = document.createElement('div');
  log.className = 'session-log';
  const sessions = store ? store.getAllCached('sessions') : [];
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => new Date(s.completedAt).toISOString().split('T')[0] === todayStr);
  log.innerHTML = `<p class="session-count">Today: ${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} completed</p>`;
  el.appendChild(log);
  return el;
}

export function FocusView(taskId, store) {
  const el = document.createElement('div');
  el.className = 'focus-view-container';
  const task = store && taskId ? store.getCached('tasks', taskId) : null;
  const h1 = document.createElement('h1');
  h1.textContent = task ? task.title : 'Focus Mode';
  el.appendChild(h1);
  if (task && task.notes) {
    const notes = document.createElement('p');
    notes.className = 'focus-notes';
    notes.textContent = task.notes;
    el.appendChild(notes);
  }
  const widget = PomodoroWidget({ taskId, store });
  el.appendChild(widget);
  return el;
}

export function AuthView(store) {
  const el = document.createElement('div');
  el.className = 'auth-view-container';
  
  el.innerHTML = `
    <div class="auth-card">
      <h2>Welcome to Cognify</h2>
      <p class="auth-subtitle">Sign in or sign up to sync your tasks</p>
      <input class="auth-email" type="email" placeholder="Email" />
      <input class="auth-password" type="password" placeholder="Password" />
      <div class="auth-actions">
        <button class="auth-login-btn">Log In</button>
        <button class="auth-register-btn">Sign Up</button>
      </div>
      <p class="auth-error-msg"></p>
    </div>
  `;
  
  const emailInput = el.querySelector('.auth-email');
  const passInput = el.querySelector('.auth-password');
  const loginBtn = el.querySelector('.auth-login-btn');
  const registerBtn = el.querySelector('.auth-register-btn');
  const errorMsg = el.querySelector('.auth-error-msg');
  
  async function handleAuth(action) {
    if (!supabase) {
      errorMsg.textContent = 'Supabase client is not initialized';
      return;
    }
    const email = emailInput.value.trim();
    const password = passInput.value;
    if (!email || !password) {
      errorMsg.textContent = 'Please fill in all fields';
      return;
    }
    
    errorMsg.textContent = '';
    try {
      let result;
      if (action === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }
      
      if (result.error) {
        errorMsg.textContent = result.error.message;
      } else {
        window.location.hash = '#today';
      }
    } catch (err) {
      errorMsg.textContent = err.message;
    }
  }
  
  loginBtn.addEventListener('click', () => handleAuth('login'));
  registerBtn.addEventListener('click', () => handleAuth('register'));
  
  return el;
}

export { HabitsView, KanbanView };
export { WorkspacesView } from './workspaces.js';
export { WorkloadView } from './workload.js';
export { AnalyticsView } from './analytics.js';
export { EisenhowerView } from './eisenhower.js';
export { CalendarView } from './calendar.js';
export { WeeklyReviewView } from './weeklyreview.js';
