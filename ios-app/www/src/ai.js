export async function breakdownTask(title, apiKey) {
  if (!apiKey || !title) return [];
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Break the following task into 3-5 concise, actionable subtasks. Return ONLY a JSON array of strings, no markdown, no explanation.\nTask: ${title}` }] }]
        })
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function suggestDailyOrder(tasks, apiKey) {
  if (!apiKey || !tasks || tasks.length === 0) return tasks;
  try {
    const taskList = tasks.map((t, i) => `${i + 1}. [${t.id}] ${t.title} (${t.priority || 'no priority'})`).join('\n');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Order these tasks by recommended priority for today. Return ONLY a JSON array of task IDs in recommended order.\nTasks:\n${taskList}` }] }]
        })
      }
    );
    if (!res.ok) return tasks;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const orderedIds = JSON.parse(clean);
    if (!Array.isArray(orderedIds)) return tasks;
    const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]));
    return orderedIds.map(id => taskMap[id]).filter(Boolean);
  } catch {
    return tasks;
  }
}
