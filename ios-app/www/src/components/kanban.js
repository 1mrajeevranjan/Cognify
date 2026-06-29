export function KanbanView(tasks, projects, store) {
  const el = document.createElement('div');
  el.className = 'kanban-board';

  const todayStr = new Date().toISOString().split('T')[0];

  const columns = [
    { id: 'todo', label: 'To Do', filter: t => !t.completed && !t.dueDate },
    { id: 'inprogress', label: 'In Progress', filter: t => !t.completed && !!t.dueDate },
    { id: 'done', label: 'Done', filter: t => !!t.completed },
  ];

  for (const col of columns) {
    const colEl = document.createElement('div');
    colEl.className = 'kanban-column';
    colEl.dataset.col = col.id;

    const header = document.createElement('div');
    header.className = 'kanban-column-header';
    header.textContent = col.label;
    colEl.appendChild(header);

    const cards = document.createElement('div');
    cards.className = 'kanban-cards';

    const colTasks = (tasks || []).filter(col.filter);
    for (const task of colTasks) {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.setAttribute('draggable', 'true');
      card.dataset.taskId = task.id;
      const pBadge = task.priority ? `<span class="kanban-priority">${task.priority}</span>` : '';
      const tagBadge = task.tags && task.tags[0] ? `<span class="kanban-tag">#${task.tags[0]}</span>` : '';
      card.innerHTML = `<div class="kanban-card-title">${task.title}</div><div class="kanban-card-meta">${pBadge}${tagBadge}</div>`;
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      });
      cards.appendChild(card);
    }

    colEl.appendChild(cards);

    colEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      colEl.classList.add('drag-over');
    });
    colEl.addEventListener('dragleave', () => colEl.classList.remove('drag-over'));
    colEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      colEl.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      if (!store || !taskId) return;
      const task = store.getCached('tasks', taskId);
      if (!task) return;
      let updatedTask = { ...task };
      if (col.id === 'done') {
        updatedTask.completed = true;
      } else if (col.id === 'todo') {
        updatedTask.completed = false;
        updatedTask.dueDate = null;
      } else if (col.id === 'inprogress') {
        updatedTask.completed = false;
        if (!updatedTask.dueDate) updatedTask.dueDate = todayStr;
      }
      updatedTask.updatedAt = Date.now();
      await store.put('tasks', updatedTask);
    });

    el.appendChild(colEl);
  }

  return el;
}
