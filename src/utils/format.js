const dayMs = 1000 * 60 * 60 * 24

export function formatDate(value, options = {}) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', ...options })
}

export function formatRelative(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const diff = d.getTime() - Date.now()
  const days = Math.round(diff / dayMs)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (Math.abs(days) >= 1) return rtf.format(days, 'day')
  const hours = Math.round(diff / (1000 * 60 * 60))
  if (Math.abs(hours) >= 1) return rtf.format(hours, 'hour')
  const minutes = Math.round(diff / (1000 * 60))
  if (Math.abs(minutes) >= 1) return rtf.format(minutes, 'minute')
  return 'just now'
}

export function isOverdue(value) {
  if (!value) return false
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d.getTime() < today.getTime()
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`
}

export function debounce(fn, wait = 200) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
