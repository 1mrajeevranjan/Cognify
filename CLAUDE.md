# Cognify

A calm, offline-first personal task manager with Things 3 design aesthetics, NLP capture, and local reminders. Single-page app built with vanilla ES6 modules and IndexedDB.

## Build and Test Commands

```bash
# Run the full test suite (no server needed)
node tests.js

# Start the local dev server
npm run dev         # serves on http://127.0.0.1:8000

# Seed mock data on first load
# Navigate to: http://127.0.0.1:8000/?seed=true#today
```

## Architecture

| File | Role |
|------|------|
| `index.html` | Root layout: splash, sidebar, main view container |
| `css/app.css` | Design system — HSL tokens, light/dark modes, all component styles |
| `src/app.js` | Boot, router, store + notifier wiring |
| `src/store.js` | Generic IndexedDB CRUD with in-memory cache + subscriptions |
| `src/utils.js` | NLP date parser (chrono-node), Notifier (Web Notifications + Audio) |
| `src/components/views.js` | TodayView, UpcomingView, OnboardingView, SettingsView |
| `src/components/item.js` | TaskItem, TaskList, TaskDetailPanel |
| `src/components/quickentry.js` | Floating Quick Entry overlay (Ctrl+Space) |
| `sw.js` | Service Worker — stale-while-revalidate offline cache |
| `manifest.json` | PWA manifest |
| `lib/chrono.js` | Bundled chrono-node ESM for offline NLP date parsing |

## Key Interactions

- **Quick capture:** `Ctrl + Space` → Quick Entry overlay with live NLP preview
- **Task completion:** Click circle → 800ms hold → fade out
- **Detail panel:** Click task row → inline panel (desktop) / slide-up drawer (mobile)
- **Onboarding:** Shown on first boot; "Get Started" sets `onboarded: true` in settings store
- **Settings:** Theme toggle persists `theme: dark|light` in settings store; Clear Data wipes all stores

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
