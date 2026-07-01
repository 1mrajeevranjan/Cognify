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
    <input class="workspace-name-input" placeholder="New workspace name" />
    <button class="add-workspace-btn">Create Team</button>
  `;
  el.appendChild(createForm);

  const listEl = document.createElement('div');
  listEl.className = 'workspaces-list';
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
      
      const wMembers = members.filter(m => m.workspaceId === w.id);

      card.innerHTML = `
        <div class="workspace-card-header">
          <h3 class="workspace-title">${w.name}</h3>
          <span class="workspace-member-count">${wMembers.length || 1} member${wMembers.length === 1 ? '' : 's'}</span>
        </div>
        <div class="workspace-invitation-row">
          <input class="invite-email-input" type="email" placeholder="Invite by email" />
          <button class="invite-btn">Invite</button>
        </div>
        <div class="workspace-members-list">
          <strong>Members</strong>
          <ul>
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
