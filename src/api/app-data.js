import { state } from '../app/state.js'
import { nextSortOrderForDay } from '../lib/helpers.js'
import { reportError } from '../lib/errors.js'
import { requireOpenDay, requireUser } from '../lib/guards.js'
import { refreshAppData } from '../app/refresh.js'
import { ui } from '../lib/dom.js'
import * as todosRepo from '../repositories/todos.js'

export async function addTodo(text) {
  if (!requireUser() || !requireOpenDay()) return false

  const { error } = await todosRepo.insertTodo({
    userId: state.user.id,
    text,
    dayDate: state.selectedDate,
    sortOrder: nextSortOrderForDay(state.selectedDate),
  })

  if (error) {
    reportError('add todo', error)
    return false
  }

  return true
}

export async function toggleTodo(id) {
  if (!requireUser() || !requireOpenDay()) return false

  const todo = state.todos.find((t) => t.id === id)
  if (!todo) {
    reportError('update todo', 'Todo not found')
    return false
  }

  if (!todo.is_complete) state.recentlyCompletedId = id

  const { error } = await todosRepo.updateTodoComplete(id, !todo.is_complete)

  if (error) {
    reportError('update todo', error)
    return false
  }

  return true
}

export async function deleteTodo(id) {
  if (!requireUser() || !requireOpenDay()) return false

  const { error } = await todosRepo.deleteTodoById(id)

  if (error) {
    reportError('delete todo', error)
    return false
  }

  return true
}

export async function persistTodoOrderFromDom() {
  if (!requireUser() || !requireOpenDay()) return false

  const orderedIds = [...ui.list.querySelectorAll('.todo-item')].map((item) => Number(item.dataset.id))

  orderedIds.forEach((id, index) => {
    const todo = state.todos.find((t) => t.id === id)
    if (todo) todo.sort_order = index + 1
  })

  const results = await Promise.all(
    orderedIds.map((id, index) => todosRepo.updateTodoSortOrder(id, index + 1))
  )

  const failed = results.find((result) => result.error)
  if (failed?.error) {
    reportError('reorder todos', failed.error)
    await refreshAppData()
    return false
  }

  return true
}

export { refreshAppData } from '../app/refresh.js'
