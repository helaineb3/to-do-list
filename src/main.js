import './style.css'

const todos = []
let nextId = 1

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
      const completeClass = todo.complete ? ' is-complete' : ''
      const completeLabel = todo.complete ? 'Mark incomplete' : 'Mark complete'
      const checkMark = todo.complete ? '✓' : ''

      return `
        <li class="todo-item${completeClass}" data-id="${todo.id}">
          <button
            type="button"
            class="todo-complete-button"
            aria-label="${completeLabel}"
            aria-pressed="${todo.complete}"
          >${checkMark}</button>
          <span class="todo-item-text">${escapeHtml(todo.text)}</span>
          <button type="button" class="todo-delete-button" aria-label="Delete todo">Del</button>
        </li>
      `
    })
    .join('')
}

function addTodo(text) {
  todos.push({ id: nextId++, text, complete: false })
  renderTodos()
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id)
  if (todo) {
    todo.complete = !todo.complete
    renderTodos()
  }
}

function deleteTodo(id) {
  const index = todos.findIndex((t) => t.id === id)
  if (index !== -1) {
    todos.splice(index, 1)
    renderTodos()
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const text = input.value.trim()
  if (!text) return
  addTodo(text)
  input.value = ''
  input.focus()
})

list.addEventListener('click', (event) => {
  const item = event.target.closest('.todo-item')
  if (!item) return

  const id = Number(item.dataset.id)

  if (event.target.closest('.todo-complete-button')) {
    toggleTodo(id)
  } else if (event.target.closest('.todo-delete-button')) {
    deleteTodo(id)
  }
})

renderTodos()
