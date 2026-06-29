import { state } from './state.js'
import { STARTER_CATEGORIES } from '../constants/categories.js'
import { showError } from '../lib/errors.js'
import * as categoriesRepo from '../repositories/categories.js'

export async function loadUserCategories() {
  const { data, error } = await categoriesRepo.fetchUserCategories(state.user.id)

  if (error) {
    console.error('Failed to load categories:', error.message)
    showError(`Could not load categories: ${error.message}`)
    return false
  }

  state.userCategories = data

  if (state.userCategories.length === 0) {
    const { error: seedError } = await categoriesRepo.insertStarterCategories(
      state.user.id,
      STARTER_CATEGORIES
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

  const { error } = await categoriesRepo.insertCategories(
    state.user.id,
    missing,
    state.userCategories.length + 1
  )

  if (error) {
    console.error('Failed to sync categories from todos:', error.message)
    return false
  }

  return loadUserCategories()
}
