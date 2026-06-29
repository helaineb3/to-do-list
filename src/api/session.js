import { supabase } from '../supabase.js'
import { state } from '../app/state.js'
import { showError } from '../lib/errors.js'

export async function ensureSession() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Failed to get session:', error.message)
    showError(`Could not get session: ${error.message}`)
    return false
  }

  if (session) {
    state.user = session.user
    return true
  }

  const { data, error: signInError } = await supabase.auth.signInAnonymously()

  if (signInError) {
    console.error('Failed to sign in anonymously:', signInError.message)
    showError(`Could not sign in: ${signInError.message}`)
    return false
  }

  state.user = data.user
  return true
}
