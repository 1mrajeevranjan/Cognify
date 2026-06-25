import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('Running Task 1 Layout & Setup Verification...');

// 1. Verify index.html structure
try {
  const htmlPath = path.resolve('index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
  
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('id="splash"'), 'index.html must contain a splash screen element');
  assert.ok(html.includes('id="sidebar"'), 'index.html must contain a sidebar element');
  assert.ok(html.includes('<main'), 'index.html must contain a main element');
  assert.ok(html.includes('css/app.css'), 'index.html must link css/app.css');
  
  console.log('✓ HTML Structure Verification Passed');
} catch (err) {
  console.error('✗ HTML Structure Verification Failed:', err.message);
  process.exit(1);
}

// 2. Verify css/app.css has key design tokens
try {
  const cssPath = path.resolve('css/app.css');
  assert.ok(fs.existsSync(cssPath), 'css/app.css must exist');
  
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.ok(css.includes('--background'), 'css/app.css must define --background variable');
  assert.ok(css.includes('--foreground'), 'css/app.css must define --foreground variable');
  assert.ok(css.includes('--accent'), 'css/app.css must define --accent variable');
  
  console.log('✓ CSS Design Tokens Verification Passed');
} catch (err) {
  console.error('✗ CSS Design Tokens Verification Failed:', err.message);
  process.exit(1);
}

// 3. Verify src/app.js exists
try {
  const appPath = path.resolve('src/app.js');
  assert.ok(fs.existsSync(appPath), 'src/app.js must exist');
  console.log('✓ Entry App Script Verification Passed');
} catch (err) {
  console.error('✗ Entry App Script Verification Failed:', err.message);
  process.exit(1);
}
