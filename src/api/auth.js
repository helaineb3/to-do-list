import { supabase } from '../supabase.js'
import { state } from '../app/state.js'
import { isAnonymousUser } from '../lib/helpers.js'
import { showError } from '../lib/errors.js'
import { refreshAppData } from './app-data.js'
import { updateAuthUI } from '../ui/render-auth.js'

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Failed to sign in:', error.message)
    showError(`Could not sign in: ${error.message}`)
    return false
  }

  state.user = data.user
  updateAuthUI()
  await refreshAppData()
  return true
}

export async function signUpWithEmail(email, password) {
  if (isAnonymousUser(state.user)) {
    const { data, error } = await supabase.auth.updateUser({ email, password })

    if (error) {
      console.error('Failed to create account:', error.message)
      showError(`Could not create account: ${error.message}`)
      return false
    }

    state.user = data.user
    updateAuthUI()
    await refreshAppData()

    if (isAnonymousUser(state.user)) {
      showError('Check your email to confirm your account.')
      return false
    }

    return true
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    console.error('Failed to sign up:', error.message)
    showError(`Could not create account: ${error.message}`)
    return false
  }

  if (data.session) {
    state.user = data.user
    updateAuthUI()
    await refreshAppData()
    return true
  }

  showError('Check your email to confirm your account, then sign in.')
  return false
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Failed to sign out:', error.message)
    showError(`Could not sign out: ${error.message}`)
    return false
  }

  const { ensureSession } = await import('./session.js')
  const hasSession = await ensureSession()
  if (!hasSession) return false

  updateAuthUI()
  await refreshAppData()
  return true
}
