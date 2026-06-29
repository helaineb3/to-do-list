import './style.css'
import { supabase } from './supabase.js'

let todos = []
let user = null
let editingCategoryId = null

const form = document.getElementById('todo-form')
const input = document.getElementById('todo-input')
const list = document.getElementById('todo-list')
const errorEl = document.getElementById('todo-error')
const authUserSection = document.getElementById('todo-auth-user')
const authEmailEl = document.getElementById('todo-auth-email')
const signOutButton = document.getElementById('todo-sign-out-button')
const authSection = document.getElementById('todo-auth-section')
const signInForm = document.getElementById('todo-sign-in-form')
const signUpForm = document.getElementById('todo-sign-up-form')
const signInTab = document.getElementById('todo-auth-tab-sign-in')
const signUpTab = document.getElementById('todo-auth-tab-sign-up')

const DELETE_ICON = `
  <svg class="todo-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M9 10v7" />
    <path d="M15 10v7" />
    <path d="M5 6l1 14h12l1-14" />
  </svg>
`

const CATEGORY_ICON = `
  <svg class="todo-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
    <path d="M4 7h7l2 2h9v10H4z" />
    <path d="M4 7V5h6l2 2" />
  </svg>
`

const STARTER_CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health']

const CATEGORY_CLASS_MAP = {
  work: 'todo-item-category--work',
  personal: 'todo-item-category--personal',
  shopping: 'todo-item-category--shopping',
  health: 'todo-item-category--health',
}

function getCategoryClass(category) {
  const slug = category.trim().toLowerCase()
  return CATEGORY_CLASS_MAP[slug] || 'todo-item-category--custom'
}

function renderCategoryBadge(category) {
  return `<span class="todo-item-category ${getCategoryClass(category)}">${escapeHtml(category)}</span>`
}

function showError(message) {
  errorEl.textContent = message
  errorEl.hidden = false
}

function clearError() {
  errorEl.textContent = ''
  errorEl.hidden = true
}

function escapeHtml(text) {
  const el = document.createElement('div')
  el.textContent = text
  return el.innerHTML
}

function isAnonymousUser(currentUser) {
  return currentUser?.is_anonymous === true || !currentUser?.email
}

function updateAuthUI() {
  const isEmailUser = user && !isAnonymousUser(user)

  authUserSection.hidden = !isEmailUser
  authSection.hidden = isEmailUser

  if (isEmailUser) {
    authEmailEl.textContent = user.email
  }
}

function showAuthTab(tab) {
  const isSignIn = tab === 'sign-in'
  signInTab.classList.toggle('is-active', isSignIn)
  signUpTab.classList.toggle('is-active', !isSignIn)
  signInForm.hidden = !isSignIn
  signUpForm.hidden = isSignIn
}

function renderCategoryOptions(todo) {
  return STARTER_CATEGORIES.map((category) => {
    const isActive = todo.category === category
    const categoryClass = getCategoryClass(category)
    return `
      <button
        type="button"
        class="todo-category-option ${categoryClass}${isActive ? ' is-active' : ''}"
        data-category-value="${escapeHtml(category)}"
      >${escapeHtml(category)}</button>
    `
  }).join('')
}

function renderTodos() {
  list.innerHTML = todos
    .map((todo) => {
      const completeClass = todo.is_complete ? ' is-complete' : ''
      const completeLabel = todo.is_complete ? 'Mark incomplete' : 'Mark complete'
      const checkMark = todo.is_complete ? '✓' : ''
      const isEditingCategory = editingCategoryId === todo.id

      const categoryMarkup = todo.category ? renderCategoryBadge(todo.category) : ''

      const categoryPopover = isEditingCategory
        ? `
          <div class="todo-category-popover" role="dialog" aria-label="Choose category">
            <p class="todo-category-popover-label">Category</p>
            <div class="todo-category-options">${renderCategoryOptions(todo)}</div>
            <input
              type="text"
              class="todo-category-input"
              data-category-input="${todo.id}"
              value="${escapeHtml(todo.category || '')}"
              placeholder="Custom category"
              aria-label="Custom category"
            />
            ${todo.category ? `<button type="button" class="todo-category-remove">Remove category</button>` : ''}
          </div>
        `
        : ''

      return `
        <li class="todo-item${completeClass}" data-id="${todo.id}">
          <button
            type="button"
            class="todo-complete-button"
            aria-label="${completeLabel}"
            aria-pressed="${todo.is_complete}"
          >${checkMark}</button>
          <div class="todo-item-content">
            ${categoryMarkup}
            <span class="todo-item-text">${escapeHtml(todo.text)}</span>
          </div>
          <div class="todo-item-actions">
            <div class="todo-category-anchor">
              <button
                type="button"
                class="todo-icon-button todo-category-button"
                aria-label="${todo.category ? 'Edit category' : 'Add category'}"
                aria-expanded="${isEditingCategory}"
              >${CATEGORY_ICON}</button>
              ${categoryPopover}
            </div>
            <button type="button" class="todo-icon-button todo-delete-button" aria-label="Delete todo">${DELETE_ICON}</button>
          </div>
        </li>
      `
    })
    .join('')

  if (editingCategoryId) {
    const categoryInput = list.querySelector(`[data-category-input="${editingCategoryId}"]`)
    if (categoryInput) categoryInput.focus()
  }
}

async function ensureSession() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Failed to get session:', error.message)
    showError(`Could not get session: ${error.message}`)
    return false
  }

  if (session) {
    user = session.user
    return true
  }

  const { data, error: signInError } = await supabase.auth.signInAnonymously()

  if (signInError) {
    console.error('Failed to sign in anonymously:', signInError.message)
    showError(`Could not sign in: ${signInError.message}`)
    return false
  }

  user = data.user
  return true
}

async function loadTodos() {
  if (!user) return false

  const { data, error } = await supabase
    .from('todos')
    .select('id, text, is_complete, category, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load todos:', error.message)
    showError(`Could not load todos: ${error.message}`)
    return false
  }

  todos = data
  clearError()
  renderTodos()
  return true
}

async function addTodo(text) {
  const { error } = await supabase
    .from('todos')
    .insert({ text, is_complete: false, user_id: user.id })

  if (error) {
    console.error('Failed to add todo:', error.message)
    showError(`Could not add todo: ${error.message}`)
    return false
  }

  return true
}

async function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id)
  if (!todo) return false

  const { error } = await supabase
    .from('todos')
    .update({ is_complete: !todo.is_complete })
    .eq('id', id)

  if (error) {
    console.error('Failed to update todo:', error.message)
    showError(`Could not update todo: ${error.message}`)
    return false
  }

  return true
}

async function deleteTodo(id) {
  const { error } = await supabase.from('todos').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete todo:', error.message)
    showError(`Could not delete todo: ${error.message}`)
    return false
  }

  return true
}

async function saveCategory(id, category) {
  const trimmed = category.trim()
  const { error } = await supabase
    .from('todos')
    .update({ category: trimmed || null })
    .eq('id', id)

  if (error) {
    console.error('Failed to update category:', error.message)
    showError(`Could not save category: ${error.message}`)
    return false
  }

  editingCategoryId = null
  await loadTodos()
  return true
}

function closeCategoryPopover() {
  editingCategoryId = null
  renderTodos()
}

function startEditingCategory(id) {
  if (editingCategoryId === id) {
    closeCategoryPopover()
    return
  }

  editingCategoryId = id
  renderTodos()
}

async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Failed to sign in:', error.message)
    showError(`Could not sign in: ${error.message}`)
    return false
  }

  user = data.user
  updateAuthUI()
  await loadTodos()
  return true
}

async function signUpWithEmail(email, password) {
  if (isAnonymousUser(user)) {
    const { data, error } = await supabase.auth.updateUser({ email, password })

    if (error) {
      console.error('Failed to create account:', error.message)
      showError(`Could not create account: ${error.message}`)
      return false
    }

    user = data.user
    updateAuthUI()
    await loadTodos()

    if (isAnonymousUser(user)) {
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
    user = data.user
    updateAuthUI()
    await loadTodos()
    return true
  }

  showError('Check your email to confirm your account, then sign in.')
  return false
}

async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Failed to sign out:', error.message)
    showError(`Could not sign out: ${error.message}`)
    return false
  }

  const hasSession = await ensureSession()
  if (!hasSession) return false

  updateAuthUI()
  await loadTodos()
  return true
}

signInTab.addEventListener('click', () => showAuthTab('sign-in'))
signUpTab.addEventListener('click', () => showAuthTab('sign-up'))

signInForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const email = document.getElementById('todo-sign-in-email').value.trim()
  const password = document.getElementById('todo-sign-in-password').value

  const success = await signInWithEmail(email, password)
  if (success) signInForm.reset()
})

signUpForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const email = document.getElementById('todo-sign-up-email').value.trim()
  const password = document.getElementById('todo-sign-up-password').value

  const success = await signUpWithEmail(email, password)
  if (success) signUpForm.reset()
})

signOutButton.addEventListener('click', () => {
  signOut()
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const text = input.value.trim()
  if (!text) return

  const success = await addTodo(text)
  if (!success) return

  input.value = ''
  await loadTodos()
  input.focus()
})

list.addEventListener('click', async (event) => {
  if (event.target.closest('.todo-category-popover')) {
    const item = event.target.closest('.todo-item')
    const id = Number(item.dataset.id)

    if (event.target.closest('.todo-category-remove')) {
      await saveCategory(id, '')
      return
    }

    if (event.target.closest('.todo-category-option')) {
      const option = event.target.closest('.todo-category-option')
      await saveCategory(id, option.dataset.categoryValue)
    }
    return
  }

  const item = event.target.closest('.todo-item')
  if (!item) return

  const id = Number(item.dataset.id)

  if (event.target.closest('.todo-complete-button')) {
    const success = await toggleTodo(id)
    if (success) await loadTodos()
  } else if (event.target.closest('.todo-category-button')) {
    startEditingCategory(id)
  } else if (event.target.closest('.todo-delete-button')) {
    const success = await deleteTodo(id)
    if (success) await loadTodos()
  }
})

list.addEventListener('keydown', async (event) => {
  if (event.key !== 'Enter') return

  const input = event.target.closest('[data-category-input]')
  if (!input) return

  event.preventDefault()
  const id = Number(input.dataset.categoryInput)
  await saveCategory(id, input.value)
})

document.addEventListener('click', (event) => {
  if (!editingCategoryId) return
  if (event.target.closest('.todo-category-popover') || event.target.closest('.todo-category-button')) return
  closeCategoryPopover()
})

async function init() {
  const hasSession = await ensureSession()
  if (!hasSession) return

  updateAuthUI()
  await loadTodos()
}

init()
