import { TaskList, TaskItem } from './item.js';

export function TodayView(tasks, projects = {}) {
  const el = document.createElement('div');
  el.classList.add('today-view-container');
  
  const heading = document.createElement('h1');
  heading.textContent = 'Today';
  el.appendChild(heading);

  const listEl = TaskList(tasks, projects);
  el.appendChild(listEl);
  
  return el;
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

  const heading = document.createElement('h1');
  heading.textContent = 'Upcoming';
  el.appendChild(heading);

  // Filter tasks that have a due date
  const datedTasks = (tasks || []).filter(t => t.dueDate);

  if (datedTasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.classList.add('empty-state');
    const text = document.createElement('p');
    text.textContent = 'No upcoming tasks. Enjoy your day!';
    emptyState.appendChild(text);
    el.appendChild(emptyState);
    return el;
  }

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

    el.appendChild(groupContainer);
  }

  return el;
}

