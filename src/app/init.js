import { ensureSession } from '../api/session.js'
import { refreshAppData } from '../api/app-data.js'
import { updateAuthUI } from '../ui/render-auth.js'
import { bindEvents } from '../ui/bind-events.js'

export async function init() {
  bindEvents()

  const hasSession = await ensureSession()
  updateAuthUI()

  if (hasSession) {
    await refreshAppData()
  }
}
