import { refreshAppData } from './refresh.js'
import { updateAuthUI } from '../ui/render-auth.js'
import { bindEvents } from '../ui/bind-events.js'
import { setupAuthListener } from './auth-listener.js'
import { ensureSession } from '../api/session.js'
import { runSafe } from '../lib/errors.js'

export async function init() {
  bindEvents()
  setupAuthListener()

  await runSafe('start app', async () => {
    const hasSession = await ensureSession()
    updateAuthUI()

    if (hasSession) {
      await refreshAppData()
    }
  })
}
