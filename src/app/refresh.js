import { state } from './state.js'
import { getCalendarRange, normalizeDate } from '../lib/helpers.js'
import { showError, clearError } from '../lib/errors.js'
import { loadUserCategories, syncCategoriesFromTodos } from './load-categories.js'
import { renderAll } from '../ui/render-all.js'
import * as todosRepo from '../repositories/todos.js'
import * as reflectionsRepo from '../repositories/reflections.js'

export async function refreshAppData() {
  if (!state.user) return false

  const categoriesLoaded = await loadUserCategories()
  if (!categoriesLoaded) return false

  const { start, end } = getCalendarRange()

  const [todosResult, reflectionsResult] = await Promise.all([
    todosRepo.fetchTodosInRange(state.user.id, start, end),
    reflectionsRepo.fetchReflectionsInRange(state.user.id, start, end),
  ])

  if (todosResult.error) {
    console.error('Failed to load todos:', todosResult.error.message)
    showError(`Could not load todos: ${todosResult.error.message}`)
    return false
  }

  if (reflectionsResult.error) {
    console.error('Failed to load reflections:', reflectionsResult.error.message)
    showError(`Could not load reflections: ${reflectionsResult.error.message}`)
    return false
  }

  state.todos = todosResult.data.map((todo) => ({
    ...todo,
    day_date: normalizeDate(todo.day_date),
  }))
  state.dayReflections = {}
  for (const row of reflectionsResult.data) {
    state.dayReflections[normalizeDate(row.day_date)] = row
  }

  await syncCategoriesFromTodos()

  clearError()
  renderAll()
  return true
}

export function clearAppData() {
  state.todos = []
  state.dayReflections = {}
  state.userCategories = []
  state.editingCategoryId = null
  state.showCloseDayPanel = false
  state.recentlyCompletedId = null
}
