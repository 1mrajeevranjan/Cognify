import { casual } from '../lib/chrono.js';

export function parseNaturalLanguage(text) {
  let cleanedText = text || '';
  let tags = [];
  let priority = null;
  let dueDate = null;

  // 1. Extract tags: #tag
  const tagRegex = /#(\w+)/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(cleanedText)) !== null) {
    tags.push(tagMatch[1]);
  }
  cleanedText = cleanedText.replace(tagRegex, '');

  // 2. Extract priority: !p1, !p2, !p3
  const priorityRegex = /!p([1-3])/i;
  const priorityMatch = priorityRegex.exec(cleanedText);
  if (priorityMatch) {
    priority = `P${priorityMatch[1]}`;
    cleanedText = cleanedText.replace(priorityRegex, '');
  }

  // 3. Extract relative dates using chrono
  const dateResults = casual.parse(cleanedText);
  if (dateResults && dateResults.length > 0) {
    const firstResult = dateResults[0];
    const dateObj = firstResult.start.date();
    // Format to YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    dueDate = `${year}-${month}-${day}`;
    
    // Remove the parsed date text from the title
    cleanedText = cleanedText.replace(firstResult.text, '');
  }

  // 4. Clean up title: trim and replace multiple spaces
  const title = cleanedText
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title,
    dueDate,
    tags,
    priority
  };
}

export class Notifier {
  constructor(store) {
    this.store = store;
    this.checkInterval = null;
    this.audioContext = null;
    this.notifiedTaskIds = new Set();
  }

  async requestPermission() {
    if (!('Notification' in globalThis)) return 'denied';
    if (globalThis.Notification.permission === 'default') {
      return await globalThis.Notification.requestPermission();
    }
    return globalThis.Notification.permission;
  }

  startChecking(intervalMs = 1000) {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, intervalMs);
  }

  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  checkReminders() {
    const tasks = this.store.getAllCached('tasks');
    const now = Date.now();

    for (const task of tasks) {
      if (task.completed) continue;
      if (task.reminderTimestamp && task.reminderTimestamp <= now) {
        if (!this.notifiedTaskIds.has(task.id)) {
          this.notifiedTaskIds.add(task.id);
          this.triggerAlert(task);
        }
      }
    }
  }

  triggerAlert(task) {
    if ('Notification' in globalThis && globalThis.Notification.permission === 'granted') {
      new globalThis.Notification('Cognify Reminder', {
        body: task.title,
        icon: 'icon.png'
      });
    }
    this.playAudioAlert();
  }

  playAudioAlert() {
    try {
      const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      const ctx = this.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.error('Audio alert failed:', e);
    }
  }
}
