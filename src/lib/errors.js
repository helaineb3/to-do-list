import { ui } from './dom.js'

export function showError(message) {
  ui.errorEl.textContent = message
  ui.errorEl.hidden = false
}

export function clearError() {
  ui.errorEl.textContent = ''
  ui.errorEl.hidden = true
}
