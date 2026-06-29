<div align="center">

# Cognify

**The calm, AI-native task manager built for everyone Things 3 forgot.**

*FlowTask aesthetics · Cross-platform · Offline-first · NLP capture · Supabase Sync · macOS & iOS Native*

[![Phase](https://img.shields.io/badge/Phase-3%20Complete-purple?style=flat-square)](https://github.com/1mrajeevranjan/Cognify)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen?style=flat-square)](#testing)
[![PRD](https://img.shields.io/badge/PRD-v1.0-orange?style=flat-square)](Cognify_PRD_v1.0.md)
[![PWA](https://img.shields.io/badge/PWA-Offline--ready-blueviolet?style=flat-square)](#pwa--offline)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Why Cognify?](#why-cognify)
- [Live Demo & Native App Run](#live-demo--native-app-run)
- [Feature Status](#feature-status)
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

> *FlowTask beauty · Todoist's cross-platform reach · TickTick's feature breadth · Local-first with optional Supabase Cloud Sync.*

Cognify runs as an installable **Progressive Web App (PWA)**, a **macOS Desktop App (via Electron)**, and a **native iOS App (via Capacitor)**. Everything runs locally in your browser/container using IndexedDB for local persistence, with optional cloud sync and collaborative features backed by Supabase.

---

## Why Cognify?

| Problem | Cognify's Answer |
|---|---|
| Things 3 is Apple-only | Full PWA + macOS App + iOS native wrapper — runs everywhere |
| Todoist gates reminders behind Pro | Local notifications and system alerts are free, always |
| TickTick has a cluttered, noisy UI | FlowTask design system: calm layout, Inter typography, Geist mono tags |
| Cloud sync forces sign-up | Offline-first. Use local IndexedDB instantly; login only for backup & teams |
| Collaboration is complex | Built-in Supabase real-time sync with Team Workspace and Workload views |

---

## Live Demo & Native App Run

### 🌐 Web Browser (PWA)
```bash
# Clone and serve locally
git clone https://github.com/1mrajeevranjan/Cognify.git
cd Cognify
npm run dev
# → Open http://127.0.0.1:8000/?seed=true
```

### 🖥️ macOS Desktop App (Electron)
```bash
# Run locally in an Electron shell
npm run electron

# Package a local app bundle
npm run pack

# Build a distributable DMG installer (under dist-electron/)
npm run dist
```

### 📱 iOS Native App (Capacitor)
```bash
cd ios-app
# Sync web builds to Xcode project
npm run sync
# Open workspace in Xcode
npm run open
```

---

## Feature Status

> All core development is complete. The system integrates standard local functionality with advanced views and native packaging.

### 🟢 Core Views & Layout
- **Inbox View**: Unsorted task capture.
- **Today View**: Daily task view + overdues with smart **Daily Briefing suggestions**.
- **Upcoming View**: Chronological schedule + **📅 Reschedule popover**.
- **Someday View**: Backlog for tasks without due dates.
- **Logbook View**: Archives completed tasks.
- **Settings View**: Choose from 6 visual themes (Light, Dark, Sepia, Ocean, Forest, Rose) + import/export backup.

### 🟡 Phase 2 & 3 Productivity Boosters
- **Habits View** (🔥): Track recurring habits and streaks directly alongside tasks.
- **Pomodoro View** (⏱️): Integrated Focus session widget with preset timers and sound loops.
- **Kanban Board** (🗂️): Custom column statuses (To Do, In Progress, Review, Done) for task management.
- **Eisenhower Matrix** (⚡): Grid layout separating tasks by Urgency and Importance (Do First, Plan, Delegate, Eliminate).
- **Calendar View** (🗓️): Native month grid showing tasks by their due dates.
- **Weekly Review** (📝): Structured prompts to clear inbox, process overdue items, and schedule the week.
- **Analytics View** (📈): Productivity score breakdown, completed tasks history, and project focus distribution.

### 👥 Collaboration & Sync
- **Supabase Integration**: Optional email/password sign-in. Instantly triggers real-time backup and synchronization of local IndexedDB data to Supabase PostgreSQL database.
- **Workspaces (Teams)** (👥): Share projects, assign tasks to members, and view shared backlogs.
- **Workload View** (📊): Visual indicator of task distribution per team member to prevent burnout.

### ⚡ Natural Language Processing (NLP) & Reminders
- **Quick Entry** (`Ctrl + Space`): Keyboard overlay that opens anywhere.
- **Natural Language Parsing**: Direct typing (`"Submit report tomorrow !p1 #work"`) parses tags, priority, and dates on the fly.
- **Local Reminders**: Timer checks every 5s for upcoming task due times, rendering Web Notifications and playing Web Audio beeps.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Core** | Vanilla ES6 Modules | Zero build step, native browser support, offline-compatible |
| **Styling** | FlowTask CSS System | Fluid 8px spacing scale, custom properties, frosted glass headers (`backdrop-filter`) |
| **Fonts** | Inter & Geist Mono | High-density Inter for readability, Geist Mono for tags & metadata |
| **Database** | IndexedDB + Supabase | Local-first fast writes mapped to Supabase real-time cloud sync |
| **Date NLP** | [chrono-node](https://github.com/wanasit/chrono) (bundled ESM) | Offline-friendly relative date processing |
| **Desktop Wrapper** | Electron | High integration with macOS (hiddenInset titlebar, native menu shortcuts) |
| **Mobile Wrapper** | Capacitor iOS | Native web runtime wrapper with strict safe-area margins (notch/home bar) |

---

## Project Structure

```
Cognify/
├── index.html                  # Main SPA entry point
├── css/
│   ├── app.css                 # Primary FlowTask CSS design system
│   └── ios.css                 # iOS safe areas and tap-highlight override rules
├── electron/
│   └── main.js                 # Electron desktop configuration
├── ios-app/
│   ├── capacitor.config.json   # Capacitor bundle & sync details
│   ├── package.json            # Capacitor local scripts
│   └── www/                    # Synced static assets for mobile shell
├── src/
│   ├── app.js                  # App lifecycle, routing, sidebars, and boot actions
│   ├── store.js                # TaskStore (IndexedDB wrapper + reactive hooks)
│   ├── supabase.js             # Supabase Client connection instance
│   ├── utils.js                # NLP utility helpers, Notifier class, DailyBriefing
│   └── components/
│       ├── views.js            # Base Views
│       ├── item.js             # TaskItem, TaskList, TaskDetailPanel
│       ├── habits.js           # Habit tracking component
│       ├── kanban.js           # Kanban drag/drop board view
│       ├── pomodoro.js         # Focus widget
│       ├── eisenhower.js       # Eisenhower Quadrant grid
│       └── ...
├── sw.js                       # Service Worker for offline asset caching
├── tests.js                    # Local test runner (node tests.js)
├── package.json                # Root package configuration
└── Cognify_PRD_v1.0.md         # Original PRD
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
| Toggle dark mode | Settings → Appearance → Toggle Theme |
| Cloud Sync | Sidebar → Login / Sync |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│             Web App / Electron / iOS             │
│                                                  │
│   index.html → src/app.js (boot + router)        │
│        │                                         │
│        ├── renderSidebar()                       │
│        ├── navigate()                            │
│        │      │                                  │
│        │      └── views.js ─── components/       │
│        │                                         │
│        ├── store.js (TaskStore)                  │
│        │      ├── In-memory Cache                │
│        │      ├── IndexedDB (Local)              │
│        │      └── Supabase Real-time (Remote)    │
│        │                                         │
│        └── utils.js (chrono parsing / Notifier)  │
│                                                  │
│   sw.js (Service Worker caching)                 │
└──────────────────────────────────────────────────┘
```

---

## Testing

Tests run in Node.js with mock DOM APIs. No compiler or runners required:

```bash
node tests.js
```

---

## Contributing

1. Fork this repository.
2. Verify all tests pass: `node tests.js`
3. Check code formatting against the FlowTask CSS rules.
4. Submit a Pull Request targeting `main`.

---

## License

MIT © 2026 [Rajeev Ranjan](https://github.com/1mrajeevranjan)

---

<div align="center">

*Built for everyone who ever wanted Things 3 on their Android, Windows, and macOS device.*

**[⭐ Star this repo](https://github.com/1mrajeevranjan/Cognify)** · **[🐛 Report a bug](https://github.com/1mrajeevranjan/Cognify/issues)** · **[💡 Request a feature](https://github.com/1mrajeevranjan/Cognify/issues)**

</div>
