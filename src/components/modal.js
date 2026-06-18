import { el } from '../utils/dom.js'

let activeModal = null

export function openModal({ title, body, primary, secondary, onClose } = {}) {
  closeModal()
  const root = document.getElementById('modal-root') || document.body

  const close = (result) => {
    if (!activeModal) return
    activeModal.backdrop.remove()
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKey)
    activeModal = null
    onClose?.(result)
  }

  const onKey = (e) => {
    if (e.key === 'Escape') close(null)
  }

  const footerButtons = []
  if (secondary) {
    footerButtons.push(el('button', {
      type: 'button',
      class: 'btn btn-ghost',
      onClick: () => { secondary.onClick?.(); if (secondary.closeOnClick !== false) close(null) },
    }, secondary.label || 'Cancel'))
  }
  if (primary) {
    footerButtons.push(el('button', {
      type: 'button',
      class: `btn ${primary.variant === 'danger' ? 'btn-danger' : 'btn-primary'}`,
      onClick: () => { const result = primary.onClick?.(); if (primary.closeOnClick !== false && result !== false) close(result ?? true) },
    }, primary.label || 'Confirm'))
  }

  const modal = el('div', {
    class: 'modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'modal-title',
  }, [
    el('header', { class: 'modal-header' }, [
      el('h2', { id: 'modal-title' }, title || ''),
      el('button', {
        type: 'button',
        class: 'btn-icon',
        'aria-label': 'Close dialog',
        onClick: () => close(null),
      }, '✕'),
    ]),
    el('div', { class: 'modal-body' }, body ? (typeof body === 'function' ? body({ close }) : body) : null),
    footerButtons.length ? el('footer', { class: 'modal-footer' }, footerButtons) : null,
  ])

  const backdrop = el('div', {
    class: 'modal-backdrop',
    onClick: (e) => { if (e.target === backdrop) close(null) },
  }, modal)

  root.appendChild(backdrop)
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKey)

  activeModal = { backdrop, modal, close }

  setTimeout(() => {
    const firstFocus = modal.querySelector('input, select, textarea, button:not([aria-label="Close dialog"])')
    firstFocus?.focus()
  }, 30)

  return { close }
}

export function closeModal() {
  if (activeModal) activeModal.close(null)
}

export function confirmDialog({ title, message, confirmLabel = 'Confirm', variant = 'primary' } = {}) {
  return new Promise((resolve) => {
    openModal({
      title,
      body: el('p', {}, message),
      primary: {
        label: confirmLabel,
        variant,
        onClick: () => { resolve(true); return true },
      },
      secondary: { label: 'Cancel', onClick: () => resolve(false) },
      onClose: (result) => { if (result == null) resolve(false) },
    })
  })
}
