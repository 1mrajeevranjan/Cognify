import { parseNaturalLanguage, VoiceCapture } from '../utils.js';
import { breakdownTask } from '../ai.js';

export function QuickEntry(callbacks = {}, store = null) {
  const overlay = document.createElement('div');
  overlay.classList.add('quick-entry-overlay');

  const container = document.createElement('div');
  container.classList.add('quick-entry-container');
  overlay.appendChild(container);

  const inputRow = document.createElement('div');
  inputRow.className = 'quick-entry-input-row';
  inputRow.style.display = 'flex';
  inputRow.style.gap = 'var(--spacing-sm)';
  inputRow.style.alignItems = 'center';
  container.appendChild(inputRow);

  const input = document.createElement('input');
  input.classList.add('quick-entry-input');
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', 'Task title, today #work !p1...');
  input.style.flex = '1';
  inputRow.appendChild(input);

  const micBtn = document.createElement('button');
  micBtn.className = 'mic-btn';
  micBtn.textContent = '🎤';
  micBtn.title = 'Speak task';
  inputRow.appendChild(micBtn);

  const breakdownBtn = document.createElement('button');
  breakdownBtn.className = 'breakdown-btn';
  breakdownBtn.textContent = '✨';
  breakdownBtn.title = 'AI Task Breakdown';
  inputRow.appendChild(breakdownBtn);

  const preview = document.createElement('div');
  preview.classList.add('quick-entry-preview');
  container.appendChild(preview);

  let breakdownItems = [];

  const updatePreview = () => {
    preview.innerHTML = '';
    const val = input.value.trim();
    if (!val) return;

    const parsed = parseNaturalLanguage(val);

    if (parsed.dueDate) {
      const chip = document.createElement('span');
      chip.classList.add('preview-chip', 'chip-date');
      chip.textContent = parsed.dueDate;
      preview.appendChild(chip);
    }

    if (parsed.priority) {
      const chip = document.createElement('span');
      chip.classList.add('preview-chip', 'chip-priority');
      chip.textContent = parsed.priority;
      preview.appendChild(chip);
    }

    if (parsed.tags && parsed.tags.length > 0) {
      for (const tag of parsed.tags) {
        const chip = document.createElement('span');
        chip.classList.add('preview-chip', 'chip-tag');
        chip.textContent = `#${tag}`;
        preview.appendChild(chip);
      }
    }

    if (breakdownItems && breakdownItems.length > 0) {
      const bdContainer = document.createElement('div');
      bdContainer.className = 'preview-breakdown-container';
      bdContainer.style.marginTop = 'var(--spacing-xs)';
      bdContainer.style.fontSize = '0.85rem';
      bdContainer.style.color = 'var(--foreground-muted)';
      bdContainer.innerHTML = '<strong>Subtasks:</strong>';
      const ul = document.createElement('ul');
      ul.style.paddingLeft = 'var(--spacing-md)';
      for (const item of breakdownItems) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      }
      bdContainer.appendChild(ul);
      preview.appendChild(bdContainer);
    }
  };

  input.addEventListener('input', updatePreview);

  micBtn.addEventListener('click', async () => {
    const vc = new VoiceCapture();
    micBtn.classList.add('recording');
    try {
      const transcript = await vc.start();
      input.value = transcript;
      micBtn.classList.remove('recording');
      input.dispatchEvent(new Event('input'));
    } catch (err) {
      micBtn.classList.remove('recording');
      if (err.message === 'not-supported') {
        micBtn.title = 'Voice not supported in this browser';
      }
    }
  });

  breakdownBtn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val) return;
    const parsed = parseNaturalLanguage(val);
    const apiKey = store ? (store.getCached('settings', 'gemini-api-key')?.value || '') : '';
    
    // Show loading
    const loadingText = document.createElement('span');
    loadingText.className = 'preview-chip';
    loadingText.textContent = 'Thinking...';
    preview.appendChild(loadingText);
    
    try {
      const items = await breakdownTask(parsed.title, apiKey);
      if (items && items.length > 0) {
        breakdownItems = items;
      }
      updatePreview();
    } catch {
      updatePreview();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.preventDefault) e.preventDefault();
      const val = input.value.trim();
      if (val) {
        const parsed = parseNaturalLanguage(val);
        if (callbacks.onSave) {
          callbacks.onSave({
            ...parsed,
            checklistItems: breakdownItems.map((title, idx) => ({
              id: `bd-${Date.now()}-${idx}`,
              title,
              completed: false
            }))
          });
        }
        // Self dismiss if attached to DOM
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }
    } else if (e.key === 'Escape') {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  // Clicking overlay background dismisses it
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  return overlay;
}
