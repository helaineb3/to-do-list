import './style.css'
import { supabase } from './supabase.js'

let todos = []

const form = document.getElementById('todo-form')
const input = document.getElementById('todo-input')
const list = document.getElementById('todo-list')

function escapeHtml(text) {
  const el = document.createElement('div')
  el.textContent = text
  return el.innerHTML
}

function renderTodos() {
  list.innerHTML = todos
    .map((todo) => {
      const completeClass = todo.is_complete ? ' is-complete' : ''
      const completeLabel = todo.is_complete ? 'Mark incomplete' : 'Mark complete'
      const checkMark = todo.is_complete ? '✓' : ''

      return `
        <li class="todo-item${completeClass}" data-id="${todo.id}">
          <button
            type="button"
            class="todo-complete-button"
            aria-label="${completeLabel}"
            aria-pressed="${todo.is_complete}"
          >${checkMark}</button>
          <span class="todo-item-text">${escapeHtml(todo.text)}</span>
          <button type="button" class="todo-delete-button" aria-label="Delete todo">Del</button>
        </li>
      `
    })
    .join('')
}

async function loadTodos() {
  const { data, error } = await supabase
    .from('todos')
    .select('id, text, is_complete, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load todos:', error.message)
    return
  }

  todos = data
  renderTodos()
}

async function addTodo(text) {
  const { error } = await supabase
    .from('todos')
    .insert({ text, is_complete: false })

  if (error) {
    console.error('Failed to add todo:', error.message)
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
    return false
  }

  return true
}

async function deleteTodo(id) {
  const { error } = await supabase.from('todos').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete todo:', error.message)
    return false
  }

  return true
}

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
  const item = event.target.closest('.todo-item')
  if (!item) return

  const id = Number(item.dataset.id)

  if (event.target.closest('.todo-complete-button')) {
    const success = await toggleTodo(id)
    if (success) await loadTodos()
  } else if (event.target.closest('.todo-delete-button')) {
    const success = await deleteTodo(id)
    if (success) await loadTodos()
  }
})

loadTodos()
