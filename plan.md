<!-- /autoplan restore point: /Users/rajeevranjan/.gstack/projects/Cognify/main-autoplan-restore-20260625-175657.md -->
# Cognify Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a beautiful, responsive, offline-first personal task manager (Cognify) with Things 3 design aesthetics (calm typography, minimal lists, command-first capture), an NLP input engine, and local reminders.

**Architecture:** Single Page Application (SPA) using vanilla ES6 modules, CSS Custom Properties (variables) for styling/theming, and IndexedDB for offline-first state persistence.

**Tech Stack:** Vanilla JS (ES6 modules), Vanilla CSS (variables, calm list spacing), IndexedDB, HTML5, Service Worker (for caching and offline support).

## Global Constraints
- **Performance:** Sub-100ms task creation and navigation. Synchronous in-memory caching in the store for instant reads, async IndexedDB writes in the background.
- **Offline-first:** IndexedDB-backed state and local Service Worker asset caching with zero external runtime dependencies except locally bundled parsing libraries.
- **Aesthetics (Calm UI):** Flat light-gray surfaces, thin borders, no rounded card-grid structures. Outfit/Inter font system, accent colors for active states.
- **Motion:** Purposeful animations (800ms task completion holding state, 150ms spring transitions for detail drawers, fade-in Quick Entry).
- **Accessibility:** 44px minimum touch targets, visible focus rings, full keyboard accessibility (Escape to close, Arrows to navigate, Enter to inspect).

---

### Task 1: Project Setup & Design System Foundation

**Files:**
- Create: `index.html`
- Create: `css/app.css` (consolidated layout, variables, and components)
- Create: `tests.js` (lightweight native test script running via node tests.js with mock DOM/IndexedDB)
- Create: `package.json` (defines scripts to run local dev server and test runner)

**Interfaces:**
- Consumes: None
- Produces: Base HTML layout, layout logic, testing suite, package definitions, and CSS Custom Properties for colors, spacing, and font sizes.

- [x] **Step 1: Create package.json** containing npm scripts: `dev` (runs a simple local HTTP server) and `test` (runs `node tests.js`).
- [x] **Step 2: Create index.html template** with links to Outfit/Inter fonts, CSS styles, a loading splash overlay (fading out after boot), and a root layout structure (sidebar container and main view container).
- [x] **Step 3: Create css/app.css** containing HSL variables for background, foreground, primary (blue-indigo accent), sidebar backgrounds, thin borders, and spacing scales. Include light and dark mode mappings. Use flat gray list structures, thin dividers, and hide sidebar on mobile (<768px).
- [x] **Step 4: Create tests.js** as a simple assert script with native `assert` to verify structural layout, DOM variables, and mock environments.
- [x] **Step 5: Run verification and commit** (`WIP: Task 1 - Setup layout, unified CSS, package.json, and tests runner`).

---

### Task 2: Core Task Store & IndexedDB Persistence (Generic CRUD & Cache)

**Files:**
- Create: `src/store.js`
- Modify: `tests.js`

**Interfaces:**
- Consumes: None
- Produces: `TaskStore` class implementing generic database operations: `get(storeName, id)`, `getAll(storeName)`, `put(storeName, data)`, `delete(storeName, id)`, and `subscribe(storeName, callback)` to listen for changes.

- [x] **Step 1: Implement Store class in src/store.js** with IndexedDB initialization. Schema includes `tasks` (id, title, notes, completed, dueDate, startDate, priority [P1-P3], checklistItems [JSON array of {id, title, completed}], tags [array], createdAt, updatedAt), `projects` (id, name, areaId, status, createdAt), `areas` (id, name, icon, createdAt), and `settings` (key, value).
- [x] **Step 2: Implement synchronous in-memory state caching** in `store.js` for instant UI reads, updating the cache synchronously and saving to IndexedDB asynchronously in the background.
- [x] **Step 3: Implement subscription pattern** in `store.js` so components can listen to changes per store.
- [x] **Step 4: Write tests in tests.js** asserting that adding, updating, and deleting tasks updates the cache and database. Add tests for transaction recovery.
- [x] **Step 5: Run tests.js, verify all tests pass, and commit** (`WIP: Task 2 - Implement reactive cached TaskStore with IndexedDB persistence`).

---

### Task 3: Sidebar, Boot Routing, Navigation & Development Seeding

**Files:**
- Create: `src/app.js` (main entry, boot handler, router)
- Modify: `tests.js`
- Modify: `src/store.js` (add seed functionality)

**Interfaces:**
- Consumes: `TaskStore` from `src/store.js`
- Produces: Route switching functionality and UI update trigger for sidebar links (`Inbox`, `Today`, `Upcoming`, `Someday`, `Logbook`, `Projects`, `Areas`), plus development seeding hook.

- [x] **Step 1: Implement router in src/app.js** that listens to `hashchange` events and maps routes to views.
- [x] **Step 2: Implement boot handling in src/app.js** that waits for IndexedDB initialization. If query parameter `?seed=true` is present, populate the database with mock tasks, projects, and areas automatically.
- [x] **Step 3: Intercept routing in boot** checking if the settings store has `onboarded` flag, routing to `#onboarding` if false, and fading out the splash screen overlay once ready.
- [x] **Step 4: Build Sidebar Component in src/components/sidebar.js** (and template in index.html) with active state indicators and brand logo "Cognify".
- [x] **Step 5: Add routing tests in tests.js** asserting that hash changes trigger route handler and update active view classes.
- [x] **Step 6: Verify routing works, then commit** (`WIP: Task 3 - Implement routing, boot interception, and sidebar`).

---

### Task 4: Modular Task List & Detail UI (Calm Layout Views)

**Files:**
- Create: `src/components/views.js` (consolidated UI views: TodayView, OnboardingView, SettingsView)
- Create: `src/components/item.js` (TaskList and TaskItem components)
- Modify: `tests.js`

**Interfaces:**
- Consumes: `TaskStore` from `src/store.js`
- Produces: Rendered task list, complete/uncomplete transitions, and inline/modal details panel.

- [x] **Step 1: Write UI tests in tests.js** verifying task completion logic: circle checkbox click triggers 800ms hold state, then plays fade-out transition.
- [x] **Step 2: Implement TaskList and TaskItem render logic** in `src/components/item.js`. Tasks render as list rows with tags, date indicators, and priority. Render empty state placeholders with warm copy and call-to-actions when lists are empty.
- [x] **Step 3: Implement detail inspector panel** expanding inline on desktop (>=768px) and sliding up as a mobile drawer (<768px). Details edit title, notes, priority, checklistItems array, project, dates, and tags.
- [x] **Step 4: Verify visually and via tests, then commit** (`WIP: Task 4 - Build Things-like TaskList and TaskItem components with micro-animations`).

---

### Task 5: Quick Entry & Natural Language Date Parsing (Chrono-node)

**Files:**
- Create: `src/utils.js` (consolidated utilities: NLP parser, Notifier)
- Create: `src/components/quickentry.js` (Quick Entry overlay view)
- Modify: `tests.js`

**Interfaces:**
- Consumes: `TaskStore` from `src/store.js`
- Produces: `parseNaturalLanguage(text)` returning `{ title, dueDate, tags, priority }`, and `QuickEntry` overlay trigger.

- [x] **Step 1: Download chrono-node ESM pre-bundled version** and save it locally to `lib/chrono.js`.
- [x] **Step 2: Implement parseNaturalLanguage in src/utils.js** utilizing chrono-node to extract relative dates, tags (`#tag`), and priorities.
- [x] **Step 3: Implement QuickEntry overlay in src/components/quickentry.js** triggered by global keyboard shortcut `Ctrl + Space`.
- [x] **Step 4: Add live-parsing preview inside QuickEntry** showing real-time extracted date and tag chips as the user types.
- [x] **Step 5: Write parsing assertions in tests.js and commit** (`WIP: Task 5 - Build Quick Entry with Natural Language Processing`).

---

### Task 6: Upcoming Schedule & Triage View

**Files:**
- Modify: `src/components/views.js` (add UpcomingView)
- Modify: `tests.js`

**Interfaces:**
- Consumes: `TaskStore`
- Produces: Chronological schedule view of tasks grouped by due date with scheduling controls.

- [x] **Step 1: Implement UpcomingView in src/components/views.js** rendering tasks grouped by date.
- [x] **Step 2: Build rescheduling quick actions** (Today, Tomorrow, Next Week, Someday) or simple reordering handlers.
- [x] **Step 3: Add drag-and-drop or visual button handlers** to reallocate tasks between dates.
- [x] **Step 4: Write tests for schedule grouping and scheduling controls in tests.js and commit** (`WIP: Task 6 - Build Upcoming Schedule and triage views`).

---

### Task 7: Service Worker & Offline PWA Caching

**Files:**
- Create: `sw.js` (Service Worker)
- Modify: `src/app.js` (register sw.js)
- Create: `manifest.json`

**Interfaces:**
- Consumes: All UI assets
- Produces: Offline caching cache-first fallback policies for app resources.

- [x] **Step 1: Create sw.js** implementing cache-first lookup and fetch-update strategies for `index.html`, `css/app.css`, `src/app.js`, `src/store.js`, `src/utils.js`, `src/components/*` and `lib/chrono.js`.
- [x] **Step 2: Register Service Worker in src/app.js** during app boot with fallback error handling.
- [x] **Step 3: Create manifest.json** mapping metadata, colors, and application icon paths for PWA registration.
- [x] **Step 4: Verify offline reloading works via Chrome DevTools and commit** (`WIP: Task 7 - Integrate Service Worker caching and PWA manifests`).

---

### Task 8: Local Notification Reminders & Foreground checks

**Files:**
- Modify: `src/utils.js` (implement Notifier class)
- Modify: `tests.js`

**Interfaces:**
- Consumes: `TaskStore`
- Produces: Notifier interface with `requestPermission()` and `scheduleReminder(task)` using standard Web Notification API and foreground audio alerts.

- [x] **Step 1: Implement Notifier in src/utils.js** requesting Notification permission and providing a foreground check loop (running in active tab) to inspect tasks with reminder times matching current time.
- [x] **Step 2: Trigger Web Notifications** and local Web Audio API alerts when reminders fire.
- [x] **Step 3: Write tests mocking Notification constructor in tests.js and commit** (`WIP: Task 8 - Integrate local reminders and foreground audio alerts`).

---

### Task 9: Onboarding & App Settings

**Files:**
- Modify: `src/components/views.js` (implement OnboardingView and SettingsView)

**Interfaces:**
- Consumes: `TaskStore`
- Produces: Onboarding screens and App Settings overlay.

- [x] **Step 1: Implement Onboarding view** in `src/components/views.js` highlighting keyboard shortcuts, NLP examples, and local-first data benefits with premium progress indicator.
- [x] **Step 2: Implement Settings view** with Light/Dark theme toggle, storage clear, and JSON import/export for local backups.
- [x] **Step 3: Verify overlays and commit** (`WIP: Task 9 - Add Onboarding and App Settings components`).

---

### Task 10: Final Quality Audit, Manifest, and self-check

**Files:**
- Modify: `CLAUDE.md`
- Modify: `tests.js`

**Interfaces:**
- Consumes: All modules
- Produces: PWA package ready for deployment.

- [x] **Step 1: Update tests.js to run a complete suite self-check** (assertions for all systems).
- [x] **Step 2: Update CLAUDE.md** to define the test runner command: `node tests.js`.
- [x] **Step 3: Execute tests, verify clean git status, and commit** (`WIP: Task 10 - Run final test suite, and update CLAUDE.md`).

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale |
|---|-------|----------|-----------|-----------|----------|
| 1 | CEO | Upgrade storage to IndexedDB | Mechanical | P1 (Completeness) | LocalStorage is synchronous, capped at 5MB, and easily wiped. IndexedDB ensures robust data preservation. |
| 2 | CEO | Foreground Reminder Checks & Alerts | Mechanical | P1 (Completeness) | Browser background page suspension throttles timers. We limit alerts to foreground and notify OS constraints. |
| 3 | CEO | Bundle Chrono-Node date parser | Mechanical | P3 (Pragmatic) | Custom regex parsing is too fragile for relative dates. Chrono-node is a robust open-source standard. |
| 4 | CEO | Defer paywall and subscription gating | Mechanical | P6 (Bias toward action) | Early monetization gating is premature for a local-only prototype. Focus on retention first. |
| 5 | CEO | Defer Calendar Grid & Mock Sync | Mechanical | P5 (Explicit over clever) | Visual grid UI and simulated Google OAuth sync represent complex scope with low early learning value. |
| 6 | CEO | Defer Voice Capture | Mechanical | P5 (Explicit over clever) | Voice-to-text API integration is complex and deferred to Phase 2. Focus on natural text entry first. |
| 7 | CEO | SELECTIVE_EXPANSION Mode | Mechanical | P6 (Bias toward action) | Enables cherry-picking high-value improvements while keeping the base plan focused and clean. |
| 8 | Design | Reframe visual style to calm list layout | User Challenge | P5 (Explicit over clever) | Stacked cards and glassmorphic templates generate visual noise. Flat lists with thin dividers focus on utility. |
| 9 | Design | Add boot route logic for Onboarding | Mechanical | P5 (Explicit over clever) | Prevents future routing refactors by handling onboarding interception on app start. |
| 10 | Design | Add splash screen & custom empty states | Mechanical | P1 (Completeness) | Smooths out asynchronous database boot-up flashes and populates blank lists with functional CTAs. |
| 11 | Design | UI element details inline vs modal | Mechanical | P1 (Completeness) | Standardized inline expansion for desktop layouts and slide-up drawers for mobile sizes. |
| 12 | Design | Real-time NLP parsing preview chips | Mechanical | P1 (Completeness) | Solves the "blind input" user experience gap by providing immediate visual feedback of extracted metadata. |
| 13 | Design | Local bundling of libraries | Mechanical | P3 (Pragmatic) | External CDNs break offline capability. Bundling dependencies guarantees offline function. |
| 14 | Eng | Consolidate files footprint | Mechanical | P5 (Explicit over clever) | Reduced 23 scattered files into a streamlined set of ~10 core files (app.js, store.js, utils.js, sw.js, tests.js, manifest.json, css/app.css, index.html) to keep import overhead minimal. |
| 15 | Eng | Flat checklistItems & drop parentTaskId | Mechanical | P1 (Completeness) | Dropping recursive nested task hierarchies simplifies IndexedDB schema, queries, and tree rendering code. Checklist items array inside tasks fits Things 3 aesthetics perfectly. |
| 16 | Eng | Generic IndexedDB CRUD | Mechanical | P5 (Explicit over clever) | Implemented generic get/getAll/put/delete operations in store.js, eliminating redundant transaction setups for tasks, projects, areas, and settings. |
| 17 | Eng | Native Node test script tests.js | Mechanical | P6 (Bias toward action) | Used Node.js native assert module with DOM/IndexedDB mocks, avoiding large testing frameworks and execution lag. |
| 18 | Eng | Synchronous in-memory caching | Mechanical | P1 (Completeness) | Cached active state in memory in store.js, ensuring sub-1ms reads for rendering and UI state updates, while background threads save to IndexedDB asynchronously. |
| 19 | Eng | Minimal Service Worker (sw.js) | Mechanical | P1 (Completeness) | Added sw.js cache-first asset caching to deliver real offline-first loading capabilities rather than just having a manifest file. |
| 20 | Eng | Keep Ctrl + Space shortcut | User Choice | P5 (Explicit over clever) | User elected to retain Ctrl + Space as the Quick Entry global trigger hotkey despite OS shortcut conflicts. |
| 21 | Eng | Split views and components under src/components/ | Structural | P1 (Completeness) | Avoided monolithic components.js junk drawer by organizing UI layout code into logical split files (views.js, item.js, sidebar.js, quickentry.js). |
| 22 | DX | Unified package scripts | Tooling | P3 (Pragmatic) | Added package.json mapping dev/test targets to standard scripts, facilitating developer onboarding and CI test runs. |
| 23 | DX | Development Seed Data hook | Tooling | P3 (Pragmatic) | Implemented a query-parameter driven data seeding option (`?seed=true`) to populate the store with mockup records instantly, accelerating layout verification. |

## GSTACK REVIEW REPORT

| Review | Runs | Status | Findings |
|---|---|---|---|
| CEO Review | 1 | CLEAR | 7 scope decisions logged |
| Design Review | 1 | CLEAR | 6 UI polish decisions logged |
| Eng Review | 1 | CLEAR | 8 file consolidation and logic decisions logged |
| Devex Review | 1 | CLEAR | 2 unified tooling and data seeding decisions logged |
| Outside Voice | 1 | CLEAR | Codex independent plan check complete, resolved |

### Verdict
VERDICT: CLEARED — All review checks passed, plan is fully ready for implementation.

NO UNRESOLVED DECISIONS
