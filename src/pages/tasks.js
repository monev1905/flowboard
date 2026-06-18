import Sortable from 'sortablejs'
import { el, delegate } from '../utils/dom.js'
import { store } from '../services/store.js'
import { getRoute, navigate } from '../services/router.js'
import { formatDate, isOverdue, initials, debounce } from '../utils/format.js'
import { openModal, confirmDialog } from '../components/modal.js'
import { notify } from '../components/toast.js'

const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'review', label: 'Review' },
  { id: 'completed', label: 'Completed' },
]

const PRIORITIES = ['low', 'medium', 'high']

const pageState = {
  search: '',
  projectId: 'all',
  priority: 'all',
  assigneeId: 'all',
  sort: 'created_desc',
}

let sortableInstances = []
let suppressNextRender = false

export function renderTasks({ route } = {}) {
  if (route?.query?.project && route.query.project !== pageState.projectId) {
    pageState.projectId = route.query.project
  }
  destroySortables()

  const tasks = store.tasks()
  const members = store.members()
  const projects = store.projects({ includeArchived: true })

  const filtered = applyFilters(tasks)
  const onSearch = debounce((value) => { pageState.search = value; rerender() }, 150)

  const root = el('div', {}, [
    el('div', { class: 'page-header' }, [
      el('div', { class: 'title' }, [
        el('h1', {}, 'Tasks'),
        el('p', { class: 'subtitle' }, `${filtered.length} of ${tasks.length} tasks shown`),
      ]),
      el('button', { class: 'btn btn-primary', type: 'button', onClick: () => openTaskModal() }, '+ New task'),
    ]),

    el('div', { class: 'toolbar card', style: { padding: 'var(--space-3)' } }, [
      el('input', {
        class: 'input grow',
        type: 'search',
        placeholder: 'Search tasks…',
        value: pageState.search,
        'aria-label': 'Search tasks',
        onInput: (e) => onSearch(e.target.value),
      }),
      el('select', {
        class: 'select', 'aria-label': 'Filter by project', value: pageState.projectId,
        onChange: (e) => { pageState.projectId = e.target.value; updateRouteQuery() },
      }, [
        el('option', { value: 'all' }, 'All projects'),
        ...projects.map((p) => el('option', { value: p.id, selected: p.id === pageState.projectId }, p.name)),
      ]),
      el('select', {
        class: 'select', 'aria-label': 'Filter by priority', value: pageState.priority,
        onChange: (e) => { pageState.priority = e.target.value; rerender() },
      }, [
        el('option', { value: 'all' }, 'All priorities'),
        ...PRIORITIES.map((p) => el('option', { value: p, selected: p === pageState.priority }, p[0].toUpperCase() + p.slice(1))),
      ]),
      el('select', {
        class: 'select', 'aria-label': 'Filter by assignee', value: pageState.assigneeId,
        onChange: (e) => { pageState.assigneeId = e.target.value; rerender() },
      }, [
        el('option', { value: 'all' }, 'All assignees'),
        el('option', { value: 'unassigned', selected: pageState.assigneeId === 'unassigned' }, 'Unassigned'),
        ...members.map((m) => el('option', { value: m.id, selected: m.id === pageState.assigneeId }, m.name)),
      ]),
      el('select', {
        class: 'select', 'aria-label': 'Sort tasks', value: pageState.sort,
        onChange: (e) => { pageState.sort = e.target.value; rerender() },
      }, [
        el('option', { value: 'created_desc' }, 'Newest first'),
        el('option', { value: 'created_asc' }, 'Oldest first'),
        el('option', { value: 'due_asc' }, 'Due soonest'),
        el('option', { value: 'priority_desc' }, 'Highest priority'),
      ]),
    ]),

    el('section', { class: 'kanban', style: { marginTop: 'var(--space-4)' } },
      COLUMNS.map((col) => renderColumn(col, filtered, members, projects))
    ),
  ])

  delegate(root, '[data-task-action]', 'click', (event, target) => {
    event.preventDefault()
    const action = target.dataset.taskAction
    const id = target.dataset.id
    if (action === 'edit') openTaskModal(store.task(id))
    if (action === 'delete') removeTask(id)
    if (action === 'complete') {
      store.setTaskStatus(id, 'completed')
      notify.success('Task completed', store.task(id)?.title || '')
    }
  })

  queueMicrotask(() => attachSortables(root))

  return root
}

function applyFilters(tasks) {
  let list = tasks
  if (pageState.projectId !== 'all') list = list.filter((t) => t.projectId === pageState.projectId)
  if (pageState.priority !== 'all') list = list.filter((t) => t.priority === pageState.priority)
  if (pageState.assigneeId !== 'all') {
    list = pageState.assigneeId === 'unassigned'
      ? list.filter((t) => !t.assigneeId)
      : list.filter((t) => t.assigneeId === pageState.assigneeId)
  }
  if (pageState.search) {
    const q = pageState.search.toLowerCase()
    list = list.filter((t) => (t.title + ' ' + (t.description || '')).toLowerCase().includes(q))
  }
  list = [...list]
  switch (pageState.sort) {
    case 'created_asc': list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break
    case 'due_asc': list.sort((a, b) => (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity)); break
    case 'priority_desc': {
      const rank = { high: 0, medium: 1, low: 2 }
      list.sort((a, b) => rank[a.priority] - rank[b.priority]); break
    }
    default: list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
  return list
}

function renderColumn(col, tasks, members, projects) {
  const items = tasks.filter((t) => t.status === col.id)
  const list = el('div', { class: 'kanban-list', dataset: { status: col.id } },
    items.map((t) => renderTaskCard(t, members, projects))
  )
  if (!items.length) list.appendChild(el('div', { class: 'empty', style: { padding: 'var(--space-4)', fontSize: 'var(--font-size-sm)' } }, 'No tasks here yet.'))
  return el('div', { class: 'kanban-col', dataset: { column: col.id } }, [
    el('div', { class: 'kanban-col-header' }, [
      el('span', {}, col.label),
      el('span', { class: 'kanban-col-count' }, String(items.length)),
    ]),
    list,
  ])
}

function renderTaskCard(task, members, projects) {
  const assignee = members.find((m) => m.id === task.assigneeId)
  const project = projects.find((p) => p.id === task.projectId)
  const overdue = task.status !== 'completed' && isOverdue(task.dueDate)
  return el('article', {
    class: `task-card ${overdue ? 'overdue' : ''}`,
    dataset: { id: task.id },
    tabIndex: 0,
    'aria-label': `Task: ${task.title}`,
  }, [
    el('div', { class: 'meta-row' }, [
      el('span', { class: `badge badge-${priorityVariant(task.priority)}` }, task.priority),
      project ? el('span', { class: 'meta' }, project.name) : null,
    ]),
    el('div', { class: 'title' }, task.title),
    task.description ? el('p', { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: 0 } }, task.description) : null,
    el('div', { class: 'meta-row' }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' } }, [
        assignee
          ? el('span', { class: 'avatar avatar-sm', title: assignee.name }, initials(assignee.name))
          : el('span', { class: 'meta' }, 'Unassigned'),
        task.dueDate ? el('span', { class: 'due' }, (overdue ? 'Overdue · ' : 'Due ') + formatDate(task.dueDate)) : null,
      ]),
      el('div', { style: { display: 'flex', gap: 'var(--space-1)' } }, [
        task.status !== 'completed'
          ? el('button', { class: 'btn-icon', type: 'button', 'aria-label': 'Mark complete', dataset: { taskAction: 'complete', id: task.id } }, '✓')
          : null,
        el('button', { class: 'btn-icon', type: 'button', 'aria-label': 'Edit task', dataset: { taskAction: 'edit', id: task.id } }, '✎'),
        el('button', { class: 'btn-icon', type: 'button', 'aria-label': 'Delete task', dataset: { taskAction: 'delete', id: task.id } }, '🗑'),
      ]),
    ]),
  ])
}

function priorityVariant(priority) {
  if (priority === 'high') return 'danger'
  if (priority === 'medium') return 'warning'
  return 'info'
}

function attachSortables(root) {
  root.querySelectorAll('.kanban-list').forEach((list) => {
    sortableInstances.push(Sortable.create(list, {
      group: 'tasks',
      animation: 150,
      ghostClass: 'dragging',
      onEnd: (evt) => {
        const taskId = evt.item.dataset.id
        const nextStatus = evt.to.dataset.status
        const task = store.task(taskId)
        if (!task) return
        if (task.status === nextStatus) return
        suppressNextRender = true
        const updated = store.setTaskStatus(taskId, nextStatus)
        if (updated?.status === 'completed') {
          notify.success('Task completed', task.title)
        } else {
          notify.info('Task moved', `${task.title} → ${nextStatus.replace('_', ' ')}`)
        }
      },
    }))
  })
}

function destroySortables() {
  sortableInstances.forEach((s) => { try { s.destroy() } catch {} })
  sortableInstances = []
}

function updateRouteQuery() {
  const route = getRoute()
  if (route.path !== '/tasks') return
  const query = pageState.projectId === 'all' ? {} : { project: pageState.projectId }
  navigate('/tasks', query)
}

function rerender() {
  if (suppressNextRender) { suppressNextRender = false; return }
  document.dispatchEvent(new CustomEvent('shell:rerender'))
}

function openTaskModal(existing) {
  const isEdit = !!existing
  const projects = store.projects({ includeArchived: true })
  const members = store.members()
  const stateRef = {
    title: existing?.title || '',
    description: existing?.description || '',
    projectId: existing?.projectId || projects[0]?.id || '',
    status: existing?.status || 'backlog',
    priority: existing?.priority || 'medium',
    assigneeId: existing?.assigneeId || '',
    dueDate: existing?.dueDate ? existing.dueDate.slice(0, 10) : '',
  }

  openModal({
    title: isEdit ? 'Edit task' : 'New task',
    body: () => el('form', { onSubmit: (e) => e.preventDefault(), style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } }, [
      field('Title', el('input', { class: 'input', value: stateRef.title, required: true, onInput: (e) => stateRef.title = e.target.value })),
      field('Description', el('textarea', { class: 'textarea', value: stateRef.description, onInput: (e) => stateRef.description = e.target.value })),
      el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' } }, [
        field('Project', el('select', {
          class: 'select', value: stateRef.projectId,
          onChange: (e) => stateRef.projectId = e.target.value,
        }, projects.map((p) => el('option', { value: p.id, selected: p.id === stateRef.projectId }, p.name)))),
        field('Status', el('select', {
          class: 'select', value: stateRef.status,
          onChange: (e) => stateRef.status = e.target.value,
        }, COLUMNS.map((c) => el('option', { value: c.id, selected: c.id === stateRef.status }, c.label)))),
        field('Priority', el('select', {
          class: 'select', value: stateRef.priority,
          onChange: (e) => stateRef.priority = e.target.value,
        }, PRIORITIES.map((p) => el('option', { value: p, selected: p === stateRef.priority }, p[0].toUpperCase() + p.slice(1))))),
        field('Assignee', el('select', {
          class: 'select', value: stateRef.assigneeId,
          onChange: (e) => stateRef.assigneeId = e.target.value,
        }, [
          el('option', { value: '' }, 'Unassigned'),
          ...members.map((m) => el('option', { value: m.id, selected: m.id === stateRef.assigneeId }, m.name)),
        ])),
        field('Due date', el('input', {
          class: 'input', type: 'date', value: stateRef.dueDate,
          onChange: (e) => stateRef.dueDate = e.target.value,
        })),
      ]),
    ]),
    primary: {
      label: isEdit ? 'Save changes' : 'Create task',
      onClick: () => {
        if (!stateRef.title.trim()) { notify.warning('Title required', 'Tasks need a short title.'); return false }
        const payload = {
          title: stateRef.title,
          description: stateRef.description,
          projectId: stateRef.projectId || null,
          status: stateRef.status,
          priority: stateRef.priority,
          assigneeId: stateRef.assigneeId || null,
          dueDate: stateRef.dueDate ? new Date(stateRef.dueDate).toISOString() : null,
        }
        if (isEdit) {
          store.updateTask(existing.id, payload)
          notify.success('Task updated', payload.title)
        } else {
          store.createTask(payload)
          notify.success('Task created', payload.title)
        }
        return true
      },
    },
    secondary: { label: 'Cancel' },
  })
}

async function removeTask(id) {
  const task = store.task(id)
  if (!task) return
  const confirmed = await confirmDialog({
    title: 'Delete task?',
    message: `Delete "${task.title}"? This cannot be undone.`,
    confirmLabel: 'Delete',
    variant: 'danger',
  })
  if (!confirmed) return
  store.deleteTask(id)
  notify.danger('Task deleted', task.title)
}

function field(label, control) {
  return el('div', { class: 'field' }, [el('label', {}, label), control])
}
