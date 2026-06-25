import { parseNaturalLanguage } from '../utils.js';

export function QuickEntry(callbacks = {}) {
  const overlay = document.createElement('div');
  overlay.classList.add('quick-entry-overlay');

  const container = document.createElement('div');
  container.classList.add('quick-entry-container');
  overlay.appendChild(container);

  const input = document.createElement('input');
  input.classList.add('quick-entry-input');
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', 'Task title, today #work !p1...');
  container.appendChild(input);

  const preview = document.createElement('div');
  preview.classList.add('quick-entry-preview');
  container.appendChild(preview);

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
  };

  input.addEventListener('input', updatePreview);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.preventDefault) e.preventDefault();
      const val = input.value.trim();
      if (val) {
        const parsed = parseNaturalLanguage(val);
        if (callbacks.onSave) {
          callbacks.onSave(parsed);
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
