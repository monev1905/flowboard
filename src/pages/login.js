import { el } from '../utils/dom.js'
import { login, demoCreds } from '../services/auth.js'
import { navigate } from '../services/router.js'
import { notify } from '../components/toast.js'

export function renderLogin() {
  const form = el('form', { class: 'card auth-card', onSubmit: handleSubmit, novalidate: true }, [
    el('div', { class: 'brand' }, [
      el('span', { class: 'brand-mark' }, 'F'),
      el('span', {}, 'FlowBoard'),
    ]),
    el('div', { class: 'title' }, [
      el('h1', { style: { fontSize: '22px' } }, 'Welcome back'),
      el('p', { class: 'auth-hint' }, 'Sign in to manage your projects and team.'),
    ]),
    el('div', { class: 'field' }, [
      el('label', { for: 'email' }, 'Email'),
      el('input', {
        class: 'input',
        type: 'email',
        id: 'email',
        name: 'email',
        autocomplete: 'email',
        required: true,
        value: demoCreds.email,
      }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { for: 'password' }, 'Password'),
      el('input', {
        class: 'input',
        type: 'password',
        id: 'password',
        name: 'password',
        autocomplete: 'current-password',
        required: true,
        value: demoCreds.password,
      }),
    ]),
    el('label', { class: 'toggle' }, [
      el('input', { type: 'checkbox', name: 'remember', checked: true }),
      el('span', {}, 'Remember me on this device'),
    ]),
    el('div', { class: 'form-error', role: 'alert', style: { color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', minHeight: '18px' } }, ''),
    el('button', { class: 'btn btn-primary', type: 'submit' }, 'Sign in'),
    el('p', { class: 'auth-hint' }, [
      'Demo credentials: ',
      el('code', {}, `${demoCreds.email} / ${demoCreds.password}`),
    ]),
  ])

  return el('div', { class: 'auth-shell' }, form)
}

function handleSubmit(event) {
  event.preventDefault()
  const form = event.currentTarget
  const formData = new FormData(form)
  const errorBox = form.querySelector('.form-error')
  errorBox.textContent = ''
  const result = login({
    email: formData.get('email'),
    password: formData.get('password'),
    remember: formData.get('remember') === 'on',
  })
  if (!result.ok) {
    errorBox.textContent = result.error
    return
  }
  notify.success('Signed in', `Welcome back, ${result.session.name}.`)
  navigate('/')
}
