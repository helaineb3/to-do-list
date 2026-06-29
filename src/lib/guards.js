import { state } from '../app/state.js'
import { isDayClosed } from './helpers.js'
import { warnUser } from './errors.js'

export function requireUser() {
  if (state.user) return true
  warnUser('Sign in to continue.')
  return false
}

export function requireOpenDay() {
  if (!isDayClosed(state.selectedDate)) return true
  warnUser('This day is closed. Reopen it to make changes.')
  return false
}
