import { state } from '../app/state.js'
import { showError } from '../lib/errors.js'
import { refreshAppData } from '../app/refresh.js'
import { renderTodos } from '../ui/render-todos.js'
import * as todosRepo from '../repositories/todos.js'
import * as categoriesRepo from '../repositories/categories.js'

export async function saveCategory(id, category) {
  const trimmed = category.trim()
  const { error } = await todosRepo.updateTodoCategory(id, trimmed || null)

  if (error) {
    console.error('Failed to update category:', error.message)
    showError(`Could not save category: ${error.message}`)
    return false
  }

  state.editingCategoryId = null
  await refreshAppData()
  return true
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

  const { data, error } = await categoriesRepo.insertCategory(
    state.user.id,
    trimmed,
    state.userCategories.length + 1
  )

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

  const { error: clearTodosError } = await todosRepo.clearTodoCategoryForUser(
    state.user.id,
    category.name
  )

  if (clearTodosError) {
    console.error('Failed to clear category from todos:', clearTodosError.message)
    showError(`Could not clear category from todos: ${clearTodosError.message}`)
    return false
  }

  const { error } = await categoriesRepo.deleteCategoryById(categoryId)

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
  else await refreshAppData()

  return true
}
