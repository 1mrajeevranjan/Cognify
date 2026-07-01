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
      <div class="analytics-metrics-grid">
        <section class="metric-card">
          <div class="metric-label">Completion Rate</div>
          <div class="metric-value metric-value-accent">${rate}%</div>
          <div class="metric-caption">${completed} of ${total} tasks finished</div>
        </section>
        <section class="metric-card">
          <div class="metric-label">Focus Duration</div>
          <div class="metric-value">${totalFocusMinutes} min</div>
          <div class="metric-caption">${sessions.length} sessions logged</div>
        </section>
      </div>

      <section class="analytics-team-section">
        <div class="analytics-section-header">
          <h3>Execution Trend</h3>
          <span>${completed}/${total}</span>
        </div>
        <div class="team-progress-bars">
          <div class="progress-item">
            <div class="progress-label-row">
              <span>Total task completion</span>
              <span>${rate}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${rate}%;"></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderAnalytics();
  return el;
}
