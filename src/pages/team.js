import { el } from '../utils/dom.js'
import { store } from '../services/store.js'
import { initials, isOverdue } from '../utils/format.js'

export function renderTeam() {
  const members = store.members()
  const tasks = store.tasks()
  const projects = store.projects({ includeArchived: true })

  return el('div', {}, [
    el('div', { class: 'page-header' }, [
      el('div', { class: 'title' }, [
        el('h1', {}, 'Team'),
        el('p', { class: 'subtitle' }, `${members.length} members · workload at a glance`),
      ]),
    ]),
    el('section', { class: 'team-grid' },
      members.map((m) => renderMemberCard(m, tasks, projects))
    ),
  ])
}

function renderMemberCard(member, tasks, projects) {
  const memberTasks = tasks.filter((t) => t.assigneeId === member.id)
  const open = memberTasks.filter((t) => t.status !== 'completed')
  const overdue = open.filter((t) => isOverdue(t.dueDate)).length
  const completed = memberTasks.length - open.length
  const projectIds = new Set(memberTasks.map((t) => t.projectId))
  const projectCount = projects.filter((p) => projectIds.has(p.id)).length

  return el('article', { class: 'card team-card' }, [
    el('div', { class: 'team-card-head' }, [
      el('span', { class: 'avatar avatar-lg', style: { background: member.color + '22', color: member.color } }, initials(member.name)),
      el('div', {}, [
        el('div', { class: 'name' }, member.name),
        el('div', { class: 'role' }, member.role),
      ]),
    ]),
    el('div', { class: 'team-stats' }, [
      el('div', {}, [el('strong', {}, String(open.length)), 'Open']),
      el('div', {}, [el('strong', {}, String(completed)), 'Completed']),
      el('div', {}, [el('strong', { style: overdue ? { color: 'var(--color-danger)' } : null }, String(overdue)), 'Overdue']),
      el('div', {}, [el('strong', {}, String(projectCount)), 'Projects']),
    ]),
    el('div', { style: { display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' } }, [
      el('a', { class: 'btn btn-ghost btn-sm', href: `#/tasks?assignee=${member.id}` }, 'View tasks'),
    ]),
  ])
}
