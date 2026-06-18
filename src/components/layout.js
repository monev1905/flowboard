import { el } from '../utils/dom.js'
import { getRoute, navigate } from '../services/router.js'
import { getSession, logout } from '../services/auth.js'
import { initials } from '../utils/format.js'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: dashboardIcon },
  { path: '/projects', label: 'Projects', icon: folderIcon },
  { path: '/tasks', label: 'Tasks', icon: taskIcon },
  { path: '/team', label: 'Team', icon: peopleIcon },
  { path: '/settings', label: 'Settings', icon: settingsIcon },
]

let shellState = { sidebarOpen: false }

export function renderAppShell({ content, title }) {
  const session = getSession()
  if (!session) return null

  const route = getRoute()

  const sidebar = el('aside', {
    class: `sidebar ${shellState.sidebarOpen ? 'open' : ''}`,
    'aria-label': 'Primary navigation',
  }, [
    el('div', { class: 'brand' }, [
      el('span', { class: 'brand-mark' }, 'F'),
      el('span', {}, 'FlowBoard'),
    ]),
    el('nav', { class: 'nav', 'aria-label': 'Main' },
      NAV_ITEMS.map((item) =>
        el('a', {
          href: `#${item.path}`,
          class: route.path === item.path ? 'active' : '',
          'aria-current': route.path === item.path ? 'page' : null,
          onClick: () => { shellState.sidebarOpen = false },
        }, [
          item.icon(),
          el('span', {}, item.label),
        ])
      )
    ),
    el('div', { class: 'sidebar-footer' }, [
      el('div', { class: 'sidebar-user' }, [
        el('span', { class: 'avatar' }, initials(session.name)),
        el('div', { class: 'meta' }, [
          el('div', { class: 'name' }, session.name),
          el('div', { class: 'role' }, session.role),
        ]),
      ]),
      el('button', {
        type: 'button',
        class: 'btn btn-ghost',
        onClick: () => { logout(); navigate('/login') },
      }, 'Sign out'),
    ]),
  ])

  const overlay = shellState.sidebarOpen
    ? el('div', { class: 'sidebar-overlay', onClick: () => toggleSidebar(false) })
    : null

  const topbar = el('header', { class: 'topbar' }, [
    el('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' } }, [
      el('button', {
        type: 'button',
        class: 'btn-icon menu-btn',
        'aria-label': 'Open navigation menu',
        onClick: () => toggleSidebar(true),
      }, '☰'),
      el('h1', {}, title || 'Dashboard'),
    ]),
    el('div', { class: 'topbar-actions' }, [
      el('a', { href: '#/settings', class: 'btn btn-ghost btn-sm', 'aria-label': 'Open settings' }, 'Settings'),
    ]),
  ])

  const main = el('main', { class: 'main', id: 'main', tabIndex: -1 }, content)

  return el('div', { class: 'app-shell' }, [
    sidebar,
    overlay,
    topbar,
    main,
  ])
}

function toggleSidebar(open) {
  shellState.sidebarOpen = open
  document.dispatchEvent(new CustomEvent('shell:rerender'))
}

function dashboardIcon() {
  return iconWrap('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>')
}
function folderIcon() {
  return iconWrap('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>')
}
function taskIcon() {
  return iconWrap('<path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="16" rx="3"/>')
}
function peopleIcon() {
  return iconWrap('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M14 17c1-2 3-3 5-3s4 1 5 3"/>')
}
function settingsIcon() {
  return iconWrap('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.07.36.27.69.55.92"/>')
}

function iconWrap(inner) {
  const wrap = el('span', { class: 'nav-icon', 'aria-hidden': 'true' })
  wrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">${inner}</svg>`
  return wrap
}
