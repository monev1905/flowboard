const listeners = new Set()

export function getRoute() {
  const hash = window.location.hash || '#/'
  const [path, queryString = ''] = hash.slice(1).split('?')
  const query = {}
  new URLSearchParams(queryString).forEach((value, key) => { query[key] = value })
  return { path: path || '/', query }
}

export function navigate(path, query) {
  let target = path
  if (query && Object.keys(query).length) {
    const qs = new URLSearchParams(query).toString()
    target += `?${qs}`
  }
  if (window.location.hash === `#${target}`) {
    notify()
  } else {
    window.location.hash = target
  }
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  const route = getRoute()
  listeners.forEach((fn) => fn(route))
}

window.addEventListener('hashchange', notify)
window.addEventListener('load', notify)
