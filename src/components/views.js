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

    const task = e.task;
    const detailPanel = TaskDetailPanel(task, {
      onSave: (updatedTask) => {
        el.dispatchEvent('task-updated', updatedTask);
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

export function OnboardingView() {
  const el = document.createElement('div');
  el.classList.add('onboarding-view-container');
  
  const heading = document.createElement('h1');
  heading.textContent = 'Welcome to Cognify';
  el.appendChild(heading);

  const desc = document.createElement('p');
  desc.textContent = 'Your calm, cognitive assistant.';
  el.appendChild(desc);
  
  return el;
}

export function SettingsView() {
  const el = document.createElement('div');
  el.classList.add('settings-view-container');
  
  const heading = document.createElement('h1');
  heading.textContent = 'Settings';
  el.appendChild(heading);

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

    const task = e.task;
    const detailPanel = TaskDetailPanel(task, {
      onSave: (updatedTask) => {
        el.dispatchEvent('task-updated', updatedTask);
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
