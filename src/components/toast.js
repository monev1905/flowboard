import { el } from '../utils/dom.js'

let region
const queue = new Map()

function ensureRegion() {
  if (region) return region
  region = document.getElementById('toast-root') || document.body.appendChild(el('div', { id: 'toast-root' }))
  region.classList.add('toast-region')
  region.setAttribute('role', 'status')
  region.setAttribute('aria-live', 'polite')
  return region
}

export function toast({ title, body, variant = 'info', duration = 3500 } = {}) {
  ensureRegion()
  const id = Math.random().toString(36).slice(2)
  const node = el('div', { class: `toast toast-${variant}`, role: 'status' }, [
    title ? el('div', { class: 'toast-title' }, title) : null,
    body ? el('div', { class: 'toast-body' }, body) : null,
  ])
  region.appendChild(node)
  queue.set(id, node)
  const timer = setTimeout(() => dismiss(id), duration)
  node.addEventListener('click', () => { clearTimeout(timer); dismiss(id) })
  return id
}

function dismiss(id) {
  const node = queue.get(id)
  if (!node) return
  node.style.opacity = '0'
  node.style.transform = 'translateX(20px)'
  node.style.transition = 'opacity 180ms ease, transform 180ms ease'
  setTimeout(() => { node.remove(); queue.delete(id) }, 200)
}

export const notify = {
  success: (title, body) => toast({ title, body, variant: 'success' }),
  info: (title, body) => toast({ title, body, variant: 'info' }),
  warning: (title, body) => toast({ title, body, variant: 'warning' }),
  danger: (title, body) => toast({ title, body, variant: 'danger' }),
}
