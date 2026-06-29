import { state } from './state.js'
import { getCalendarRange, normalizeDate } from '../lib/helpers.js'
import { clearError, reportError } from '../lib/errors.js'
import { loadUserCategories, syncCategoriesFromTodos } from './load-categories.js'
import { renderAll } from '../ui/render-all.js'
import * as todosRepo from '../repositories/todos.js'
import * as reflectionsRepo from '../repositories/reflections.js'

export async function refreshAppData() {
  if (!state.user) return false

  try {
    const categoriesLoaded = await loadUserCategories()
    if (!categoriesLoaded) return false

    const { start, end } = getCalendarRange()

    const [todosResult, reflectionsResult] = await Promise.all([
      todosRepo.fetchTodosInRange(state.user.id, start, end),
      reflectionsRepo.fetchReflectionsInRange(state.user.id, start, end),
    ])

    if (todosResult.error) {
      reportError('load todos', todosResult.error)
      return false
    }

    if (reflectionsResult.error) {
      reportError('load reflections', reflectionsResult.error)
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

    const categoriesSynced = await syncCategoriesFromTodos()
    if (!categoriesSynced) return false

    clearError()
    renderAll()
    return true
  } catch (error) {
    reportError('load app data', error)
    return false
  }
}

export function clearAppData() {
  state.todos = []
  state.dayReflections = {}
  state.userCategories = []
  state.editingCategoryId = null
  state.showCloseDayPanel = false
  state.recentlyCompletedId = null
}
