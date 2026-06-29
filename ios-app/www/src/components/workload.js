export function WorkloadView(store) {
  const el = document.createElement('div');
  el.className = 'workload-view-container';

  const h1 = document.createElement('h1');
  h1.textContent = 'Team Workload';
  el.appendChild(h1);

  const container = document.createElement('div');
  container.className = 'workload-columns';
  container.style.display = 'flex';
  container.style.gap = 'var(--spacing-md)';
  container.style.marginTop = 'var(--spacing-lg)';
  el.appendChild(container);

  function renderWorkload() {
    if (!store) return;
    const tasks = store.getAllCached('tasks').filter(t => !t.completed);
    const members = store.getAllCached('workspace_members');
    container.innerHTML = '';

    // Group tasks by assignee email
    const workloadMap = new Map();
    // Default group for Unassigned
    workloadMap.set('Unassigned', []);

    for (const m of members) {
      workloadMap.set(m.email, []);
    }

    for (const task of tasks) {
      const email = task.assigneeEmail || 'Unassigned';
      if (!workloadMap.has(email)) {
        workloadMap.set(email, []);
      }
      workloadMap.get(email).push(task);
    }

    for (const [email, userTasks] of workloadMap.entries()) {
      const col = document.createElement('div');
      col.className = 'workload-column';
      col.style.flex = '1';
      col.style.minWidth = '250px';
      col.style.background = 'var(--surface)';
      col.style.border = '1px solid var(--border)';
      col.style.borderRadius = '8px';
      col.style.padding = 'var(--spacing-md)';

      const overdueCount = userTasks.filter(t => {
        if (!t.dueDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return t.dueDate < today;
      }).length;

      col.innerHTML = `
        <h3 class="workload-assignee-header" style="margin-top: 0; display: flex; justify-content: space-between; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: var(--spacing-xs);">
          <span>${email.split('@')[0]}</span>
          <span style="color: var(--foreground-muted); font-weight: normal;">${userTasks.length} open</span>
        </h3>
        ${overdueCount > 0 ? `<div style="color: hsl(0, 80%, 50%); font-size: 0.8rem; margin-bottom: var(--spacing-xs); font-weight: 500;">⚠️ ${overdueCount} Overdue</div>` : ''}
        <div class="workload-tasks-list" style="display: flex; flex-direction: column; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
          ${userTasks.map(t => `
            <div class="workload-task-card" style="padding: var(--spacing-sm); background: var(--background); border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem;">
              <div style="font-weight: 500;">${t.title}</div>
              ${t.dueDate ? `<div style="color: var(--foreground-muted); font-size: 0.75rem; margin-top: 2px;">📅 ${t.dueDate}</div>` : ''}
            </div>
          `).join('') || '<p style="color: var(--foreground-muted); font-size: 0.85rem; font-style: italic;">No active tasks</p>'}
        </div>
      `;
      container.appendChild(col);
    }
  }

  renderWorkload();
  return el;
}
