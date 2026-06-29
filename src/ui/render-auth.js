import { state } from '../app/state.js'
import { ui } from '../lib/dom.js'
import { isAnonymousUser } from '../lib/helpers.js'

export function updateAuthUI() {
  const isEmailUser = state.user && !isAnonymousUser(state.user)

  ui.authUserSection.hidden = !isEmailUser
  ui.authSection.hidden = isEmailUser

  if (isEmailUser) {
    ui.authEmailEl.textContent = state.user.email
  }
}

export function showAuthTab(tab) {
  const isSignIn = tab === 'sign-in'
  ui.signInTab.classList.toggle('is-active', isSignIn)
  ui.signUpTab.classList.toggle('is-active', !isSignIn)
  ui.signInForm.hidden = !isSignIn
  ui.signUpForm.hidden = isSignIn
}
