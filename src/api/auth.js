import { state } from '../app/state.js'
import { isAnonymousUser } from '../lib/helpers.js'
import { reportError, warnUser, showAuthError, clearAuthError } from '../lib/errors.js'
import { getSignInErrorMessage, getSignUpErrorMessage } from '../lib/auth-errors.js'
import { refreshAppData } from '../app/refresh.js'
import { updateAuthUI } from '../ui/render-auth.js'
import { ensureSession } from './session.js'
import * as authRepo from '../repositories/auth.js'

export async function signInWithEmail(email, password) {
  clearAuthError()

  if (!email || !password) {
    warnUser('Enter your email and password.')
    return false
  }

  const { data, error } = await authRepo.signInWithPassword(email, password)

  if (error) {
    console.error('Failed to sign in:', error.message)
    showAuthError(getSignInErrorMessage(error))
    return false
  }

  clearAuthError()
  state.user = data.user
  updateAuthUI()
  await refreshAppData()
  return true
}

export async function signUpWithEmail(email, password) {
  clearAuthError()

  if (!email || !password) {
    warnUser('Enter your email and password.')
    return false
  }

  if (isAnonymousUser(state.user)) {
    const { data, error } = await authRepo.updateUser({ email, password })

    if (error) {
      console.error('Failed to create account:', error.message)
      showAuthError(getSignUpErrorMessage(error))
      return false
    }

    state.user = data.user
    updateAuthUI()
    await refreshAppData()

    if (isAnonymousUser(state.user)) {
      warnUser('Check your email to confirm your account.')
      return false
    }

    clearAuthError()
    return true
  }

  const { data, error } = await authRepo.signUp({ email, password })

  if (error) {
    console.error('Failed to sign up:', error.message)
    showAuthError(getSignUpErrorMessage(error))
    return false
  }

  if (data.session) {
    clearAuthError()
    state.user = data.user
    updateAuthUI()
    await refreshAppData()
    return true
  }

  warnUser('Check your email to confirm your account, then sign in.')
  return false
}

export async function signOut() {
  const { error } = await authRepo.signOut()

  if (error) {
    reportError('sign out', error)
    return false
  }

  const hasSession = await ensureSession()
  if (!hasSession) return false

  updateAuthUI()
  await refreshAppData()
  return true
}
