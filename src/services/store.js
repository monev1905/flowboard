import { storage } from './storage.js'
import { seed } from '../data/seed.js'
import { uid } from '../utils/format.js'

const STATE_KEY = 'state'
const SCHEMA_VERSION = 1

const listeners = new Set()
let state = load()

function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    members: structuredClone(seed.members),
    projects: structuredClone(seed.projects),
    tasks: structuredClone(seed.tasks),
    activity: structuredClone(seed.activity),
  }
}

function load() {
  const raw = storage.get(STATE_KEY)
  if (!raw || raw.schemaVersion !== SCHEMA_VERSION) {
    const fresh = defaultState()
    storage.set(STATE_KEY, fresh)
    return fresh
  }
  return raw
}

function persist() {
  storage.set(STATE_KEY, state)
}

function emit(event = 'change', payload = null) {
  listeners.forEach((fn) => {
    try { fn(event, payload, state) } catch (err) { console.error(err) }
  })
}

function logActivity(type, message) {
  const entry = { id: uid('a'), type, message, ts: new Date().toISOString() }
  state.activity = [entry, ...state.activity].slice(0, 50)
  return entry
}

export const store = {
  getState() { return state },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },

  reset() {
    state = defaultState()
    persist()
    emit('reset')
  },

  // Members
  members() { return state.members },
  member(id) { return state.members.find((m) => m.id === id) },

  // Projects
  projects({ includeArchived = false } = {}) {
    return state.projects.filter((p) => includeArchived || !p.archived)
  },
  project(id) { return state.projects.find((p) => p.id === id) },
  createProject(input) {
    const project = {
      id: uid('p'),
      name: input.name?.trim() || 'Untitled project',
      description: input.description?.trim() || '',
      status: input.status || 'active',
      dueDate: input.dueDate || null,
      members: Array.isArray(input.members) ? input.members : [],
      archived: false,
      createdAt: new Date().toISOString(),
    }
    state.projects = [project, ...state.projects]
    logActivity('project_created', `Created project "${project.name}"`)
    persist()
    emit('project_created', project)
    return project
  },
  updateProject(id, patch) {
    const idx = state.projects.findIndex((p) => p.id === id)
    if (idx < 0) return null
    const prev = state.projects[idx]
    const next = { ...prev, ...patch }
    state.projects = [...state.projects.slice(0, idx), next, ...state.projects.slice(idx + 1)]
    logActivity('project_updated', `Updated project "${next.name}"`)
    persist()
    emit('project_updated', next)
    return next
  },
  archiveProject(id) {
    return this.updateProject(id, { archived: true, status: 'archived' })
  },
  deleteProject(id) {
    const project = this.project(id)
    if (!project) return false
    state.projects = state.projects.filter((p) => p.id !== id)
    state.tasks = state.tasks.filter((t) => t.projectId !== id)
    logActivity('project_deleted', `Deleted project "${project.name}"`)
    persist()
    emit('project_deleted', project)
    return true
  },

  // Tasks
  tasks(filter = {}) {
    let list = state.tasks
    if (filter.projectId) list = list.filter((t) => t.projectId === filter.projectId)
    if (filter.assigneeId) list = list.filter((t) => t.assigneeId === filter.assigneeId)
    if (filter.status) list = list.filter((t) => t.status === filter.status)
    return list
  },
  task(id) { return state.tasks.find((t) => t.id === id) },
  createTask(input) {
    const task = {
      id: uid('t'),
      title: input.title?.trim() || 'Untitled task',
      description: input.description?.trim() || '',
      projectId: input.projectId || state.projects[0]?.id,
      status: input.status || 'backlog',
      priority: input.priority || 'medium',
      assigneeId: input.assigneeId || null,
      dueDate: input.dueDate || null,
      createdAt: new Date().toISOString(),
    }
    state.tasks = [task, ...state.tasks]
    logActivity('task_created', `Created task "${task.title}"`)
    persist()
    emit('task_created', task)
    return task
  },
  updateTask(id, patch) {
    const idx = state.tasks.findIndex((t) => t.id === id)
    if (idx < 0) return null
    const prev = state.tasks[idx]
    const next = { ...prev, ...patch }
    state.tasks = [...state.tasks.slice(0, idx), next, ...state.tasks.slice(idx + 1)]
    if (patch.status === 'completed' && prev.status !== 'completed') {
      logActivity('task_completed', `Completed task "${next.title}"`)
    } else if (patch.status && patch.status !== prev.status) {
      logActivity('task_updated', `Moved "${next.title}" to ${next.status.replace('_', ' ')}`)
    } else {
      logActivity('task_updated', `Updated task "${next.title}"`)
    }
    persist()
    emit('task_updated', { task: next, prev })
    return next
  },
  setTaskStatus(id, status) {
    return this.updateTask(id, { status })
  },
  deleteTask(id) {
    const task = this.task(id)
    if (!task) return false
    state.tasks = state.tasks.filter((t) => t.id !== id)
    logActivity('task_deleted', `Deleted task "${task.title}"`)
    persist()
    emit('task_deleted', task)
    return true
  },

  // Activity
  activity() { return state.activity },
}
