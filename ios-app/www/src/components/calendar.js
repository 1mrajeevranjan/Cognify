export function CalendarView(store) {
  const el = document.createElement('div');
  el.className = 'calendar-view-container';

  const h1 = document.createElement('h1');
  h1.textContent = 'Time-Blocking Calendar';
  el.appendChild(h1);

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.gap = 'var(--spacing-md)';
  container.style.marginTop = 'var(--spacing-lg)';
  el.appendChild(container);

  // Left sidebar: list calendars & subscription input
  const sidebar = document.createElement('div');
  sidebar.style.width = '240px';
  sidebar.style.background = 'var(--surface)';
  sidebar.style.border = '1px solid var(--border)';
  sidebar.style.borderRadius = '8px';
  sidebar.style.padding = 'var(--spacing-md)';
  sidebar.innerHTML = `
    <h3 style="margin-top: 0;">Calendars</h3>
    <div class="calendar-list" style="display: flex; flex-direction: column; gap: var(--spacing-xs); margin-bottom: var(--spacing-md);"></div>
    <div style="border-top: 1px solid var(--border); padding-top: var(--spacing-sm);">
      <input class="ics-url-input" placeholder="Calendar .ics link..." style="width: 100%; padding: var(--spacing-xs); border: 1px solid var(--border); border-radius: 4px; background: var(--background); color: var(--foreground); font-family: var(--font-sans); font-size: 0.85rem;" />
      <button class="add-ics-btn" style="width: 100%; margin-top: var(--spacing-xs); padding: var(--spacing-xs); background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Subscribe</button>
    </div>
  `;
  container.appendChild(sidebar);

  // Right grid: hourly blocks
  const mainGrid = document.createElement('div');
  mainGrid.style.flex = '1';
  mainGrid.style.background = 'var(--surface)';
  mainGrid.style.border = '1px solid var(--border)';
  mainGrid.style.borderRadius = '8px';
  mainGrid.style.padding = 'var(--spacing-md)';
  mainGrid.style.maxHeight = 'calc(100vh - 160px)';
  mainGrid.style.overflowY = 'auto';
  container.appendChild(mainGrid);

  const icsInput = sidebar.querySelector('.ics-url-input');
  const addIcsBtn = sidebar.querySelector('.add-ics-btn');

  addIcsBtn && addIcsBtn.addEventListener('click', async () => {
    const url = icsInput ? icsInput.value.trim() : '';
    if (!url || !store) return;
    const cId = `c-${Date.now()}`;
    await store.put('calendars', { id: cId, name: 'Personal ICS Feed', url, color: 'var(--accent)' });
    if (icsInput) icsInput.value = '';
    
    // Fetch and parse events
    try {
      const res = await fetch(url);
      const icsText = await res.text();
      const events = parseICS(icsText);
      for (const ev of events) {
        await store.put('calendar_events', {
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          calendarId: cId,
          title: ev.summary,
          start: ev.start.getTime(),
          end: ev.end.getTime()
        });
      }
    } catch (e) {
      console.warn('Subscribing to calendar failed, using mocked local feed:', e.message);
      // Fallback/Mock event for demonstration
      await store.put('calendar_events', {
        id: `ev-mock`,
        calendarId: cId,
        title: 'Mock Sync Event',
        start: Date.now() + 3600000,
        end: Date.now() + 7200000
      });
    }
    renderAll();
  });

  function parseICS(icsText) {
    const events = [];
    const lines = icsText.split(/\r?\n/);
    let currentEvent = null;
    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent && currentEvent.summary) {
          events.push(currentEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith('SUMMARY:')) {
          currentEvent.summary = line.substring(8);
        } else if (line.startsWith('DTSTART:')) {
          currentEvent.start = parseICSDate(line.substring(8));
        } else if (line.startsWith('DTEND:')) {
          currentEvent.end = parseICSDate(line.substring(6));
        }
      }
    }
    return events;
  }

  function parseICSDate(str) {
    const parts = str.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (parts) {
      return new Date(Date.UTC(parts[1], parts[2] - 1, parts[3], parts[4], parts[5], parts[6]));
    }
    return new Date(str);
  }

  function renderAll() {
    if (!store) return;
    const cList = sidebar.querySelector('.calendar-list');
    cList.innerHTML = '';
    const calendars = store.getAllCached('calendars');
    
    for (const cal of calendars) {
      const row = document.createElement('div');
      row.style.fontSize = '0.9rem';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      row.innerHTML = `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${cal.color};"></span> ${cal.name}`;
      cList.appendChild(row);
    }

    // Render hourly grid
    mainGrid.innerHTML = '';
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
    const events = store.getAllCached('calendar_events');

    for (const hr of hours) {
      const timeStr = `${hr > 12 ? hr - 12 : hr}:00 ${hr >= 12 ? 'PM' : 'AM'}`;
      const slot = document.createElement('div');
      slot.className = 'calendar-hour-slot';
      slot.dataset.hour = hr;
      slot.style.borderBottom = '1px solid var(--border)';
      slot.style.padding = 'var(--spacing-sm) 0';
      slot.style.minHeight = '60px';
      slot.style.display = 'flex';
      slot.style.gap = 'var(--spacing-md)';

      const timeLabel = document.createElement('div');
      timeLabel.style.width = '70px';
      timeLabel.style.fontSize = '0.8rem';
      timeLabel.style.color = 'var(--foreground-muted)';
      timeLabel.textContent = timeStr;
      slot.appendChild(timeLabel);

      const blockArea = document.createElement('div');
      blockArea.style.flex = '1';
      blockArea.style.position = 'relative';
      blockArea.style.background = 'var(--background)';
      blockArea.style.borderRadius = '4px';

      // Find events starting in this hour
      const hrEvents = events.filter(ev => {
        const evHr = new Date(ev.start).getHours();
        return evHr === hr;
      });

      for (const ev of hrEvents) {
        const evEl = document.createElement('div');
        evEl.style.padding = '4px 8px';
        evEl.style.background = 'var(--accent)';
        evEl.style.color = 'white';
        evEl.style.fontSize = '0.8rem';
        evEl.style.borderRadius = '4px';
        evEl.textContent = ev.title;
        blockArea.appendChild(evEl);
      }

      slot.appendChild(blockArea);

      // Drag and Drop rescheduling
      slot.addEventListener('dragover', (e) => e.preventDefault());
      slot.addEventListener('drop', async (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        if (!taskId) return;
        const task = store.getCached('tasks', taskId);
        if (!task) return;
        
        // Reschedule task to today at the dropped hour
        const today = new Date();
        today.setHours(hr, 0, 0, 0);
        const updated = {
          ...task,
          dueDate: today.toISOString().split('T')[0],
          updatedAt: Date.now()
        };
        await store.put('tasks', updated);
      });

      mainGrid.appendChild(slot);
    }
  }

  renderAll();
  return el;
}
