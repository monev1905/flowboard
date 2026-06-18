import { el } from '../utils/dom.js'

export function renderDashboard() {
  return el('div', {}, [el('div', { class: 'page-header' }, [el('div', { class: 'title' }, [el('h1', {}, 'Dashboard')])])])
}
