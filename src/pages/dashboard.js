import { el } from '../utils/dom.js'
import { store } from '../services/store.js'
import { getSession } from '../services/auth.js'
import { formatDate, formatRelative, initials, isOverdue } from '../utils/format.js'
import { createStatusChart, createWorkloadChart } from '../components/charts.js'

let charts = []

export function renderDashboard() {
  destroyCharts()
  const session = getSession()
  const projects = store.projects()
  const tasks = store.tasks()
  const members = store.members()
  const completed = tasks.filter((t) => t.status === 'completed').length
  const overdue = tasks.filter((t) => t.status !== 'completed' && isOverdue(t.dueDate)).length
  const activeProjects = projects.filter((p) => p.status === 'active').length
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  const statusCanvas = el('canvas', { 'aria-label': 'Task status distribution', role: 'img' })
  const workloadCanvas = el('canvas', { 'aria-label': 'Team workload chart', role: 'img' })

  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  const root = el('div', {}, [
    el('div', { class: 'page-header' }, [
      el('div', { class: 'title' }, [
        el('h1', {}, `Welcome back, ${session.name.split(' ')[0]}`),
        el('p', { class: 'subtitle' }, 'Here is what is happening across your workspace.'),
      ]),
      el('a', { href: '#/tasks', class: 'btn btn-primary' }, 'Manage tasks'),
    ]),

    el('section', { class: 'grid grid-stats', style: { marginBottom: 'var(--space-5)' } }, [
      statCard('Active projects', activeProjects, 'Out of ' + projects.length + ' total'),
      statCard('Completed tasks', completed, completionRate + '% of all tasks'),
      statCard('Overdue tasks', overdue, overdue ? 'Need attention' : 'All on track', overdue ? 'down' : 'up'),
      statCard('Team productivity', completionRate + '%', 'Completion rate'),
    ]),

    el('section', { class: 'grid grid-two', style: { marginBottom: 'var(--space-5)' } }, [
      el('div', { class: 'card' }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' } }, [
          el('h2', {}, 'Team workload'),
          el('span', { class: 'badge' }, 'Open tasks'),
        ]),
        el('div', { class: 'chart-wrap' }, workloadCanvas),
      ]),
      el('div', { class: 'card' }, [
        el('h2', { style: { marginBottom: 'var(--space-3)' } }, 'Task status'),
        el('div', { class: 'chart-wrap' }, statusCanvas),
      ]),
    ]),

    el('section', { class: 'grid grid-two' }, [
      el('div', { class: 'card' }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' } }, [
          el('h2', {}, 'Recent tasks'),
          el('a', { href: '#/tasks', class: 'btn btn-ghost btn-sm' }, 'View all'),
        ]),
        recentTasks.length
          ? el('ul', { style: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
              recentTasks.map((t) => renderRecentTask(t, members, projects))
            )
          : el('div', { class: 'empty' }, 'No tasks yet.'),
      ]),
      el('div', { class: 'card' }, [
        el('h2', { style: { marginBottom: 'var(--space-3)' } }, 'Activity'),
        renderActivity(),
      ]),
    ]),
  ])

  queueMicrotask(() => {
    charts.push(createWorkloadChart(workloadCanvas, members, tasks))
    charts.push(createStatusChart(statusCanvas, tasks))
  })

  return root
}

function statCard(label, value, hint, trend) {
  return el('div', { class: 'card stat-card' }, [
    el('span', { class: 'label' }, label),
    el('span', { class: 'value' }, String(value)),
    el('span', { class: `delta ${trend ? 'delta-' + trend : ''}` }, hint),
  ])
}

function renderRecentTask(task, members, projects) {
  const assignee = members.find((m) => m.id === task.assigneeId)
  const project = projects.find((p) => p.id === task.projectId)
  return el('li', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' } }, [
    el('span', { class: 'avatar avatar-sm' }, assignee ? initials(assignee.name) : '–'),
    el('div', { style: { flex: 1, display: 'flex', flexDirection: 'column' } }, [
      el('span', { style: { fontWeight: 600 } }, task.title),
      el('span', { style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } },
        `${project?.name || 'No project'} · ${task.status.replace('_', ' ')}`),
    ]),
    el('span', { class: `badge badge-${priorityVariant(task.priority)}` }, task.priority),
  ])
}

function renderActivity() {
  const items = store.activity().slice(0, 8)
  if (!items.length) return el('div', { class: 'empty' }, 'No recent activity yet.')
  return el('ul', { class: 'activity', style: { listStyle: 'none', padding: 0, margin: 0 } },
    items.map((a) =>
      el('li', { class: 'activity-item' }, [
        el('span', { class: 'avatar avatar-sm', 'aria-hidden': 'true' }, '•'),
        el('div', { style: { flex: 1 } }, [
          el('div', { class: 'body' }, a.message),
          el('div', { class: 'meta' }, formatRelative(a.ts) + ' · ' + formatDate(a.ts)),
        ]),
      ])
    )
  )
}

function priorityVariant(priority) {
  if (priority === 'high') return 'danger'
  if (priority === 'medium') return 'warning'
  return 'info'
}

function destroyCharts() {
  charts.forEach((c) => { try { c.destroy() } catch {} })
  charts = []
}
