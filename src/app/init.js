import { refreshAppData } from '../app/refresh.js'
import { updateAuthUI } from '../ui/render-auth.js'
import { bindEvents } from '../ui/bind-events.js'
import { setupAuthListener } from './auth-listener.js'
import { ensureSession } from '../api/session.js'

export async function init() {
  bindEvents()
  setupAuthListener()

  const hasSession = await ensureSession()
  updateAuthUI()

  if (hasSession) {
    await refreshAppData()
  }
}
