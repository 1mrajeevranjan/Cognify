import { TaskList } from './item.js';

export function TodayView(tasks, projects = {}) {
  const el = document.createElement('div');
  el.classList.add('today-view-container');
  
  const heading = document.createElement('h1');
  heading.textContent = 'Today';
  el.appendChild(heading);

  const listEl = TaskList(tasks, projects);
  el.appendChild(listEl);
  
  return el;
}

export function OnboardingView() {
  const el = document.createElement('div');
  el.classList.add('onboarding-view-container');
  
  const heading = document.createElement('h1');
  heading.textContent = 'Welcome to Cognify';
  el.appendChild(heading);

  const desc = document.createElement('p');
  desc.textContent = 'Your calm, cognitive assistant.';
  el.appendChild(desc);
  
  return el;
}

export function SettingsView() {
  const el = document.createElement('div');
  el.classList.add('settings-view-container');
  
  const heading = document.createElement('h1');
  heading.textContent = 'Settings';
  el.appendChild(heading);

  return el;
}
