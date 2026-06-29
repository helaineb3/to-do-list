import { state } from './state.js'
import { onAuthStateChange } from '../repositories/auth.js'
import { updateAuthUI } from '../ui/render-auth.js'
import { renderAll } from '../ui/render-all.js'
import { reportError } from '../lib/errors.js'
import { clearAppData, refreshAppData } from './refresh.js'

const SYNC_EVENTS = new Set(['SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'])

export function setupAuthListener() {
  onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') return
    if (!SYNC_EVENTS.has(event)) return

    try {
      state.user = session?.user ?? null
      updateAuthUI()

      if (state.user) {
        await refreshAppData()
        return
      }

      clearAppData()
      renderAll()
    } catch (error) {
      reportError('sync auth state', error)
    }
  })
}
