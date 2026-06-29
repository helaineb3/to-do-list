import { ui } from '../lib/dom.js'
import { signInWithEmail, signOut, signUpWithEmail } from '../api/auth.js'
import { showAuthTab } from './render-auth.js'

export function bindAuthEvents() {
  ui.signInTab.addEventListener('click', () => showAuthTab('sign-in'))
  ui.signUpTab.addEventListener('click', () => showAuthTab('sign-up'))

  ui.signInForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = document.getElementById('todo-sign-in-email').value.trim()
    const password = document.getElementById('todo-sign-in-password').value

    const success = await signInWithEmail(email, password)
    if (success) ui.signInForm.reset()
  })

  ui.signUpForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = document.getElementById('todo-sign-up-email').value.trim()
    const password = document.getElementById('todo-sign-up-password').value

    const success = await signUpWithEmail(email, password)
    if (success) ui.signUpForm.reset()
  })

  ui.signOutButton.addEventListener('click', () => {
    signOut()
  })
}
