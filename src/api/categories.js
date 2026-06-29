import { supabase } from '../supabase.js'
import { state } from '../app/state.js'
import { STARTER_CATEGORIES } from '../constants/categories.js'
import { showError } from '../lib/errors.js'
import { renderTodos } from '../ui/render-todos.js'

export async function saveCategory(id, category) {
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

  state.editingCategoryId = null
  const { refreshAppData } = await import('./app-data.js')
  await refreshAppData()
  return true
}

export async function loadUserCategories() {
  const { data, error } = await supabase
    .from('user_categories')
    .select('id, name, sort_order')
    .eq('user_id', state.user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load categories:', error.message)
    showError(`Could not load categories: ${error.message}`)
    return false
  }

  state.userCategories = data

  if (state.userCategories.length === 0) {
    const { error: seedError } = await supabase.from('user_categories').insert(
      STARTER_CATEGORIES.map((name, index) => ({
        user_id: state.user.id,
        name,
        sort_order: index + 1,
      }))
    )

    if (seedError) {
      console.error('Failed to seed categories:', seedError.message)
      showError(`Could not create categories: ${seedError.message}`)
      return false
    }

    return loadUserCategories()
  }

  return true
}

export async function syncCategoriesFromTodos() {
  const names = [...new Set(state.todos.map((todo) => todo.category).filter(Boolean))]
  const missing = names.filter(
    (name) =>
      !state.userCategories.some((category) => category.name.toLowerCase() === name.toLowerCase())
  )

  if (missing.length === 0) return true

  const { error } = await supabase.from('user_categories').insert(
    missing.map((name, index) => ({
      user_id: state.user.id,
      name,
      sort_order: state.userCategories.length + index + 1,
    }))
  )

  if (error) {
    console.error('Failed to sync categories from todos:', error.message)
    return false
  }

  return loadUserCategories()
}

export async function addUserCategory(name, assignToTodoId = null) {
  const trimmed = name.trim()
  if (!trimmed) return false

  const existing = state.userCategories.find(
    (category) => category.name.toLowerCase() === trimmed.toLowerCase()
  )

  if (existing) {
    if (assignToTodoId) return saveCategory(assignToTodoId, existing.name)
    return true
  }

  const { data, error } = await supabase
    .from('user_categories')
    .insert({
      user_id: state.user.id,
      name: trimmed,
      sort_order: state.userCategories.length + 1,
    })
    .select('id, name, sort_order')
    .single()

  if (error) {
    console.error('Failed to add category:', error.message)
    showError(`Could not add category: ${error.message}`)
    return false
  }

  state.userCategories.push(data)

  if (assignToTodoId) return saveCategory(assignToTodoId, trimmed)

  if (state.editingCategoryId) renderTodos()
  return true
}

export async function deleteUserCategory(categoryId) {
  const category = state.userCategories.find((entry) => entry.id === categoryId)
  if (!category) return false

  const { error: clearTodosError } = await supabase
    .from('todos')
    .update({ category: null })
    .eq('user_id', state.user.id)
    .eq('category', category.name)

  if (clearTodosError) {
    console.error('Failed to clear category from todos:', clearTodosError.message)
    showError(`Could not clear category from todos: ${clearTodosError.message}`)
    return false
  }

  const { error } = await supabase.from('user_categories').delete().eq('id', categoryId)

  if (error) {
    console.error('Failed to delete category:', error.message)
    showError(`Could not delete category: ${error.message}`)
    return false
  }

  state.userCategories = state.userCategories.filter((entry) => entry.id !== categoryId)
  state.todos.forEach((todo) => {
    if (todo.category === category.name) todo.category = null
  })

  if (state.editingCategoryId) renderTodos()
  else {
    const { refreshAppData } = await import('./app-data.js')
    await refreshAppData()
  }
  return true
}
