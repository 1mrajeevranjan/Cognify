export function HabitsView(store) {
  const el = document.createElement('div');
  el.className = 'habits-view-container';

  const h1 = document.createElement('h1');
  h1.textContent = 'Habits';
  el.appendChild(h1);

  const ICONS = ['💪', '📚', '🏃', '💧', '🧘', '🍎', '✍️', '😴'];
  let selectedIcon = ICONS[0];

  // Add habit form
  const form = document.createElement('div');
  form.className = 'add-habit-form';
  form.innerHTML = `
    <input class="habit-title-input" placeholder="New habit name..." />
    <div class="habit-icons">${ICONS.map(i => `<button class="habit-icon-btn" data-icon="${i}">${i}</button>`).join('')}</div>
    <button class="add-habit-btn">+ Add Habit</button>
  `;
  el.appendChild(form);

  form.querySelectorAll && form.querySelectorAll('.habit-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedIcon = btn.dataset.icon;
      form.querySelectorAll('.habit-icon-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  const firstIconBtn = form.querySelector && form.querySelector('.habit-icon-btn');
  if (firstIconBtn) firstIconBtn.classList.add('selected');

  const addBtn = form.querySelector && form.querySelector('.add-habit-btn');
  addBtn && addBtn.addEventListener('click', async () => {
    const titleInput = form.querySelector('.habit-title-input');
    const title = titleInput ? titleInput.value.trim() : '';
    if (!title || !store) return;
    await store.put('habits', {
      id: `h-${Date.now()}`,
      title,
      icon: selectedIcon,
      frequency: 'daily',
      createdAt: Date.now()
    });
    if (titleInput) titleInput.value = '';
    renderHabits();
  });

  const listEl = document.createElement('div');
  listEl.className = 'habits-list';
  el.appendChild(listEl);

  function calcStreak(habitId, logs) {
    const dates = logs
      .filter(l => l.habitId === habitId)
      .map(l => l.loggedDate)
      .sort()
      .reverse();
    let streak = 0;
    const base = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(base);
      expected.setDate(expected.getDate() - i);
      if (dates[i] === expected.toISOString().split('T')[0]) streak++;
      else break;
    }
    return streak;
  }

  function renderHabits() {
    if (!store) return;
    const habits = store.getAllCached('habits');
    const logs = store.getAllCached('habitLogs');
    const todayStr = new Date().toISOString().split('T')[0];
    listEl.innerHTML = '';

    if (habits.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state-text';
      empty.textContent = 'No habits yet. Add one above.';
      listEl.appendChild(empty);
      return;
    }

    for (const habit of habits) {
      const loggedToday = logs.some(l => l.habitId === habit.id && l.loggedDate === todayStr);
      const streak = calcStreak(habit.id, logs);
      const row = document.createElement('div');
      row.className = 'habit-row';
      row.innerHTML = `
        <span class="habit-icon">${habit.icon}</span>
        <span class="habit-title-text">${habit.title}</span>
        <span class="habit-streak">🔥 ${streak}</span>
        <button class="habit-check-btn ${loggedToday ? 'checked' : ''}" data-id="${habit.id}">${loggedToday ? '✓' : '○'}</button>
      `;
      const checkBtn = row.querySelector('.habit-check-btn');
      checkBtn && checkBtn.addEventListener('click', async () => {
        if (!loggedToday && store) {
          await store.put('habitLogs', {
            id: `hl-${Date.now()}`,
            habitId: habit.id,
            loggedDate: todayStr,
            createdAt: Date.now()
          });
          renderHabits();
        }
      });
      listEl.appendChild(row);
    }
  }

  renderHabits();
  return el;
}
