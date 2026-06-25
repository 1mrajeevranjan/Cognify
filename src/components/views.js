import { TaskList, TaskItem, TaskDetailPanel } from './item.js';

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
  return createSplitLayoutView('today-view-container', 'Today', tasks, projects);
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
  
  const themeToggle = document.createElement('button');
  themeToggle.classList.add('theme-toggle-btn');
  themeToggle.textContent = 'Toggle Dark Mode';
  themeToggle.addEventListener('click', () => {
    const isCurrentlyDark = document.body.classList.contains('dark-theme') || 
      (!document.body.classList.contains('light-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isCurrentlyDark) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      if (store) {
        store.put('settings', { key: 'theme', value: 'light' });
      }
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      if (store) {
        store.put('settings', { key: 'theme', value: 'dark' });
      }
    }
  });
  themeSection.appendChild(themeToggle);
  el.appendChild(themeSection);

  // Backup Import/Export section
  const backupSection = document.createElement('div');
  backupSection.classList.add('settings-section');
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
  importInput.style.display = 'none';
  
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
  el.appendChild(backupSection);

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
