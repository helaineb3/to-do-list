import { supabase } from '../supabase.js'
import { state } from '../app/state.js'
import {
  getCalendarRange,
  isDayClosed,
  nextSortOrderForDay,
  normalizeDate,
} from '../lib/helpers.js'
import { showError, clearError } from '../lib/errors.js'
import { loadUserCategories, syncCategoriesFromTodos } from './categories.js'
import { renderAll } from '../ui/render-all.js'
import { updateAuthUI } from '../ui/render-auth.js'
import { ui } from '../lib/dom.js'

export async function refreshAppData() {
  if (!state.user) return false

  const categoriesLoaded = await loadUserCategories()
  if (!categoriesLoaded) return false

  const { start, end } = getCalendarRange()

  const [todosResult, reflectionsResult] = await Promise.all([
    supabase
      .from('todos')
      .select('id, text, is_complete, category, day_date, sort_order, created_at')
      .eq('user_id', state.user.id)
      .gte('day_date', start)
      .lte('day_date', end)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('day_reflections')
      .select('day_date, reflection, closed_at')
      .eq('user_id', state.user.id)
      .gte('day_date', start)
      .lte('day_date', end),
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

export async function addTodo(text) {
  if (isDayClosed(state.selectedDate)) return false

  const { error } = await supabase
    .from('todos')
    .insert({
      text,
      is_complete: false,
      user_id: state.user.id,
      day_date: state.selectedDate,
      sort_order: nextSortOrderForDay(state.selectedDate),
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

export async function deleteTodo(id) {
  if (isDayClosed(state.selectedDate)) return false
  const { error } = await supabase.from('todos').delete().eq('id', id)

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
    orderedIds.map((id, index) =>
      supabase.from('todos').update({ sort_order: index + 1 }).eq('id', id)
    )
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
