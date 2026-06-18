import { el, delegate } from '../utils/dom.js'
import { store } from '../services/store.js'
import { formatDate, isOverdue, initials, debounce } from '../utils/format.js'
import { openModal, confirmDialog } from '../components/modal.js'
import { notify } from '../components/toast.js'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

const pageState = { search: '', status: 'all', includeArchived: false }

export function renderProjects() {
  const projects = store.projects({ includeArchived: pageState.includeArchived })
  const tasks = store.tasks()
  const members = store.members()

  const filtered = projects.filter((p) => {
    if (pageState.status !== 'all' && p.status !== pageState.status) return false
    if (pageState.search) {
      const q = pageState.search.toLowerCase()
      if (!(p.name + ' ' + p.description).toLowerCase().includes(q)) return false
    }
    return true
  })

  const onSearch = debounce((value) => { pageState.search = value; rerender() }, 150)

  const root = el('div', {}, [
    el('div', { class: 'page-header' }, [
      el('div', { class: 'title' }, [
        el('h1', {}, 'Projects'),
        el('p', { class: 'subtitle' }, `${projects.length} projects · ${tasks.length} tasks across the workspace`),
      ]),
      el('button', { class: 'btn btn-primary', type: 'button', onClick: () => openProjectModal() }, '+ New project'),
    ]),

    el('div', { class: 'toolbar card', style: { padding: 'var(--space-3)' } }, [
      el('input', {
        class: 'input grow',
        type: 'search',
        placeholder: 'Search projects…',
        value: pageState.search,
        'aria-label': 'Search projects',
        onInput: (e) => onSearch(e.target.value),
      }),
      el('select', {
        class: 'select',
        'aria-label': 'Filter by status',
        value: pageState.status,
        onChange: (e) => { pageState.status = e.target.value; rerender() },
      }, [
        el('option', { value: 'all' }, 'All statuses'),
        ...STATUS_OPTIONS.map((s) => el('option', { value: s.value }, s.label)),
      ]),
      el('label', { class: 'toggle' }, [
        el('input', {
          type: 'checkbox',
          checked: pageState.includeArchived,
          onChange: (e) => { pageState.includeArchived = e.target.checked; rerender() },
        }),
        el('span', {}, 'Show archived'),
      ]),
    ]),

    filtered.length
      ? el('div', { class: 'project-grid', style: { marginTop: 'var(--space-4)' } },
          filtered.map((p) => projectCard(p, tasks, members))
        )
      : el('div', { class: 'card empty', style: { marginTop: 'var(--space-4)' } }, [
          el('h3', {}, 'No projects match'),
          el('p', {}, 'Try adjusting the filters or create a new project.'),
        ]),
  ])

  delegate(root, '[data-action]', 'click', (event, target) => {
    const action = target.dataset.action
    const id = target.dataset.id
    if (action === 'edit') openProjectModal(store.project(id))
    if (action === 'archive') archiveProject(id)
    if (action === 'delete') removeProject(id)
  })

  return root
}

function projectCard(project, tasks, members) {
  const projectTasks = tasks.filter((t) => t.projectId === project.id)
  const total = projectTasks.length
  const completed = projectTasks.filter((t) => t.status === 'completed').length
  const progress = total ? Math.round((completed / total) * 100) : 0
  const assignedMembers = members.filter((m) => project.members.includes(m.id))
  const overdueClass = project.dueDate && project.status !== 'completed' && isOverdue(project.dueDate) ? 'badge-danger' : 'badge'

  return el('article', { class: 'card project-card' }, [
    el('header', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' } }, [
      el('h3', {}, project.name),
      el('span', { class: `badge badge-${statusVariant(project.status)}` }, formatStatus(project.status)),
    ]),
    el('p', { class: 'desc' }, project.description || 'No description provided.'),
    el('div', { class: 'progress' }, [
      el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } }, [
        el('span', {}, `${completed}/${total} tasks completed`),
        el('span', {}, `${progress}%`),
      ]),
      el('div', { class: 'progress-bar', role: 'progressbar', 'aria-valuenow': progress, 'aria-valuemin': 0, 'aria-valuemax': 100 }, [
        el('span', { style: { width: progress + '%' } }),
      ]),
    ]),
    el('div', { class: 'footer' }, [
      el('div', { class: 'avatar-stack' }, assignedMembers.length
        ? assignedMembers.slice(0, 4).map((m) => el('span', { class: 'avatar avatar-sm', title: m.name }, initials(m.name)))
        : [el('span', { style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } }, 'Unassigned')]
      ),
      el('span', { class: overdueClass }, project.dueDate ? 'Due ' + formatDate(project.dueDate) : 'No due date'),
    ]),
    el('div', { style: { display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' } }, [
      el('button', { class: 'btn btn-ghost btn-sm', type: 'button', dataset: { action: 'edit', id: project.id } }, 'Edit'),
      project.archived
        ? el('button', { class: 'btn btn-ghost btn-sm', type: 'button', dataset: { action: 'delete', id: project.id } }, 'Delete')
        : el('button', { class: 'btn btn-ghost btn-sm', type: 'button', dataset: { action: 'archive', id: project.id } }, 'Archive'),
      el('a', { class: 'btn btn-ghost btn-sm', href: `#/tasks?project=${project.id}` }, 'View tasks'),
    ]),
  ])
}

function statusVariant(status) {
  switch (status) {
    case 'active': return 'primary'
    case 'completed': return 'success'
    case 'on_hold': return 'warning'
    case 'archived': return 'info'
    default: return 'info'
  }
}

function formatStatus(status) {
  if (!status) return ''
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function rerender() {
  document.dispatchEvent(new CustomEvent('shell:rerender'))
}

function openProjectModal(existing) {
  const isEdit = !!existing
  const members = store.members()
  const stateRef = {
    name: existing?.name || '',
    description: existing?.description || '',
    status: existing?.status || 'active',
    dueDate: existing?.dueDate ? existing.dueDate.slice(0, 10) : '',
    members: new Set(existing?.members || []),
  }

  openModal({
    title: isEdit ? 'Edit project' : 'New project',
    body: () => el('form', {
      onSubmit: (e) => e.preventDefault(),
      style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
    }, [
      field('Name', el('input', {
        class: 'input', value: stateRef.name, required: true,
        onInput: (e) => stateRef.name = e.target.value,
      })),
      field('Description', el('textarea', {
        class: 'textarea',
        value: stateRef.description,
        onInput: (e) => stateRef.description = e.target.value,
      })),
      field('Status', el('select', {
        class: 'select', value: stateRef.status,
        onChange: (e) => stateRef.status = e.target.value,
      }, STATUS_OPTIONS.map((o) => el('option', { value: o.value, selected: o.value === stateRef.status }, o.label)))),
      field('Due date', el('input', {
        class: 'input', type: 'date', value: stateRef.dueDate,
        onChange: (e) => stateRef.dueDate = e.target.value,
      })),
      field('Team members', el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' } },
        members.map((m) =>
          el('label', { class: 'toggle', style: { background: 'var(--color-surface-2)', padding: '4px 8px', borderRadius: 'var(--radius-pill)' } }, [
            el('input', {
              type: 'checkbox',
              checked: stateRef.members.has(m.id),
              onChange: (e) => { if (e.target.checked) stateRef.members.add(m.id); else stateRef.members.delete(m.id) },
            }),
            el('span', {}, m.name),
          ])
        )
      )),
    ]),
    primary: {
      label: isEdit ? 'Save changes' : 'Create project',
      onClick: () => {
        if (!stateRef.name.trim()) { notify.warning('Name required', 'Please give your project a name.'); return false }
        const payload = {
          name: stateRef.name,
          description: stateRef.description,
          status: stateRef.status,
          dueDate: stateRef.dueDate ? new Date(stateRef.dueDate).toISOString() : null,
          members: [...stateRef.members],
        }
        if (isEdit) {
          store.updateProject(existing.id, payload)
          notify.success('Project updated', payload.name)
        } else {
          store.createProject(payload)
          notify.success('Project created', payload.name)
        }
        return true
      },
    },
    secondary: { label: 'Cancel' },
  })
}

async function archiveProject(id) {
  const project = store.project(id)
  if (!project) return
  const confirmed = await confirmDialog({
    title: 'Archive project?',
    message: `Archive "${project.name}"? You can restore it later by toggling "Show archived".`,
    confirmLabel: 'Archive',
  })
  if (!confirmed) return
  store.archiveProject(id)
  notify.info('Project archived', project.name)
}

async function removeProject(id) {
  const project = store.project(id)
  if (!project) return
  const confirmed = await confirmDialog({
    title: 'Delete project?',
    message: `Delete "${project.name}" and all of its tasks? This cannot be undone.`,
    confirmLabel: 'Delete',
    variant: 'danger',
  })
  if (!confirmed) return
  store.deleteProject(id)
  notify.danger('Project deleted', project.name)
}

function field(label, control) {
  return el('div', { class: 'field' }, [el('label', {}, label), control])
}
