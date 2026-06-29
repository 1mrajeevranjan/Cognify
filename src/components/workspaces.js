import { supabase } from '../supabase.js';

export function WorkspacesView(store) {
  const el = document.createElement('div');
  el.className = 'workspaces-view-container';

  const h1 = document.createElement('h1');
  h1.textContent = 'Team Workspaces';
  el.appendChild(h1);

  // Form to create workspace
  const createForm = document.createElement('div');
  createForm.className = 'add-workspace-form';
  createForm.innerHTML = `
    <input class="workspace-name-input" placeholder="New Workspace Name..." style="padding: var(--spacing-sm); border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--foreground); font-family: var(--font-sans);" />
    <button class="add-workspace-btn" style="padding: var(--spacing-sm) var(--spacing-md); background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-family: var(--font-sans); font-weight: 500;">+ Create Team</button>
  `;
  el.appendChild(createForm);

  const listEl = document.createElement('div');
  listEl.className = 'workspaces-list';
  listEl.style.marginTop = 'var(--spacing-lg)';
  el.appendChild(listEl);

  const addBtn = createForm.querySelector('.add-workspace-btn');
  addBtn && addBtn.addEventListener('click', async () => {
    const input = createForm.querySelector('.workspace-name-input');
    const name = input ? input.value.trim() : '';
    if (!name || !store) return;
    const wId = `w-${Date.now()}`;
    await store.put('workspaces', {
      id: wId,
      name,
      createdAt: Date.now()
    });
    if (input) input.value = '';
    renderWorkspaces();
  });

  async function inviteMember(workspaceId, email) {
    if (!email || !store) return;
    const mId = `m-${Date.now()}`;
    await store.put('workspace_members', {
      id: mId,
      workspaceId,
      email,
      role: 'pending',
      joinedAt: Date.now()
    });
    renderWorkspaces();
  }

  function renderWorkspaces() {
    if (!store) return;
    const list = store.getAllCached('workspaces');
    const members = store.getAllCached('workspace_members');
    listEl.innerHTML = '';

    if (list.length === 0) {
      listEl.innerHTML = '<p class="empty-state-text">No workspaces created yet. Create one above to collaborate.</p>';
      return;
    }

    for (const w of list) {
      const card = document.createElement('div');
      card.className = 'workspace-card';
      card.style.border = '1px solid var(--border)';
      card.style.borderRadius = '8px';
      card.style.background = 'var(--surface)';
      card.style.padding = 'var(--spacing-md)';
      card.style.marginBottom = 'var(--spacing-md)';
      
      const wMembers = members.filter(m => m.workspaceId === w.id);

      card.innerHTML = `
        <h3 class="workspace-title" style="margin-top: 0;">${w.name}</h3>
        <div class="workspace-invitation-row" style="display: flex; gap: var(--spacing-xs); margin-bottom: var(--spacing-sm);">
          <input class="invite-email-input" type="email" placeholder="Invite by email..." style="flex: 1; padding: var(--spacing-xs); border: 1px solid var(--border); border-radius: 4px; background: var(--background); color: var(--foreground); font-family: var(--font-sans);" />
          <button class="invite-btn" style="padding: var(--spacing-xs) var(--spacing-sm); background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-family: var(--font-sans);">Invite</button>
        </div>
        <div class="workspace-members-list" style="font-size: 0.9rem; color: var(--foreground-muted);">
          <strong>Members:</strong>
          <ul style="padding-left: var(--spacing-md); margin-top: 4px;">
            ${wMembers.map(m => `<li>${m.email} (${m.role})</li>`).join('') || '<li>Only you</li>'}
          </ul>
        </div>
      `;

      const inviteBtn = card.querySelector('.invite-btn');
      inviteBtn && inviteBtn.addEventListener('click', () => {
        const input = card.querySelector('.invite-email-input');
        const email = input ? input.value.trim() : '';
        if (email) inviteMember(w.id, email);
      });

      listEl.appendChild(card);
    }
  }

  renderWorkspaces();
  return el;
}
