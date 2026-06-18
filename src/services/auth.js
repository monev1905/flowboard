import { storage } from './storage.js'

const SESSION_KEY = 'session'

const DEMO_USERS = [
  { email: 'demo@flowboard.app', password: 'demo1234', name: 'Ava Reyes', role: 'Product Manager', memberId: 'm1' },
  { email: 'admin@flowboard.app', password: 'admin1234', name: 'Admin User', role: 'Workspace Admin', memberId: 'm1' },
]

const listeners = new Set()

function emit() {
  const session = getSession()
  listeners.forEach((fn) => fn(session))
}

export function getSession() {
  return storage.get(SESSION_KEY)
}

export function isAuthenticated() {
  return !!getSession()
}

export function login({ email, password, remember = true }) {
  const normalized = (email || '').trim().toLowerCase()
  const user = DEMO_USERS.find((u) => u.email === normalized && u.password === password)
  if (!user) {
    return { ok: false, error: 'Invalid email or password.' }
  }
  const session = {
    email: user.email,
    name: user.name,
    role: user.role,
    memberId: user.memberId,
    startedAt: new Date().toISOString(),
    remember,
  }
  storage.set(SESSION_KEY, session)
  emit()
  return { ok: true, session }
}

export function logout() {
  storage.remove(SESSION_KEY)
  emit()
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const demoCreds = DEMO_USERS[0]
