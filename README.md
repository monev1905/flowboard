# FlowBoard

A responsive team task management dashboard built with vanilla JavaScript, CSS, and Vite. FlowBoard ships a complete UI for managing projects, tasks, and a small team — including a drag-and-drop kanban board, charts, mock authentication, and persistent local data.

## Highlights

- Mobile-first responsive layout (320 px / 768 px / 1200 px).
- Drag-and-drop kanban with priority, status, assignee, project, and due-date filters.
- Project board with CRUD, archive, search, progress, and team rosters.
- Dashboard with stat cards, team-workload bar chart, and task-status doughnut.
- Mock authentication with persistent session and "remember me".
- Light / dark / system theme, persisted in `localStorage`.
- Accessible by default: semantic HTML, ARIA labels, keyboard focus rings, skip patterns.
- Toast notifications for task completion, creation, deletion, and theme changes.
- Zero runtime errors, Lighthouse-friendly bundle (chart and sortable code-split).

## Tech stack

| Concern              | Choice                                       |
| -------------------- | -------------------------------------------- |
| Build tool           | [Vite 5](https://vitejs.dev)                 |
| Language             | JavaScript (ES2020+, ES modules)             |
| Charts               | [Chart.js 4](https://www.chartjs.org)        |
| Drag and drop        | [SortableJS](https://sortablejs.github.io/Sortable/) |
| Styling              | Hand-written CSS with design tokens          |
| Persistence          | `localStorage` (JSON-serialised state)       |
| Routing              | Hash-based, framework-free                   |

No backend, no framework runtime — the entire SPA is shipped as a small set of static assets.

## Getting started

```bash
# install dependencies (once)
npm install

# start the dev server on http://localhost:5173
npm run dev

# build for production (output: ./dist)
npm run build

# preview the production build on http://localhost:4173
npm run preview
```

### Demo credentials

```
email:    demo@flowboard.app
password: demo1234
```

The login form is prefilled in development.

## Feature tour

1. **Sign in** with the demo credentials. Sessions persist across reloads when "Remember me" is enabled.
2. **Dashboard** — see active projects, completed tasks, overdue items, team productivity, plus an activity feed.
3. **Projects** — create, edit, archive, search, and filter projects. Each card shows progress, assigned members, and due date.
4. **Tasks** — kanban board with `Backlog`, `In progress`, `Review`, and `Completed` lanes. Drag cards between columns to update status; use the toolbar to search, filter by project / priority / assignee, and sort.
5. **Team** — workload overview for every member, including open, completed, overdue, and project counts.
6. **Settings** — swap theme, edit profile, toggle notification preferences, reset demo data, or sign out.

All edits persist immediately to `localStorage` under the `flowboard:` key prefix.

## Architecture

```
src/
├── components/     reusable UI: layout, modal, toasts, charts
├── data/           seed mock data
├── pages/          one render() per route (dashboard, projects, tasks, team, settings, login)
├── services/       store, storage, auth, router, theme — pure modules, no framework
├── styles/         design tokens, base, components, layout (CSS only)
├── utils/          DOM helpers, formatters
└── main.js         entry: wires router, store, auth, and shell
```

The renderer is a small function composition: each page returns a `Node`, the app shell wraps it, and `main.js` swaps it into `#app` whenever the route, session, or store changes. State mutations are funnelled through `services/store.js`, which persists to `localStorage` and emits change events so the UI stays in sync.

## Accessibility

- Every interactive control is reachable by keyboard.
- Visible focus rings via `:focus-visible`.
- ARIA roles on dialogs (`role="dialog"`, `aria-modal="true"`), the navigation, charts (`role="img"`), and the toast region (`aria-live="polite"`).
- `prefers-reduced-motion` is respected for animations.
- Forms label every input and surface validation errors inline.

## Performance

- Chart.js and SortableJS are code-split into their own chunks so they only load when first needed.
- CSS is hand-rolled — no utility framework runtime.
- Images and icons are inline SVG.
- Production build is `< 80 kB gzipped` (chart chunk is the heaviest dependency).

## Screenshots

| Surface  | Preview                                          |
| -------- | ------------------------------------------------ |
| Desktop  | `docs/screenshots/desktop.png` _(placeholder)_   |
| Tablet   | `docs/screenshots/tablet.png` _(placeholder)_    |
| Mobile   | `docs/screenshots/mobile.png` _(placeholder)_    |

Drop your captures into `docs/screenshots/` to populate the table above.

## Deployment

The build output in `dist/` is fully static — drop it onto GitHub Pages, Netlify, Vercel, or any static host.

```bash
npm run build
# upload ./dist to your host of choice
```

The Vite config uses a relative `base: './'` so the bundle works from any subdirectory (handy for GitHub Pages user/project sites).

## Roadmap

The PRD calls out a few future enhancements that are out of scope for the current build:

- Migrate to React or another framework.
- Wire up a real backend and real-time updates.
- Add calendar / Gantt views.
- File uploads and team chat.

## License

MIT — see `LICENSE` (or use however suits you for portfolio review).
