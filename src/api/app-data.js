import { state } from '../app/state.js'
import { isDayClosed, nextSortOrderForDay } from '../lib/helpers.js'
import { showError } from '../lib/errors.js'
import { refreshAppData } from '../app/refresh.js'
import { ui } from '../lib/dom.js'
import * as todosRepo from '../repositories/todos.js'

export async function addTodo(text) {
  if (isDayClosed(state.selectedDate)) return false

  const { error } = await todosRepo.insertTodo({
    userId: state.user.id,
    text,
    dayDate: state.selectedDate,
    sortOrder: nextSortOrderForDay(state.selectedDate),
  })

  if (error) {
    console.error('Failed to add todo:', error.message)
    showError(`Could not add todo: ${error.message}`)
    return false
  }

  return true
}

export async function toggleTodo(id) {
  if (isDayClosed(state.selectedDate)) return false
  const todo = state.todos.find((t) => t.id === id)
  if (!todo) return false

  if (!todo.is_complete) state.recentlyCompletedId = id

  const { error } = await todosRepo.updateTodoComplete(id, !todo.is_complete)

  if (error) {
    console.error('Failed to update todo:', error.message)
    showError(`Could not update todo: ${error.message}`)
    return false
  }

  return true
}

export async function deleteTodo(id) {
  if (isDayClosed(state.selectedDate)) return false

  const { error } = await todosRepo.deleteTodoById(id)

  if (error) {
    console.error('Failed to delete todo:', error.message)
    showError(`Could not delete todo: ${error.message}`)
    return false
  }

  return true
}

export async function persistTodoOrderFromDom() {
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
    console.error('Failed to reorder todos:', failed.error.message)
    showError(`Could not reorder todos: ${failed.error.message}`)
    await refreshAppData()
    return false
  }

  return true
}

export { refreshAppData } from '../app/refresh.js'
