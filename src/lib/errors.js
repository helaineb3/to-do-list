import { ui } from './dom.js'

export function showError(message) {
  ui.errorEl.textContent = message
  ui.errorEl.hidden = false
}

export function clearError() {
  ui.errorEl.textContent = ''
  ui.errorEl.hidden = true
}

export function warnUser(message) {
  console.warn(message)
  showError(message)
}

export function reportError(action, error) {
  const detail = error?.message ?? (typeof error === 'string' ? error : 'Unknown error')
  console.error(`Failed to ${action}:`, detail)
  showError(`Could not ${action}: ${detail}`)
}

export async function runSafe(action, fn) {
  try {
    return await fn()
  } catch (error) {
    reportError(action, error)
    return false
  }
}

export function safeHandler(action, handler) {
  return async (...args) => {
    try {
      await handler(...args)
    } catch (error) {
      reportError(action, error)
    }
  }
}

// Auth flows use the same top banner.
export const showAuthError = showError
export const clearAuthError = clearError
