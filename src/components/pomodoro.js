export function PomodoroWidget({ taskId = null, onComplete = null, store = null } = {}) {
  const el = document.createElement('div');
  el.className = 'pomodoro-widget';

  const TOTAL = 25 * 60; // 1500s
  const RADIUS = 54;
  const CIRC = 2 * Math.PI * RADIUS;
  let remaining = TOTAL;
  let interval = null;
  let running = false;

  el.innerHTML = `
    <svg class="pomodoro-ring" viewBox="0 0 120 120" width="120" height="120">
      <circle cx="60" cy="60" r="${RADIUS}" fill="none" stroke="var(--border)" stroke-width="8"/>
      <circle class="pomodoro-progress" cx="60" cy="60" r="${RADIUS}" fill="none" stroke="var(--accent)" stroke-width="8"
        stroke-dasharray="${CIRC}" stroke-dashoffset="0" stroke-linecap="round"
        transform="rotate(-90 60 60)"/>
      <text class="pomodoro-time" x="60" y="65" text-anchor="middle" fill="var(--foreground)"
        font-size="18" font-family="var(--font-sans)" font-weight="600">25:00</text>
    </svg>
    <div class="pomodoro-controls">
      <button class="pomodoro-start-btn">Start</button>
      <button class="pomodoro-stop-btn">Reset</button>
    </div>
  `;

  const progress = el.querySelector('.pomodoro-progress');
  const timeText = el.querySelector('.pomodoro-time');
  const startBtn = el.querySelector('.pomodoro-start-btn');
  const stopBtn = el.querySelector('.pomodoro-stop-btn');

  function updateDisplay() {
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    if (timeText) timeText.textContent = `${m}:${s}`;
    const offset = CIRC * (1 - remaining / TOTAL);
    if (progress) progress.setAttribute('stroke-dashoffset', offset);
  }

  function beep() {
    try {
      const ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* silent fail */ }
  }

  async function complete() {
    running = false;
    clearInterval(interval);
    interval = null;
    if (startBtn) startBtn.textContent = 'Start';
    beep();
    if (store && taskId) {
      await store.put('sessions', {
        id: `ses-${Date.now()}`,
        taskId,
        duration: TOTAL,
        completedAt: Date.now()
      });
    }
    if (onComplete) onComplete();
  }

  startBtn && startBtn.addEventListener('click', () => {
    if (running) {
      running = false;
      clearInterval(interval);
      interval = null;
      startBtn.textContent = 'Resume';
    } else {
      running = true;
      startBtn.textContent = 'Pause';
      interval = setInterval(() => {
        remaining--;
        updateDisplay();
        if (remaining <= 0) { remaining = 0; complete(); }
      }, 1000);
    }
  });

  stopBtn && stopBtn.addEventListener('click', () => {
    running = false;
    clearInterval(interval);
    interval = null;
    remaining = TOTAL;
    updateDisplay();
    if (startBtn) startBtn.textContent = 'Start';
  });

  updateDisplay();
  return el;
}
