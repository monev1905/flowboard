import { storage } from './storage.js'

const KEY = 'preferences'
const defaults = {
  theme: 'system',
  notifications: { taskCompleted: true, newAssignment: true, overdue: true },
}

let prefs = { ...defaults, ...(storage.get(KEY) || {}) }
const listeners = new Set()
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function effectiveTheme() {
  if (prefs.theme === 'dark') return 'dark'
  if (prefs.theme === 'light') return 'light'
  return mediaQuery.matches ? 'dark' : 'light'
}

function apply() {
  document.documentElement.dataset.theme = effectiveTheme()
}

mediaQuery.addEventListener('change', () => {
  if (prefs.theme === 'system') {
    apply()
    listeners.forEach((fn) => fn(prefs))
  }
})

apply()

export function getPreferences() { return prefs }
export function getEffectiveTheme() { return effectiveTheme() }

export function updatePreferences(patch) {
  prefs = { ...prefs, ...patch }
  storage.set(KEY, prefs)
  apply()
  listeners.forEach((fn) => fn(prefs))
}

export function setTheme(theme) {
  updatePreferences({ theme })
}

export function onPreferencesChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
