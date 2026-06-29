export function TaskItem(task) {
  const el = document.createElement('div');
  el.classList.add('task-item-row');
  el.setAttribute('id', `task-${task.id}`);
  
  if (task.completed) {
    el.classList.add('completed');
  }

  // Circular checkbox
  const checkbox = document.createElement('div');
  checkbox.classList.add('task-checkbox');
  if (task.completed) {
    checkbox.classList.add('checked');
  }
  el.appendChild(checkbox);

  // Content block (title, notes)
  const content = document.createElement('div');
  content.classList.add('task-item-content');
  
  const title = document.createElement('div');
  title.classList.add('task-title');
  title.textContent = task.title;
  content.appendChild(title);

  if (task.notes) {
    const notes = document.createElement('div');
    notes.classList.add('task-notes');
    notes.textContent = task.notes;
    content.appendChild(notes);
  }
  
  el.appendChild(content);

  // Metadata block (tags, dates, priority)
  const meta = document.createElement('div');
  meta.classList.add('task-meta');
  
  if (task.priority) {
    const priority = document.createElement('span');
    priority.classList.add('meta-priority', `priority-${task.priority.toLowerCase()}`);
    priority.textContent = task.priority;
    meta.appendChild(priority);
  }

  if (task.dueDate) {
    const dueDate = document.createElement('span');
    dueDate.classList.add('meta-date');
    dueDate.textContent = task.dueDate;
    meta.appendChild(dueDate);
  }

  if (task.tags && task.tags.length > 0) {
    for (const tag of task.tags) {
      const tagEl = document.createElement('span');
      tagEl.classList.add('meta-tag');
      tagEl.textContent = `#${tag}`;
      meta.appendChild(tagEl);
    }
  }

  el.appendChild(meta);

  // Set up click handlers for task completion (800ms hold state)
  checkbox.addEventListener('click', (event) => {
    event.stopPropagation();
    checkbox.classList.toggle('checked');
    el.classList.toggle('holding-completion');
    
    // Set 800ms timer
    const holdTimer = setTimeout(() => {
      // Trigger update complete
      el.classList.add('completed');
      el.dispatchEvent(new CustomEvent('task-completed', {
        detail: { id: task.id, completed: !task.completed },
        bubbles: true
      }));
    }, 800);
    
    el.holdTimer = holdTimer;
  });

  // Click on the row itself to select/inspect the task
  el.addEventListener('click', () => {
    el.dispatchEvent(new CustomEvent('task-selected', {
      detail: { id: task.id, task },
      bubbles: true
    }));
  });

  // Reschedule button & dropdown popover
  const rescheduleContainer = document.createElement('div');
  rescheduleContainer.classList.add('reschedule-container');

  const rescheduleBtn = document.createElement('button');
  rescheduleBtn.classList.add('reschedule-btn');
  rescheduleBtn.textContent = '📅';
  rescheduleBtn.setAttribute('title', 'Reschedule task');
  rescheduleContainer.appendChild(rescheduleBtn);

  const popover = document.createElement('div');
  popover.classList.add('reschedule-popover');
  
  const optToday = document.createElement('button');
  optToday.classList.add('reschedule-option', 'reschedule-today');
  optToday.textContent = 'Today';
  optToday.addEventListener('click', (event) => {
    event.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0];
    el.dispatchEvent(new CustomEvent('task-updated', {
      detail: { ...task, dueDate: todayStr },
      bubbles: true
    }));
    popover.classList.remove('show');
  });
  popover.appendChild(optToday);

  const optTomorrow = document.createElement('button');
  optTomorrow.classList.add('reschedule-option', 'reschedule-tomorrow');
  optTomorrow.textContent = 'Tomorrow';
  optTomorrow.addEventListener('click', (event) => {
    event.stopPropagation();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    el.dispatchEvent(new CustomEvent('task-updated', {
      detail: { ...task, dueDate: tomorrowStr },
      bubbles: true
    }));
    popover.classList.remove('show');
  });
  popover.appendChild(optTomorrow);

  const optNextWeek = document.createElement('button');
  optNextWeek.classList.add('reschedule-option', 'reschedule-nextweek');
  optNextWeek.textContent = 'Next Week';
  optNextWeek.addEventListener('click', (event) => {
    event.stopPropagation();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    el.dispatchEvent(new CustomEvent('task-updated', {
      detail: { ...task, dueDate: nextWeekStr },
      bubbles: true
    }));
    popover.classList.remove('show');
  });
  popover.appendChild(optNextWeek);

  const optSomeday = document.createElement('button');
  optSomeday.classList.add('reschedule-option', 'reschedule-someday');
  optSomeday.textContent = 'Someday';
  optSomeday.addEventListener('click', (event) => {
    event.stopPropagation();
    el.dispatchEvent(new CustomEvent('task-updated', {
      detail: { ...task, dueDate: null },
      bubbles: true
    }));
    popover.classList.remove('show');
  });
  popover.appendChild(optSomeday);

  rescheduleContainer.appendChild(popover);
  el.appendChild(rescheduleContainer);

  rescheduleBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    popover.classList.toggle('show');
  });

  return el;
}

export function TaskList(tasks, projects = {}) {
  const container = document.createElement('div');
  container.classList.add('task-list-container');

  if (!tasks || tasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.classList.add('empty-state');
    
    const text = document.createElement('p');
    text.classList.add('empty-text');
    text.textContent = 'No tasks found. Keep it up!';
    emptyState.appendChild(text);

    const cta = document.createElement('button');
    cta.classList.add('empty-cta-btn');
    cta.textContent = 'Capture a new task';
    emptyState.appendChild(cta);

    container.appendChild(emptyState);
    return container;
  }

  // Group tasks by project
  const projectGroups = new Map();
  const inboxTasks = [];

  for (const task of tasks) {
    if (task.projectId && projects[task.projectId]) {
      if (!projectGroups.has(task.projectId)) {
        projectGroups.set(task.projectId, []);
      }
      projectGroups.get(task.projectId).push(task);
    } else {
      inboxTasks.push(task);
    }
  }

  // Render Inbox tasks first
  if (inboxTasks.length > 0) {
    const inboxHeader = document.createElement('h2');
    inboxHeader.classList.add('project-header');
    inboxHeader.textContent = 'Inbox';
    container.appendChild(inboxHeader);

    const listEl = document.createElement('div');
    listEl.classList.add('tasks-group');
    for (const task of inboxTasks) {
      listEl.appendChild(TaskItem(task));
    }
    container.appendChild(listEl);
  }

  // Render project grouped tasks
  for (const [projectId, projectTasks] of projectGroups.entries()) {
    const project = projects[projectId];
    
    const projectHeader = document.createElement('h2');
    projectHeader.classList.add('project-header');
    projectHeader.textContent = project.name;
    container.appendChild(projectHeader);

    const listEl = document.createElement('div');
    listEl.classList.add('tasks-group');
    for (const task of projectTasks) {
      listEl.appendChild(TaskItem(task));
    }
    container.appendChild(listEl);
  }

  return container;
}

export function TaskDetailPanel(task, callbacks = {}) {
  const el = document.createElement('div');
  el.classList.add('task-detail-panel');

  const taskCopy = { ...task, checklistItems: [...(task.checklistItems || [])] };

  const triggerSave = () => {
    if (callbacks.onSave) {
      callbacks.onSave(taskCopy);
    }
  };

  // Title input
  const titleInput = document.createElement('input');
  titleInput.classList.add('detail-title-input');
  titleInput.setAttribute('type', 'text');
  titleInput.value = taskCopy.title || '';
  titleInput.placeholder = 'Title';
  titleInput.addEventListener('change', () => {
    taskCopy.title = titleInput.value;
    triggerSave();
  });
  el.appendChild(titleInput);

  // Notes textarea
  const notesInput = document.createElement('textarea');
  notesInput.classList.add('detail-notes-input');
  notesInput.value = taskCopy.notes || '';
  notesInput.placeholder = 'Notes';
  notesInput.addEventListener('change', () => {
    taskCopy.notes = notesInput.value;
    triggerSave();
  });
  el.appendChild(notesInput);

  // Priority dropdown selector
  const priorityContainer = document.createElement('div');
  priorityContainer.classList.add('detail-priority-container');
  
  const priorityLabel = document.createElement('span');
  priorityLabel.textContent = 'Priority:';
  priorityContainer.appendChild(priorityLabel);

  const prioritySelect = document.createElement('select');
  prioritySelect.classList.add('detail-priority-select');
  for (const p of ['None', 'P1', 'P2', 'P3']) {
    const opt = document.createElement('option');
    opt.setAttribute('value', p === 'None' ? '' : p);
    opt.textContent = p;
    if ((!taskCopy.priority && p === 'None') || taskCopy.priority === p) {
      opt.setAttribute('selected', 'selected');
    }
    prioritySelect.appendChild(opt);
  }
  prioritySelect.addEventListener('change', () => {
    taskCopy.priority = prioritySelect.value || null;
    triggerSave();
  });
  priorityContainer.appendChild(prioritySelect);
  el.appendChild(priorityContainer);

  // Checklist / Subtasks UI
  const subtasksContainer = document.createElement('div');
  subtasksContainer.classList.add('detail-subtasks-container');
  
  const subtasksHeader = document.createElement('h3');
  subtasksHeader.textContent = 'Checklist';
  subtasksContainer.appendChild(subtasksHeader);

  const listContainer = document.createElement('div');
  listContainer.classList.add('detail-subtasks-list');

  const renderSubtasks = () => {
    listContainer.innerHTML = '';
    for (let i = 0; i < taskCopy.checklistItems.length; i++) {
      const sub = taskCopy.checklistItems[i];
      const itemEl = document.createElement('div');
      itemEl.classList.add('detail-subtask-item');

      const checkbox = document.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      if (sub.completed) {
        checkbox.setAttribute('checked', 'checked');
      }
      checkbox.addEventListener('change', () => {
        sub.completed = checkbox.checked;
        triggerSave();
      });
      itemEl.appendChild(checkbox);

      const text = document.createElement('input');
      text.setAttribute('type', 'text');
      text.value = sub.title || '';
      text.addEventListener('change', () => {
        sub.title = text.value;
        triggerSave();
      });
      itemEl.appendChild(text);

      listContainer.appendChild(itemEl);
    }
  };
  renderSubtasks();
  subtasksContainer.appendChild(listContainer);

  const addBtn = document.createElement('button');
  addBtn.classList.add('add-subtask-btn');
  addBtn.textContent = 'Add checklist item';
  addBtn.addEventListener('click', () => {
    taskCopy.checklistItems.push({
      id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: '',
      completed: false
    });
    renderSubtasks();
    triggerSave();
  });
  subtasksContainer.appendChild(addBtn);
  el.appendChild(subtasksContainer);

  // Focus Mode Button
  const focusBtn = document.createElement('a');
  focusBtn.className = 'detail-focus-btn';
  focusBtn.href = `#focus?id=${taskCopy.id}`;
  focusBtn.textContent = '▶ Focus Mode';
  focusBtn.style.display = 'inline-block';
  focusBtn.style.marginTop = 'var(--spacing-md)';
  focusBtn.style.padding = 'var(--spacing-sm) var(--spacing-md)';
  focusBtn.style.background = 'var(--accent)';
  focusBtn.style.color = 'white';
  focusBtn.style.textDecoration = 'none';
  focusBtn.style.borderRadius = '6px';
  focusBtn.style.fontSize = '0.9rem';
  focusBtn.style.fontWeight = '500';
  el.appendChild(focusBtn);

  return el;
}
