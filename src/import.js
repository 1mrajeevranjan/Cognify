export async function importTodoist(jsonText, store) {
  let data;
  try { data = JSON.parse(jsonText); } catch { return { imported: 0, skipped: 0 }; }
  
  const items = data.items || data.tasks || [];
  let imported = 0, skipped = 0;
  const existing = store.getAllCached ? store.getAllCached('tasks') : [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.content || item.title || '';
    const dueDate = item.due?.date || item.dueDate || null;
    // Skip duplicates
    if (existing.some(t => t.title === title && t.dueDate === dueDate)) { skipped++; continue; }
    // Todoist priority: 1=normal(P3/P4), 2=medium(P3), 3=high(P2), 4=urgent(P1) — reversed
    const priorityMap = { 4: 'P1', 3: 'P2', 2: 'P3', 1: 'P3' };
    const task = {
      id: `t-import-${Date.now()}-${i}`,
      title,
      notes: item.description || item.notes || '',
      completed: item.checked === 1 || item.completed === true,
      dueDate,
      priority: priorityMap[item.priority] || null,
      tags: item.labels || item.tags || [],
      checklistItems: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await store.put('tasks', task);
    imported++;
  }
  return { imported, skipped };
}

export async function importNotion(csvText, store) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { imported: 0, skipped: 0 };
  
  function splitCSVRow(row) {
    const result = [];
    let cur = '', inQ = false;
    for (const ch of row) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  }
  
  const headers = splitCSVRow(lines[0]).map(h => h.toLowerCase().replace(/"/g, '').trim());
  const nameIdx = headers.findIndex(h => h === 'name' || h === 'title');
  const notesIdx = headers.findIndex(h => h === 'notes' || h === 'content');
  const dateIdx = headers.findIndex(h => h === 'date' || h === 'due date');
  const tagsIdx = headers.findIndex(h => h === 'tags' || h === 'tag');
  const statusIdx = headers.findIndex(h => h === 'status');
  
  if (nameIdx === -1) return { imported: 0, skipped: 0 };
  
  const existing = store.getAllCached ? store.getAllCached('tasks') : [];
  let imported = 0, skipped = 0;
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = splitCSVRow(lines[i]).map(c => c.replace(/^"|"$/g, '').trim());
    const title = cols[nameIdx] || '';
    if (!title) continue;
    const dueDate = dateIdx >= 0 ? (cols[dateIdx] || null) : null;
    if (existing.some(t => t.title === title && t.dueDate === dueDate)) { skipped++; continue; }
    const status = statusIdx >= 0 ? cols[statusIdx] : '';
    const tags = tagsIdx >= 0 && cols[tagsIdx] ? cols[tagsIdx].split(',').map(t => t.trim()).filter(Boolean) : [];
    const task = {
      id: `t-notion-${Date.now()}-${i}`,
      title,
      notes: notesIdx >= 0 ? (cols[notesIdx] || '') : '',
      completed: status.toLowerCase() === 'done' || status.toLowerCase() === 'complete',
      dueDate,
      priority: null,
      tags,
      checklistItems: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await store.put('tasks', task);
    imported++;
  }
  return { imported, skipped };
}
