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
