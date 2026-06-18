import './styles/main.css'
import { getRoute, subscribe as subscribeRoute, navigate } from './services/router.js'
import { isAuthenticated, subscribe as subscribeAuth } from './services/auth.js'
import { store } from './services/store.js'
import { onPreferencesChange } from './services/theme.js'
import { renderAppShell } from './components/layout.js'
import { renderLogin } from './pages/login.js'
import { renderDashboard } from './pages/dashboard.js'
import { renderProjects } from './pages/projects.js'
import { renderTasks } from './pages/tasks.js'
import { renderTeam } from './pages/team.js'
import { renderSettings } from './pages/settings.js'

const ROUTES = [
  { path: '/', title: 'Dashboard', render: renderDashboard },
  { path: '/projects', title: 'Projects', render: renderProjects },
  { path: '/tasks', title: 'Tasks', render: renderTasks },
  { path: '/team', title: 'Team', render: renderTeam },
  { path: '/settings', title: 'Settings', render: renderSettings },
]

const root = document.getElementById('app')

function resolveRoute(path) {
  return ROUTES.find((r) => r.path === path) || ROUTES[0]
}

function render() {
  const route = getRoute()
  if (route.path === '/login') {
    document.title = 'Sign in · FlowBoard'
    root.replaceChildren(renderLogin())
    return
  }
  if (!isAuthenticated()) {
    navigate('/login')
    return
  }
  const match = resolveRoute(route.path)
  document.title = `${match.title} · FlowBoard`
  const content = match.render({ route })
  const shell = renderAppShell({ content, title: match.title })
  root.replaceChildren(shell)
}

subscribeRoute(render)
subscribeAuth(render)
store.subscribe(render)
onPreferencesChange(() => { /* theme applied via attribute, chart redraws naturally on next render */ })
document.addEventListener('shell:rerender', render)

if (!window.location.hash) {
  navigate(isAuthenticated() ? '/' : '/login')
} else {
  render()
}
