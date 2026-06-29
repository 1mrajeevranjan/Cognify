import { EisenhowerView } from './eisenhower.js';

export function WeeklyReviewView(store) {
  const el = document.createElement('div');
  el.className = 'weekly-review-view-container';

  const h1 = document.createElement('h1');
  h1.textContent = 'Guided Weekly Review';
  el.appendChild(h1);

  const wizardContainer = document.createElement('div');
  wizardContainer.className = 'wizard-container';
  wizardContainer.style.background = 'var(--surface)';
  wizardContainer.style.border = '1px solid var(--border)';
  wizardContainer.style.borderRadius = '8px';
  wizardContainer.style.padding = 'var(--spacing-md)';
  wizardContainer.style.marginTop = 'var(--spacing-lg)';
  el.appendChild(wizardContainer);

  const steps = [
    {
      title: 'Step 1: Get to Inbox Zero',
      desc: 'Review all items in your Inbox, schedule them, assign projects, or delete them to clear your mind.',
      render: () => {
        const wrap = document.createElement('div');
        if (!store) return wrap;
        const inboxTasks = store.getAllCached('tasks').filter(t => !t.completed && !t.projectId);
        if (inboxTasks.length === 0) {
          wrap.innerHTML = '<p style="color: var(--accent); font-weight: 500;">⭐ Your Inbox is completely clear! Great job.</p>';
          return wrap;
        }
        wrap.innerHTML = `<p style="margin-bottom: var(--spacing-sm); font-size: 0.9rem;">You have ${inboxTasks.length} unorganized task(s):</p>`;
        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = 'var(--spacing-xs)';
        for (const t of inboxTasks) {
          const row = document.createElement('div');
          row.style.padding = 'var(--spacing-xs)';
          row.style.border = '1px solid var(--border)';
          row.style.borderRadius = '4px';
          row.style.background = 'var(--background)';
          row.style.fontSize = '0.85rem';
          row.textContent = t.title;
          list.appendChild(row);
        }
        wrap.appendChild(list);
        return wrap;
      }
    },
    {
      title: 'Step 2: Calibrate Priorities',
      desc: 'Organize your tasks into the Eisenhower matrix quadrants by urgency and importance.',
      render: () => {
        const wrap = document.createElement('div');
        if (!store) return wrap;
        const tasks = store.getAllCached('tasks');
        const matrix = EisenhowerView(tasks, store);
        matrix.style.height = '350px';
        wrap.appendChild(matrix);
        return wrap;
      }
    },
    {
      title: 'Step 3: Review Habit Streaks',
      desc: 'Check your habit tracker consistency and streaks to reflect on your discipline.',
      render: () => {
        const wrap = document.createElement('div');
        if (!store) return wrap;
        const habits = store.getAllCached('habits');
        if (habits.length === 0) {
          wrap.innerHTML = '<p style="color: var(--foreground-muted); font-style: italic;">No habits tracked yet.</p>';
          return wrap;
        }
        wrap.innerHTML = '<div style="display:flex; flex-direction:column; gap: var(--spacing-xs);"></div>';
        const list = wrap.firstElementChild;
        for (const h of habits) {
          const row = document.createElement('div');
          row.style.padding = 'var(--spacing-xs)';
          row.style.border = '1px solid var(--border)';
          row.style.borderRadius = '4px';
          row.style.background = 'var(--background)';
          row.style.fontSize = '0.85rem';
          row.textContent = `🔥 ${h.name} — Streak: ${h.streak || 0} days`;
          list.appendChild(row);
        }
        return wrap;
      }
    },
    {
      title: 'Step 4: Schedule Upcoming Tasks',
      desc: 'Review the next 7 days and plan out your schedules.',
      render: () => {
        const wrap = document.createElement('div');
        wrap.innerHTML = '<p style="color: var(--foreground-muted);">Review complete! Click Finish to log your weekly review milestone.</p>';
        return wrap;
      }
    }
  ];

  let currentStepIdx = 0;

  function renderStep() {
    wizardContainer.innerHTML = '';
    const step = steps[currentStepIdx];

    const title = document.createElement('h3');
    title.textContent = step.title;
    title.style.marginTop = '0';
    wizardContainer.appendChild(title);

    const desc = document.createElement('p');
    desc.style.fontSize = '0.9rem';
    desc.style.color = 'var(--foreground-muted)';
    desc.textContent = step.desc;
    wizardContainer.appendChild(desc);

    const content = step.render();
    content.style.marginTop = 'var(--spacing-md)';
    content.style.minHeight = '150px';
    wizardContainer.appendChild(content);

    const navRow = document.createElement('div');
    navRow.style.display = 'flex';
    navRow.style.justifyContent = 'space-between';
    navRow.style.marginTop = 'var(--spacing-lg)';
    navRow.style.borderTop = '1px solid var(--border)';
    navRow.style.paddingTop = 'var(--spacing-sm)';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Back';
    prevBtn.style.padding = '6px 12px';
    prevBtn.style.border = '1px solid var(--border)';
    prevBtn.style.background = 'var(--surface)';
    prevBtn.style.color = 'var(--foreground)';
    prevBtn.style.borderRadius = '4px';
    prevBtn.style.cursor = 'pointer';
    prevBtn.disabled = currentStepIdx === 0;
    prevBtn.addEventListener('click', () => {
      if (currentStepIdx > 0) {
        currentStepIdx--;
        renderStep();
      }
    });
    navRow.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.style.padding = '6px 12px';
    nextBtn.style.background = 'var(--accent)';
    nextBtn.style.color = 'white';
    nextBtn.style.border = 'none';
    nextBtn.style.borderRadius = '4px';
    nextBtn.style.cursor = 'pointer';

    if (currentStepIdx === steps.length - 1) {
      nextBtn.textContent = 'Finish Review';
      nextBtn.addEventListener('click', async () => {
        if (store) {
          await store.put('settings', { key: 'last_weekly_review', value: Date.now() });
        }
        alert('🎉 Weekly review complete! Review milestone logged.');
        window.location.hash = '#today';
      });
    } else {
      nextBtn.textContent = 'Next →';
      nextBtn.addEventListener('click', () => {
        if (currentStepIdx < steps.length - 1) {
          currentStepIdx++;
          renderStep();
        }
      });
    }
    navRow.appendChild(nextBtn);

    wizardContainer.appendChild(navRow);
  }

  renderStep();
  return el;
}
