<div align="center">

# Cognify

**The calm, AI-native task manager built for everyone Things 3 forgot.**

*Things 3 aesthetics · Cross-platform · Offline-first · NLP capture · Local reminders*

[![Phase](https://img.shields.io/badge/Phase-1%20Complete-brightgreen?style=flat-square)](https://github.com/1mrajeevranjan/Cognify)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-33%20Passing-brightgreen?style=flat-square)](#testing)
[![PRD](https://img.shields.io/badge/PRD-v1.0-orange?style=flat-square)](Cognify_PRD_v1.0.md)
[![PWA](https://img.shields.io/badge/PWA-Offline--ready-blueviolet?style=flat-square)](#pwa--offline)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Why Cognify?](#why-cognify)
- [Live Demo](#live-demo)
- [Phase 1 Feature Status](#phase-1-feature-status)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Key Interactions](#key-interactions)
- [Architecture](#architecture)
- [PWA & Offline](#pwa--offline)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Cognify is a **cross-platform, offline-first personal task manager** that fills the gap no competitor has closed:

> *Things 3 beauty · Todoist's cross-platform reach · TickTick's feature breadth · at a price accessible to everyone.*

Phase 1 ships as a **Progressive Web App (PWA)** — zero dependencies, zero cloud sync, zero paywall. Everything runs in your browser using IndexedDB for local persistence and a Service Worker for offline caching.

---

## Why Cognify?

| Problem | Cognify's Answer |
|---|---|
| Things 3 is Apple-only | Full PWA — works on every OS and browser |
| Todoist gates reminders behind Pro | Local reminders free, always |
| TickTick has a cluttered, noisy UI | Things 3-inspired calm list layout |
| Motion AI scheduling costs $19/month | NLP parsing built-in, AI scheduling in Phase 2 at a fraction |
| No app has India/emerging-market pricing | Phase 2 Pro at ₹149/month |
| Average knowledge worker uses 2.4 productivity apps | One calm app: task capture + NLP + reminders + offline |

---

## Live Demo

```bash
# Clone and serve locally
git clone https://github.com/1mrajeevranjan/Cognify.git
cd Cognify
npm run dev
# → Open http://127.0.0.1:8000/?seed=true
```

> The `?seed=true` flag pre-populates the database with realistic sample tasks so you can explore immediately.

---

## Phase 1 Feature Status

> **Phase 1 is complete.** All 10 implementation tasks and 33 automated tests pass. The table below reflects the live browser-verified state.

| Feature Area | Feature | Status |
|---|---|---|
| **Onboarding** | First-boot redirection to onboarding screen | ✅ Working |
| | Keyboard shortcut guide + NLP examples | ✅ Working |
| | "Get Started" → saves `onboarded` flag + redirects to Today | ✅ Working |
| **Navigation** | Sidebar with 6 nav links (Inbox, Today, Upcoming, Someday, Logbook, Settings) | ✅ Working |
| | Active link highlight tracks current route | ✅ Working |
| | Hash-router (no page reloads, full history support) | ✅ Working |
| **Today View** | Displays tasks due today + overdue | ✅ Working |
| | Groups tasks by project | ✅ Working |
| | Empty state with warm copy + Quick Entry CTA | ✅ Working |
| **Inbox View** | Displays all tasks without a project (unsorted capture) | ✅ Working |
| **Upcoming View** | Chronological 7-day+ schedule grouped by date | ✅ Working |
| | Smart date headers ("Today", "Tomorrow", weekday labels) | ✅ Working |
| | 📅 Reschedule triage popover (Today / Tomorrow / Next Week / Someday) | ✅ Working |
| **Someday View** | Displays tasks without a due date | ✅ Working |
| **Logbook View** | Displays completed tasks archive | ✅ Working |
| **Settings View** | Light / Dark mode toggle (persisted to IndexedDB) | ✅ Working |
| | Theme applied on every boot from stored preference | ✅ Working |
| | Export data as JSON backup | ✅ Working |
| | Import data from JSON backup | ✅ Working |
| | Clear all data → wipes stores + redirects to onboarding | ✅ Working |
| **Task Capture** | `Ctrl + Space` global keyboard shortcut → Quick Entry overlay | ✅ Working |
| | Live NLP parsing preview chips (date, priority, tags) as you type | ✅ Working |
| | Natural language input: `"Report tomorrow !p1 #work"` | ✅ Working |
| | Press `Enter` to save task to IndexedDB | ✅ Working |
| **Task Interactions** | Click task row → inline detail inspector panel (desktop) | ✅ Working |
| | Slide-up drawer on mobile (<768px) | ✅ Working |
| | Edit title, notes, due date, priority, tags in detail panel | ✅ Working |
| | Click circle checkbox → 800ms completion hold → fade out + save | ✅ Working |
| **Persistence** | Generic IndexedDB CRUD with synchronous in-memory cache | ✅ Working |
| | Reactive store subscriptions re-render views on data change | ✅ Working |
| **PWA / Offline** | Service Worker registers and activates | ✅ Working |
| | Stale-while-revalidate offline asset caching | ✅ Working |
| | `manifest.json` for installable PWA | ✅ Working |
| **Reminders** | Web Notification API permission request | ✅ Working |
| | Foreground reminder check loop (every 5s) | ✅ Working |
| | Web Audio API beep for foreground alerts | ✅ Working |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Language | Vanilla ES6 Modules | Zero build step, native browser support, offline-compatible |
| Styling | Vanilla CSS + Custom Properties | HSL design tokens, light/dark themes, zero framework |
| Persistence | IndexedDB (via custom `TaskStore`) | Offline-first, no 5MB LocalStorage cap, structured queries |
| Date Parsing | [chrono-node](https://github.com/wanasit/chrono) (bundled ESM) | Robust relative date NLP (`"next Monday"`, `"tomorrow at 3pm"`) |
| Offline | Service Worker (Cache API) | Stale-while-revalidate, works without internet |
| PWA | Web App Manifest + SW | Installable on desktop and mobile |
| Notifications | Web Notification API + Web Audio API | Local reminders, no server required |
| Fonts | [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts) | Things 3-calibre typography |
| Testing | Node.js native `assert` + DOM mocks | No test framework, fast, runs with `node tests.js` |

---

## Project Structure

```
Cognify/
├── index.html                  # Root SPA layout (splash, sidebar, main container)
├── css/
│   └── app.css                 # Full design system: HSL tokens, layout, components
├── src/
│   ├── app.js                  # Boot sequence, router, sidebar, SW registration
│   ├── store.js                # Generic IndexedDB CRUD + in-memory cache + subscriptions
│   ├── utils.js                # NLP date parser (chrono-node) + Notifier class
│   └── components/
│       ├── views.js            # TodayView, InboxView, UpcomingView, SomedayView,
│       │                       # LogbookView, OnboardingView, SettingsView
│       ├── item.js             # TaskItem, TaskList, TaskDetailPanel
│       └── quickentry.js       # Quick Entry floating overlay (Ctrl+Space)
├── lib/
│   └── chrono.js               # Bundled chrono-node ESM (offline NLP parsing)
├── sw.js                       # Service Worker (offline caching)
├── manifest.json               # PWA manifest
├── tests.js                    # Native test suite (33 assertions, node tests.js)
├── package.json                # npm scripts: dev, test
├── CLAUDE.md                   # Agent development guide
├── plan.md                     # Phase 1 implementation plan + decision audit trail
└── Cognify_PRD_v1.0.md         # Full product requirements document
```

---

## Quick Start

### Prerequisites

- Node.js 18+ (for `node tests.js` and `npm run dev`)
- A modern browser (Chrome 90+, Firefox 90+, Safari 15+)

### Run Locally

```bash
# 1. Clone
git clone https://github.com/1mrajeevranjan/Cognify.git
cd Cognify

# 2. Start dev server (serves on http://127.0.0.1:8000)
npm run dev

# 3. Open with seed data
open "http://127.0.0.1:8000/?seed=true#today"
```

### Run Tests

```bash
node tests.js
```

Expected output:
```
✅  ALL SYSTEMS PASS — Cognify Phase 1
═══════════════════════════════════════════
```

---

## Key Interactions

| Action | How |
|---|---|
| Open Quick Entry | `Ctrl + Space` from anywhere |
| Capture with NLP | Type `"Submit report tomorrow !p1 #work"` → see live chips |
| Save task | `Enter` inside Quick Entry |
| Close overlay | `Escape` |
| View task details | Click any task row |
| Complete a task | Click the circle → hold 800ms → fades out |
| Reschedule | Click `📅` on any task in Upcoming |
| Toggle dark mode | Settings → Appearance → Toggle Dark Mode |
| Export backup | Settings → Data Portability → Export JSON |
| Install as app | Browser address bar → Install icon (Chrome/Edge) |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser Tab                   │
│                                                 │
│  index.html → src/app.js (boot + router)        │
│       │                                         │
│       ├── renderSidebar()  ← NAV_ITEMS[]        │
│       ├── navigate()       ← hashchange events  │
│       │       │                                 │
│       │       └── views.js (TodayView, etc.)    │
│       │               └── item.js (TaskItem,    │
│       │                           TaskList,     │
│       │                           DetailPanel)  │
│       │                                         │
│       ├── store.js (TaskStore)                  │
│       │   ├── In-memory cache (sync reads)      │
│       │   ├── IndexedDB (async writes)          │
│       │   └── subscribe() → re-render           │
│       │                                         │
│       ├── utils.js                              │
│       │   ├── parseNaturalLanguage() (chrono)   │
│       │   └── Notifier (Web API reminders)      │
│       │                                         │
│       └── quickentry.js (Ctrl+Space overlay)   │
│                                                 │
│  sw.js (Service Worker — offline cache)         │
└─────────────────────────────────────────────────┘
```

### Data Model

```
tasks       → { id, title, notes, completed, dueDate, startDate,
                priority (P1-P3), tags[], checklistItems[],
                projectId, createdAt, updatedAt }

projects    → { id, name, areaId, status, createdAt }

areas       → { id, name, icon, createdAt }

settings    → { key, value }  (onboarded, theme)
```

### Boot Lifecycle

1. `initApp()` initialises IndexedDB and warms the in-memory cache
2. If `?seed=true`, seed data is inserted
3. `onboarded` flag checked → redirect to `#onboarding` if absent
4. Saved theme preference applied to `document.body`
5. Store subscriptions wired → any data change re-renders the current view
6. `hashchange` listener + initial `navigate()` called
7. Splash screen fades out
8. `Ctrl+Space` global hotkey registered
9. Service Worker registered
10. Reminder check loop started (every 5 seconds)

---

## PWA & Offline

Cognify is fully installable and works without internet:

- **Install**: Open in Chrome/Edge → address bar install icon → adds to home screen / dock
- **Offline**: Service Worker caches all assets on first load; subsequent visits work offline
- **Strategy**: Stale-while-revalidate (serve cached, update in background)
- **Storage**: All task data lives in IndexedDB on the device — no cloud account required

---

## Testing

Tests use **Node.js native `assert`** with lightweight DOM and IndexedDB mocks — no Jest, no Vitest, no dependencies.

```bash
node tests.js
```

**33 assertions across 10 test suites:**

| Suite | What's Tested |
|---|---|
| Task 1: Layout & Setup | HTML structure, CSS tokens, entry script |
| Task 2: Store | IndexedDB CRUD, in-memory cache, subscriptions |
| Task 3: Routing | Splash fade-out, hash-change routing |
| Task 4: UI Components | TaskItem, TaskList, detail panel, all 7 views |
| Task 5: NLP | Quick Entry overlay, live preview chips |
| Task 7: PWA | Service Worker stubs, manifest structure |
| Task 8: Reminders | Notification API, Web Audio, Notifier loop |
| Task 9: Onboarding & Settings | Get Started flow, data clear, redirect |
| Task 10: Final Audit | File existence, CSS tokens, wiring, manifest |

---

## Roadmap

### ✅ Phase 1 — Foundation (Complete)

Offline-first PWA · NLP capture · Things 3 aesthetics · Local reminders · All core views · Settings · Onboarding · PWA manifest + Service Worker

### 🔵 Phase 2 — Differentiation (Months 2–6)

- **AI Daily Planner** — morning briefing, smart task ordering
- **AI Task Breakdown** — type a goal, get actionable subtasks
- **Voice-to-Task** — speak naturally, AI structures the task
- **Built-in Pomodoro** — timer integrated with task rows
- **Habit Tracker** — daily/weekly habits with streak tracking
- **Light Collaboration** — shared lists, task assignment, comments
- **Integrations** — Slack, Todoist import, Notion import, Zapier

### 🟣 Phase 3 — Scale (Months 7–18)

- **Kanban Board** — any project or tag as a board
- **Eisenhower Matrix** — urgent/important 2×2 view
- **Teams Workspace** — up to 25 people, workload view, analytics
- **Apple Watch + Wear OS** — native companion apps
- **Browser Extension** — clip any page to a task
- **AI Meeting Intelligence** — transcript → action items
- **Windows Native App** — beyond the PWA wrapper

### 💰 Pricing (Phase 2+)

| Plan | India | Global |
|---|---|---|
| Free | ₹0 | $0 — unlimited tasks, basic reminders, cross-platform |
| Pro | ₹149/mo · ₹1,199/yr | $3.99/mo · $34.99/yr — AI features, all integrations |
| Pro+ | ₹249/mo · ₹1,999/yr | $6.99/mo · $59.99/yr — Teams, AI scheduling |
| Lifetime | ₹3,499 | $59.99 — Pro forever |

---

## Contributing

Contributions are welcome! The codebase is intentionally lean — vanilla JS, no build tools, no framework.

```bash
# Fork + clone
git clone https://github.com/YOUR_USERNAME/Cognify.git
cd Cognify

# Run the dev server
npm run dev

# Make changes, then verify nothing broke
node tests.js

# Commit with a clear message
git commit -m "feat: your feature description"

# Open a PR against main
```

**Guidelines:**
- Keep the zero-external-runtime-dependency constraint — no npm packages in `src/`
- All new features must have corresponding assertions in `tests.js`
- Follow the existing CSS variable system — no inline styles, no hardcoded colors
- Test on Chrome, Firefox, and Safari before submitting

---

## License

MIT © 2026 [Rajeev Ranjan](https://github.com/1mrajeevranjan)

---

<div align="center">

*Built for everyone who ever wanted Things 3 on their Android.*

**[⭐ Star this repo](https://github.com/1mrajeevranjan/Cognify)** · **[🐛 Report a bug](https://github.com/1mrajeevranjan/Cognify/issues)** · **[💡 Request a feature](https://github.com/1mrajeevranjan/Cognify/issues)**

</div>
