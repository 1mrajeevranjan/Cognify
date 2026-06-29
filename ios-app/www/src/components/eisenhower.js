export function EisenhowerView(tasks, store) {
  const el = document.createElement('div');
  el.className = 'eisenhower-view-container';

  const h1 = document.createElement('h1');
  h1.textContent = 'Eisenhower Matrix';
  el.appendChild(h1);

  const grid = document.createElement('div');
  grid.className = 'eisenhower-grid';
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '1fr 1fr';
  grid.style.gridTemplateRows = '1fr 1fr';
  grid.style.gap = 'var(--spacing-md)';
  grid.style.marginTop = 'var(--spacing-lg)';
  grid.style.height = 'calc(100vh - 160px)';
  el.appendChild(grid);

  const todayStr = new Date().toISOString().split('T')[0];

  const quadrants = [
    {
      id: 'q1',
      title: 'Do First',
      sub: 'Urgent & Important',
      color: 'var(--error)',
      filter: t => !t.completed && t.priority === 'P1' && t.dueDate && t.dueDate <= todayStr,
      update: { priority: 'P1', dueDate: todayStr }
    },
    {
      id: 'q2',
      title: 'Schedule',
      sub: 'Important but Not Urgent',
      color: 'var(--accent)',
      filter: t => !t.completed && (t.priority === 'P1' || t.priority === 'P2') && (!t.dueDate || t.dueDate > todayStr),
      update: { priority: 'P1', dueDate: null }
    },
    {
      id: 'q3',
      title: 'Delegate',
      sub: 'Urgent but Not Important',
      color: 'var(--warning)',
      filter: t => !t.completed && t.priority === 'P3' && t.dueDate && t.dueDate <= todayStr,
      update: { priority: 'P3', dueDate: todayStr }
    },
    {
      id: 'q4',
      title: 'Eliminate',
      sub: 'Neither',
      color: 'var(--foreground-muted)',
      filter: t => !t.completed && ((!t.priority && !t.dueDate) || (t.priority === 'P3' && (!t.dueDate || t.dueDate > todayStr)) || !t.priority),
      update: { priority: 'P3', dueDate: null }
    }
  ];

  for (const quad of quadrants) {
    const quadEl = document.createElement('div');
    quadEl.className = 'matrix-quadrant';
    quadEl.dataset.quadId = quad.id;
    quadEl.style.background = 'var(--surface)';
    quadEl.style.border = '2px solid var(--border)';
    quadEl.style.borderRadius = '8px';
    quadEl.style.padding = 'var(--spacing-md)';
    quadEl.style.display = 'flex';
    quadEl.style.flexDirection = 'column';
    quadEl.style.overflow = 'hidden';

    const header = document.createElement('div');
    header.style.borderBottom = `2px solid ${quad.color}`;
    header.style.paddingBottom = 'var(--spacing-xs)';
    header.style.marginBottom = 'var(--spacing-sm)';
    header.innerHTML = `
      <h3 style="margin: 0; color: ${quad.color}; font-size: 1rem;">${quad.title}</h3>
      <span style="font-size: 0.75rem; color: var(--foreground-muted);">${quad.sub}</span>
    `;
    quadEl.appendChild(header);

    const list = document.createElement('div');
    list.className = 'quadrant-tasks-list';
    list.style.flex = '1';
    list.style.overflowY = 'auto';
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = 'var(--spacing-xs)';

    const quadTasks = (tasks || []).filter(quad.filter);
    for (const task of quadTasks) {
      const card = document.createElement('div');
      card.className = 'matrix-task-card';
      card.setAttribute('draggable', 'true');
      card.dataset.taskId = task.id;
      card.style.background = 'var(--background)';
      card.style.border = '1px solid var(--border)';
      card.style.borderRadius = '6px';
      card.style.padding = 'var(--spacing-sm)';
      card.style.cursor = 'grab';
      card.style.fontSize = '0.85rem';
      card.textContent = task.title;

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      list.appendChild(card);
    }
    quadEl.appendChild(list);

    quadEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      quadEl.style.borderColor = quad.color;
    });

    quadEl.addEventListener('dragleave', () => {
      quadEl.style.borderColor = 'var(--border)';
    });

    quadEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      quadEl.style.borderColor = 'var(--border)';
      const taskId = e.dataTransfer.getData('text/plain');
      if (!store || !taskId) return;
      const task = store.getCached('tasks', taskId);
      if (!task) return;
      
      const updated = {
        ...task,
        priority: quad.update.priority,
        dueDate: quad.update.dueDate,
        updatedAt: Date.now()
      };
      await store.put('tasks', updated);
    });

    grid.appendChild(quadEl);
  }

  return el;
}
