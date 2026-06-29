import { state } from '../app/state.js'
import { renderTodos } from '../ui/render-todos.js'

export function closeCategoryPopover() {
  state.editingCategoryId = null
  renderTodos()
}

export function startEditingCategory(id) {
  if (state.editingCategoryId === id) {
    closeCategoryPopover()
    return
  }

  state.editingCategoryId = id
  renderTodos()
}
