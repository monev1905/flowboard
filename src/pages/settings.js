import { el } from '../utils/dom.js'
import { getPreferences, updatePreferences } from '../services/theme.js'
import { getSession, logout, updateSession } from '../services/auth.js'
import { store } from '../services/store.js'
import { navigate } from '../services/router.js'
import { notify } from '../components/toast.js'
import { confirmDialog } from '../components/modal.js'

const THEME_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
]

export function renderSettings() {
  const prefs = getPreferences()
  const session = getSession()
  if (!session) return el('div', {}, '')

  const profile = {
    name: session.name,
    email: session.email,
    role: session.role,
  }

  return el('div', {}, [
    el('div', { class: 'page-header' }, [
      el('div', { class: 'title' }, [
        el('h1', {}, 'Settings'),
        el('p', { class: 'subtitle' }, 'Manage your profile, appearance, and notification preferences.'),
      ]),
    ]),

    el('section', { class: 'settings-form' }, [
      el('div', { class: 'card settings-section' }, [
        el('h2', {}, 'Appearance'),
        el('p', { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
          'Choose how FlowBoard looks on this device. "System" follows your operating system.'),
        el('div', { class: 'theme-select', role: 'radiogroup', 'aria-label': 'Theme preference' },
          THEME_OPTIONS.map((opt) =>
            el('button', {
              type: 'button',
              class: prefs.theme === opt.id ? 'active' : '',
              role: 'radio',
              'aria-checked': prefs.theme === opt.id ? 'true' : 'false',
              onClick: () => { updatePreferences({ theme: opt.id }); notify.info('Theme updated', opt.label) },
            }, opt.label)
          )
        ),
      ]),

      el('form', { class: 'card settings-section', onSubmit: (e) => handleProfileSave(e, profile) }, [
        el('h2', {}, 'Profile'),
        el('div', { class: 'field' }, [
          el('label', { for: 'set-name' }, 'Display name'),
          el('input', { id: 'set-name', name: 'name', class: 'input', value: profile.name }),
        ]),
        el('div', { class: 'field' }, [
          el('label', { for: 'set-email' }, 'Email'),
          el('input', { id: 'set-email', name: 'email', class: 'input', type: 'email', value: profile.email, readOnly: true }),
        ]),
        el('div', { class: 'field' }, [
          el('label', { for: 'set-role' }, 'Role'),
          el('input', { id: 'set-role', name: 'role', class: 'input', value: profile.role }),
        ]),
        el('div', { class: 'row' }, [
          el('button', { type: 'submit', class: 'btn btn-primary' }, 'Save profile'),
        ]),
      ]),

      el('div', { class: 'card settings-section' }, [
        el('h2', {}, 'Notifications'),
        toggleRow('taskCompleted', 'Task completed', prefs.notifications.taskCompleted),
        toggleRow('newAssignment', 'New task assigned to me', prefs.notifications.newAssignment),
        toggleRow('overdue', 'Tasks become overdue', prefs.notifications.overdue),
      ]),

      el('div', { class: 'card settings-section' }, [
        el('h2', {}, 'Workspace'),
        el('p', { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
          'Reset replaces local data with the original demo content. Sign out clears your session.'),
        el('div', { class: 'row' }, [
          el('button', { type: 'button', class: 'btn btn-ghost', onClick: handleReset }, 'Reset demo data'),
          el('button', { type: 'button', class: 'btn btn-danger', onClick: handleSignOut }, 'Sign out'),
        ]),
      ]),
    ]),
  ])
}

function toggleRow(key, label, checked) {
  return el('label', { class: 'row', style: { justifyContent: 'space-between' } }, [
    el('span', {}, label),
    el('label', { class: 'toggle' }, [
      el('input', {
        type: 'checkbox',
        checked,
        onChange: (e) => {
          const prefs = getPreferences()
          updatePreferences({ notifications: { ...prefs.notifications, [key]: e.target.checked } })
        },
      }),
    ]),
  ])
}

function handleProfileSave(event, profile) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  const name = (formData.get('name') || '').trim() || profile.name
  const role = (formData.get('role') || '').trim() || profile.role
  const session = getSession()
  if (!session) return
  updateSession({ name, role })
  notify.success('Profile saved', name)
  document.dispatchEvent(new CustomEvent('shell:rerender'))
}

async function handleReset() {
  const confirmed = await confirmDialog({
    title: 'Reset workspace?',
    message: 'This replaces all projects and tasks with the demo content. Your account stays signed in.',
    confirmLabel: 'Reset data',
    variant: 'danger',
  })
  if (!confirmed) return
  store.reset()
  notify.info('Workspace reset', 'Demo data has been restored.')
}

async function handleSignOut() {
  const confirmed = await confirmDialog({
    title: 'Sign out?',
    message: 'You will need to sign in again to use FlowBoard.',
    confirmLabel: 'Sign out',
  })
  if (!confirmed) return
  logout()
  navigate('/login')
}
