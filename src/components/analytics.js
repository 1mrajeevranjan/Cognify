export function AnalyticsView(store) {
  const el = document.createElement('div');
  el.className = 'analytics-view-container';

  const h1 = document.createElement('h1');
  h1.textContent = 'Team Productivity Analytics';
  el.appendChild(h1);

  const dashboard = document.createElement('div');
  dashboard.className = 'analytics-dashboard';
  dashboard.style.marginTop = 'var(--spacing-lg)';
  el.appendChild(dashboard);

  function renderAnalytics() {
    if (!store) return;
    const tasks = store.getAllCached('tasks');
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const sessions = store.getAllCached('sessions');
    const totalFocusMinutes = sessions.reduce((acc, s) => acc + Math.round((s.duration || 0) / 60), 0);

    dashboard.innerHTML = `
      <div class="analytics-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
        <div class="metric-card" style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: var(--spacing-md); text-align: center;">
          <div style="font-size: 0.85rem; color: var(--foreground-muted); text-transform: uppercase;">Completion Rate</div>
          <div style="font-size: 2.2rem; font-weight: 700; margin-top: 4px; color: var(--accent);">${rate}%</div>
          <div style="font-size: 0.8rem; color: var(--foreground-muted); margin-top: 4px;">${completed} of ${total} tasks</div>
        </div>
        <div class="metric-card" style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: var(--spacing-md); text-align: center;">
          <div style="font-size: 0.85rem; color: var(--foreground-muted); text-transform: uppercase;">Focus Duration</div>
          <div style="font-size: 2.2rem; font-weight: 700; margin-top: 4px; color: var(--foreground);">${totalFocusMinutes} min</div>
          <div style="font-size: 0.8rem; color: var(--foreground-muted); margin-top: 4px;">${sessions.length} sessions logged</div>
        </div>
      </div>

      <div class="analytics-team-section" style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: var(--spacing-md);">
        <h3 style="margin-top: 0; border-bottom: 1px solid var(--border); padding-bottom: var(--spacing-xs);">Task Share breakdown</h3>
        <div class="team-progress-bars" style="display: flex; flex-direction: column; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
          <div class="progress-item">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <span>Total Project Tasks Progress</span>
              <span>${completed}/${total}</span>
            </div>
            <div style="height: 8px; background: var(--background); border-radius: 4px; overflow: hidden; border: 1px solid var(--border);">
              <div style="height: 100%; width: ${rate}%; background: var(--accent); transition: width 0.3s;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderAnalytics();
  return el;
}
