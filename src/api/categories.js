import { state } from '../app/state.js'
import { reportError, warnUser } from '../lib/errors.js'
import { requireOpenDay, requireUser } from '../lib/guards.js'
import { refreshAppData } from '../app/refresh.js'
import { renderTodos } from '../ui/render-todos.js'
import * as todosRepo from '../repositories/todos.js'
import * as categoriesRepo from '../repositories/categories.js'

export async function saveCategory(id, category) {
  if (!requireUser() || !requireOpenDay()) return false

  const trimmed = category.trim()
  const { error } = await todosRepo.updateTodoCategory(id, trimmed || null)

  if (error) {
    reportError('save category', error)
    return false
  }

  state.editingCategoryId = null
  await refreshAppData()
  return true
}

export async function addUserCategory(name, assignToTodoId = null) {
  if (!requireUser()) return false

  const trimmed = name.trim()
  if (!trimmed) {
    warnUser('Enter a category name.')
    return false
  }

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
    reportError('add category', error)
    return false
  }

  state.userCategories.push(data)

  if (assignToTodoId) return saveCategory(assignToTodoId, trimmed)

  if (state.editingCategoryId) renderTodos()
  return true
}

export async function deleteUserCategory(categoryId) {
  if (!requireUser()) return false

  const category = state.userCategories.find((entry) => entry.id === categoryId)
  if (!category) {
    reportError('delete category', 'Category not found')
    return false
  }

  const { error: clearTodosError } = await todosRepo.clearTodoCategoryForUser(
    state.user.id,
    category.name
  )

  if (clearTodosError) {
    reportError('clear category from todos', clearTodosError)
    return false
  }

  const { error } = await categoriesRepo.deleteCategoryById(categoryId)

  if (error) {
    reportError('delete category', error)
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
