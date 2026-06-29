import { state } from '../app/state.js'
import { ui } from '../lib/dom.js'
import { isDayClosed, todosForDay } from '../lib/helpers.js'
import { todoItemTemplate } from './templates/todo-item.js'

export function renderTodos() {
  const dayTodos = todosForDay(state.selectedDate)
  const dayClosed = isDayClosed(state.selectedDate)

  ui.list.innerHTML = dayTodos
    .map((todo) =>
      todoItemTemplate(todo, {
        dayClosed,
        isEditingCategory: state.editingCategoryId === todo.id,
      })
    )
    .join('')

  if (state.editingCategoryId) {
    const newCategoryInput = ui.list.querySelector(
      `[data-category-new-input="${state.editingCategoryId}"]`
    )
    if (newCategoryInput) newCategoryInput.focus()
  }

  state.recentlyCompletedId = null
}
