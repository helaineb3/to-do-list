import { state } from '../app/state.js'
import { reportError } from '../lib/errors.js'
import * as authRepo from '../repositories/auth.js'

export async function ensureSession() {
  const { data: { session }, error } = await authRepo.getSession()

  if (error) {
    reportError('get session', error)
    return false
  }

  if (session) {
    state.user = session.user
    return true
  }

  const { data, error: signInError } = await authRepo.signInAnonymously()

  if (signInError) {
    reportError('sign in', signInError)
    return false
  }

  state.user = data.user
  return true
}
