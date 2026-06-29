import { ui } from '../lib/dom.js'
import { state } from '../app/state.js'
import {
  addTodo,
  deleteTodo,
  persistTodoOrderFromDom,
  refreshAppData,
  toggleTodo,
} from '../api/app-data.js'
import {
  addUserCategory,
  deleteUserCategory,
  saveCategory,
} from '../api/categories.js'
import {
  closeCategoryPopover,
  startEditingCategory,
} from '../app/category-ui.js'

function moveDraggingTodoBefore(targetItem, clientY) {
  const dragging = ui.list.querySelector('.todo-item.is-dragging')
  if (!dragging || !targetItem || dragging === targetItem) return

  const rect = targetItem.getBoundingClientRect()
  const insertBefore = clientY < rect.top + rect.height / 2

  if (insertBefore) {
    ui.list.insertBefore(dragging, targetItem)
  } else {
    ui.list.insertBefore(dragging, targetItem.nextSibling)
  }
}

export function bindTodoEvents() {
  ui.form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const text = ui.input.value.trim()
    if (!text) return

    const success = await addTodo(text)
    if (!success) return

    ui.input.value = ''
    await refreshAppData()
    ui.input.focus()
  })

  ui.list.addEventListener('dragstart', (event) => {
    const dragZone = event.target.closest('.todo-item-drag-zone')
    if (!dragZone) return

    const item = dragZone.closest('.todo-item')
    if (!item) return

    item.classList.add('is-dragging')
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.dataset.id)
  })

  ui.list.addEventListener('dragend', (event) => {
    const dragZone = event.target.closest('.todo-item-drag-zone')
    if (!dragZone) return

    const item = dragZone.closest('.todo-item')
    if (item) item.classList.remove('is-dragging')
    ui.list.querySelectorAll('.todo-item').forEach((el) => el.classList.remove('is-drag-over'))
  })

  ui.list.addEventListener('dragover', (event) => {
    const targetItem = event.target.closest('.todo-item')
    if (!targetItem || !ui.list.querySelector('.todo-item.is-dragging')) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    moveDraggingTodoBefore(targetItem, event.clientY)
  })

  ui.list.addEventListener('drop', async (event) => {
    if (!ui.list.querySelector('.todo-item.is-dragging')) return

    event.preventDefault()
    ui.list.querySelectorAll('.todo-item').forEach((el) => el.classList.remove('is-drag-over'))
    await persistTodoOrderFromDom()
  })

  ui.list.addEventListener('click', async (event) => {
    if (event.target.closest('.todo-category-popover')) {
      const item = event.target.closest('.todo-item')
      const id = Number(item.dataset.id)

      if (event.target.closest('.todo-category-delete')) {
        const deleteButton = event.target.closest('.todo-category-delete')
        await deleteUserCategory(Number(deleteButton.dataset.categoryId))
        return
      }

      if (event.target.closest('.todo-category-add-button')) {
        const popover = event.target.closest('.todo-category-popover')
        const newInput = popover.querySelector('.todo-category-new-input')
        await addUserCategory(newInput.value, id)
        newInput.value = ''
        return
      }

      if (event.target.closest('.todo-category-option')) {
        const option = event.target.closest('.todo-category-option')
        const value = option.classList.contains('is-active') ? '' : option.dataset.categoryValue
        await saveCategory(id, value)
      }
      return
    }

    const item = event.target.closest('.todo-item')
    if (!item) return

    const id = Number(item.dataset.id)

    if (event.target.closest('.todo-complete-button')) {
      const success = await toggleTodo(id)
      if (success) await refreshAppData()
    } else if (event.target.closest('.todo-category-button')) {
      startEditingCategory(id)
    } else if (event.target.closest('.todo-delete-button')) {
      const success = await deleteTodo(id)
      if (success) await refreshAppData()
    }
  })

  ui.list.addEventListener('keydown', async (event) => {
    if (event.key !== 'Enter') return

    const newCategoryInput = event.target.closest('[data-category-new-input]')
    if (!newCategoryInput) return

    event.preventDefault()
    const id = Number(newCategoryInput.dataset.categoryNewInput)
    await addUserCategory(newCategoryInput.value, id)
    newCategoryInput.value = ''
  })

  document.addEventListener('click', (event) => {
    if (!state.editingCategoryId) return
    if (event.target.closest('.todo-category-popover') || event.target.closest('.todo-category-button')) return
    closeCategoryPopover()
  })
}
