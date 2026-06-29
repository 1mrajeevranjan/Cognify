import { supabase } from './supabase.js';

export class TaskStore {
  constructor() {
    this.db = null;
    this.dbName = 'CognifyDB';
    this.dbVersion = 5;
    
    // In-memory caches for synchronous reads
    this.caches = {
      tasks: new Map(),
      projects: new Map(),
      areas: new Map(),
      settings: new Map(),
      sessions: new Map(),
      habits: new Map(),
      habitLogs: new Map(),
      workspaces: new Map(),
      workspace_members: new Map(),
      task_comments: new Map(),
      calendars: new Map(),
      calendar_events: new Map()
    };
    
    // Subscriber callbacks per store
    this.subscribers = {
      tasks: new Set(),
      projects: new Set(),
      areas: new Set(),
      settings: new Set(),
      sessions: new Set(),
      habits: new Set(),
      habitLogs: new Set(),
      workspaces: new Set(),
      workspace_members: new Set(),
      task_comments: new Set(),
      calendars: new Set(),
      calendar_events: new Set()
    };
  }

  // Initialize DB and load caches
  init() {
    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('areas')) {
          db.createObjectStore('areas', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('habits')) {
          db.createObjectStore('habits', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('habitLogs')) {
          db.createObjectStore('habitLogs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workspaces')) {
          db.createObjectStore('workspaces', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workspace_members')) {
          db.createObjectStore('workspace_members', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('task_comments')) {
          db.createObjectStore('task_comments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('calendars')) {
          db.createObjectStore('calendars', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('calendar_events')) {
          db.createObjectStore('calendar_events', { keyPath: 'id' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        try {
          // Warm up in-memory caches
          await this._warmCache('tasks');
          await this._warmCache('projects');
          await this._warmCache('areas');
          await this._warmCache('settings');
          await this._warmCache('sessions');
          await this._warmCache('habits');
          await this._warmCache('habitLogs');
          await this._warmCache('workspaces');
          await this._warmCache('workspace_members');
          await this._warmCache('task_comments');
          await this._warmCache('calendars');
          await this._warmCache('calendar_events');
          
          this.setupRealtime();
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Warm up a single cache from DB
  _warmCache(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = req.result || [];
        const cache = this.caches[storeName];
        cache.clear();
        for (const item of list) {
          cache.set(item.id || item.key, item);
        }
        resolve();
      };
      
      req.onerror = () => reject(req.error);
    });
  }

  // Async get from DB
  get(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Async get all from DB
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Async put to DB + Cache + Sub notification
  put(storeName, data) {
    const id = data.id || data.key;
    
    // Check if task is completed to trigger webhook
    if (storeName === 'tasks') {
      const oldTask = this.getCached('tasks', id);
      if (data.completed && (!oldTask || !oldTask.completed)) {
        this._triggerWebhooks(data);
      }
    }

    // Update cache synchronously
    this.caches[storeName].set(id, data);
    this._notify(storeName);

    this._syncUpSingle(storeName, data);

    // Save to IndexedDB asynchronously
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Async delete from DB + Cache + Sub notification
  delete(storeName, id) {
    // Update cache synchronously
    this.caches[storeName].delete(id);
    this._notify(storeName);

    this._syncDeleteSingle(storeName, id);

    // Delete from IndexedDB asynchronously
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Synchronous reads from in-memory cache
  getCached(storeName, id) {
    return this.caches[storeName].get(id);
  }

  getAllCached(storeName) {
    return Array.from(this.caches[storeName].values());
  }

  // Subscriptions
  subscribe(storeName, callback) {
    this.subscribers[storeName].add(callback);
    // Initial callback invocation
    callback(this.getAllCached(storeName));
    
    // Return unsubscribe function
    return () => this.subscribers[storeName].delete(callback);
  }

  // Notify subscribers with cached list
  _notify(storeName) {
    const list = this.getAllCached(storeName);
    for (const callback of this.subscribers[storeName]) {
      try {
        callback(list);
      } catch (err) {
        console.error('Subscription error:', err);
      }
    }
  }

  // Supabase sync Up
  async _syncUpSingle(storeName, data) {
    if (!supabase) return;
    try {
      const sessionRes = await supabase.auth.getSession();
      const user = sessionRes?.data?.session?.user;
      if (!user) return;

      if (storeName === 'tasks') {
        await supabase.from('tasks').upsert({
          id: data.id,
          user_id: user.id,
          project_id: data.projectId || null,
          title: data.title,
          notes: data.notes || null,
          completed: !!data.completed,
          due_date: data.dueDate || null,
          start_date: data.startDate || null,
          priority: data.priority || null,
          assignee_id: data.assigneeId || null,
          assignee_email: data.assigneeEmail || null,
          checklist_items: data.checklistItems || [],
          tags: data.tags || []
        });
      } else if (storeName === 'projects') {
        await supabase.from('projects').upsert({
          id: data.id,
          user_id: user.id,
          workspace_id: data.workspaceId || null,
          name: data.name,
          area_id: data.areaId || null,
          status: data.status || 'active'
        });
      } else if (storeName === 'areas') {
        await supabase.from('areas').upsert({
          id: data.id,
          user_id: user.id,
          name: data.name,
          icon: data.icon
        });
      } else if (storeName === 'workspaces') {
        await supabase.from('workspaces').upsert({
          id: data.id,
          name: data.name,
          owner_id: user.id
        });
      } else if (storeName === 'task_comments') {
        await supabase.from('task_comments').upsert({
          id: data.id,
          task_id: data.taskId,
          user_id: user.id,
          user_email: user.email || 'Anonymous',
          content: data.content
        });
      }
    } catch (err) {
      console.warn('Sync up failed:', err.message);
    }
  }

  // Supabase sync delete
  async _syncDeleteSingle(storeName, id) {
    if (!supabase) return;
    try {
      const sessionRes = await supabase.auth.getSession();
      const user = sessionRes?.data?.session?.user;
      if (!user) return;

      if (['tasks', 'projects', 'areas', 'workspaces', 'task_comments'].includes(storeName)) {
        await supabase.from(storeName).delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Sync delete failed:', err.message);
    }
  }

  // Pull all data from Supabase
  async syncDownAll() {
    if (!supabase) return;
    try {
      const sessionRes = await supabase.auth.getSession();
      const user = sessionRes?.data?.session?.user;
      if (!user) return;

      // Pull areas
      const { data: areas } = await supabase.from('areas').select('*');
      if (areas) {
        for (const a of areas) {
          await this._putLocal('areas', { id: a.id, name: a.name, icon: a.icon, createdAt: new Date(a.created_at).getTime() });
        }
      }

      // Pull projects
      const { data: projects } = await supabase.from('projects').select('*');
      if (projects) {
        for (const p of projects) {
          await this._putLocal('projects', { id: p.id, name: p.name, workspaceId: p.workspace_id, areaId: p.area_id, status: p.status, createdAt: new Date(p.created_at).getTime() });
        }
      }

      // Pull tasks
      const { data: tasks } = await supabase.from('tasks').select('*');
      if (tasks) {
        for (const t of tasks) {
          await this._putLocal('tasks', {
            id: t.id,
            projectId: t.project_id,
            title: t.title,
            notes: t.notes,
            completed: t.completed,
            dueDate: t.due_date,
            startDate: t.start_date,
            priority: t.priority,
            assigneeId: t.assignee_id,
            assigneeEmail: t.assignee_email,
            checklistItems: t.checklist_items || [],
            tags: t.tags || [],
            createdAt: new Date(t.created_at).getTime(),
            updatedAt: new Date(t.updated_at).getTime()
          });
        }
      }

      // Pull workspaces
      const { data: workspaces } = await supabase.from('workspaces').select('*');
      if (workspaces) {
        for (const w of workspaces) {
          await this._putLocal('workspaces', { id: w.id, name: w.name, ownerId: w.owner_id, createdAt: new Date(w.created_at).getTime() });
        }
      }

      // Pull workspace members
      const { data: members } = await supabase.from('workspace_members').select('*');
      if (members) {
        for (const m of members) {
          await this._putLocal('workspace_members', { id: m.id, workspaceId: m.workspace_id, userId: m.user_id, email: m.email, role: m.role, joinedAt: new Date(m.joined_at).getTime() });
        }
      }

      // Pull comments
      const { data: comments } = await supabase.from('task_comments').select('*');
      if (comments) {
        for (const c of comments) {
          await this._putLocal('task_comments', { id: c.id, taskId: c.task_id, userId: c.user_id, userEmail: c.user_email, content: c.content, createdAt: new Date(c.created_at).getTime() });
        }
      }
    } catch (err) {
      console.warn('Sync down failed:', err.message);
    }
  }

  // Helper to write purely locally (without triggering sync up loops)
  async _putLocal(storeName, data) {
    const id = data.id || data.key;
    this.caches[storeName].set(id, data);
    this._notify(storeName);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Setup real-time listeners
  setupRealtime() {
    if (!supabase) return;
    try {
      supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
          this._handleRemoteChange('tasks', payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
          this._handleRemoteChange('projects', payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, payload => {
          this._handleRemoteChange('task_comments', payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members' }, payload => {
          this._handleRemoteChange('workspace_members', payload);
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase real-time setup failed:', err.message);
    }
  }

  async _handleRemoteChange(storeName, payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'DELETE') {
      this.caches[storeName].delete(oldRecord.id);
      this._notify(storeName);
      const tx = this.db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(oldRecord.id);
    } else {
      let localRecord = {};
      if (storeName === 'tasks') {
        localRecord = {
          id: newRecord.id,
          projectId: newRecord.project_id,
          title: newRecord.title,
          notes: newRecord.notes,
          completed: newRecord.completed,
          dueDate: newRecord.due_date,
          startDate: newRecord.start_date,
          priority: newRecord.priority,
          assigneeId: newRecord.assignee_id,
          assigneeEmail: newRecord.assignee_email,
          checklistItems: newRecord.checklist_items || [],
          tags: newRecord.tags || [],
          createdAt: new Date(newRecord.created_at).getTime(),
          updatedAt: new Date(newRecord.updated_at).getTime()
        };
      } else if (storeName === 'projects') {
        localRecord = {
          id: newRecord.id,
          name: newRecord.name,
          workspaceId: newRecord.workspace_id,
          areaId: newRecord.area_id,
          status: newRecord.status,
          createdAt: new Date(newRecord.created_at).getTime()
        };
      } else if (storeName === 'task_comments') {
        localRecord = {
          id: newRecord.id,
          taskId: newRecord.task_id,
          userId: newRecord.user_id,
          userEmail: newRecord.user_email,
          content: newRecord.content,
          createdAt: new Date(newRecord.created_at).getTime()
        };
      } else if (storeName === 'workspace_members') {
        localRecord = {
          id: newRecord.id,
          workspaceId: newRecord.workspace_id,
          userId: newRecord.user_id,
          email: newRecord.email,
          role: newRecord.role,
          joinedAt: new Date(newRecord.joined_at).getTime()
        };
      }
      await this._putLocal(storeName, localRecord);
    }
  }

  // Automated Webhook Integrations
  async _triggerWebhooks(task) {
    try {
      const slackSetting = this.getCached('settings', 'slack_webhook');
      if (slackSetting && slackSetting.value) {
        const text = `✅ Task Completed: *${task.title}*${task.notes ? `\n> ${task.notes}` : ''}`;
        fetch(slackSetting.value, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        }).catch(err => console.warn('Slack webhook failed:', err));
      }
      
      const githubSetting = this.getCached('settings', 'github_token');
      const githubRepoSetting = this.getCached('settings', 'github_repo');
      if (githubSetting && githubSetting.value && githubRepoSetting && githubRepoSetting.value) {
        const [owner, repo] = githubRepoSetting.value.split('/');
        if (owner && repo) {
          fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${githubSetting.value}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: `Task Completed: ${task.title}`,
              body: `Completed task details:\n\n**Notes:** ${task.notes || 'None'}\n**Completed At:** ${new Date().toISOString()}`
            })
          }).catch(err => console.warn('GitHub API failed:', err));
        }
      }
    } catch (err) {
      console.warn('Webhook triggering failed:', err);
    }
  }

  // Populate development seed data
  async seed() {
    // Seed Areas
    await this.put('areas', { id: 'a1', name: 'Personal', icon: 'smile', createdAt: Date.now() });
    await this.put('areas', { id: 'a2', name: 'Work', icon: 'briefcase', createdAt: Date.now() });

    // Seed Projects
    await this.put('projects', { id: 'p1', name: 'Fitness Goals', areaId: 'a1', status: 'active', createdAt: Date.now() });
    await this.put('projects', { id: 'p2', name: 'Work Launch', areaId: 'a2', status: 'active', createdAt: Date.now() });

    // Seed Tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
    const nextMondayStr = nextMonday.toISOString().split('T')[0];

    await this.put('tasks', {
      id: 't1',
      title: 'Buy groceries',
      notes: 'Need milk, bread, and apples.',
      completed: false,
      dueDate: todayStr,
      priority: 'P2',
      checklistItems: [],
      tags: ['errand'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    await this.put('tasks', {
      id: 't2',
      title: 'Prepare presentation slides',
      notes: 'Use calm aesthetics and Outfit font descriptions.',
      completed: false,
      dueDate: nextMondayStr,
      priority: 'P1',
      checklistItems: [
        { id: 'sub1', title: 'Draft outline', completed: true },
        { id: 'sub2', title: 'Export PDF layout', completed: false }
      ],
      tags: ['work', 'design'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Mark onboarded setting
    await this.put('settings', { key: 'onboarded', value: true });
  }
}
