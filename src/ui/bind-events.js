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
import { signInWithEmail, signOut, signUpWithEmail } from '../api/auth.js'
import { confirmCloseDay, reopenDay } from '../api/reflections.js'
import { showAuthTab } from './render-auth.js'
import {
  closeCloseDayPanel,
  openCloseDayPanel,
} from './render-day-panel.js'
import {
  navigateCalendar,
  selectDate,
  setCalendarViewMode,
} from '../app/navigation.js'
import {
  closeCategoryPopover,
  startEditingCategory,
} from '../app/category-ui.js'

export function moveDraggingTodoBefore(targetItem, clientY) {
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

export function bindEvents() {
  ui.signInTab.addEventListener('click', () => showAuthTab('sign-in'))
  ui.signUpTab.addEventListener('click', () => showAuthTab('sign-up'))

  ui.signInForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = document.getElementById('todo-sign-in-email').value.trim()
    const password = document.getElementById('todo-sign-in-password').value

    const success = await signInWithEmail(email, password)
    if (success) ui.signInForm.reset()
  })

  ui.signUpForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = document.getElementById('todo-sign-up-email').value.trim()
    const password = document.getElementById('todo-sign-up-password').value

    const success = await signUpWithEmail(email, password)
    if (success) ui.signUpForm.reset()
  })

  ui.signOutButton.addEventListener('click', () => {
    signOut()
  })

  ui.calendarPrevBtn.addEventListener('click', () => {
    navigateCalendar(-1)
  })

  ui.calendarNextBtn.addEventListener('click', () => {
    navigateCalendar(1)
  })

  ui.calendarViewTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setCalendarViewMode(tab.dataset.calendarView)
    })
  })

  ui.calendarDaysEl.addEventListener('click', (event) => {
    const dayButton = event.target.closest('.calendar-day')
    if (!dayButton) return
    selectDate(dayButton.dataset.date)
  })

  ui.closeDayButton.addEventListener('click', () => {
    openCloseDayPanel()
  })

  ui.closeDayCancelBtn.addEventListener('click', () => {
    closeCloseDayPanel()
  })

  ui.closeDayConfirmBtn.addEventListener('click', () => {
    confirmCloseDay()
  })

  ui.dayClosedBadgeEl.addEventListener('click', () => {
    reopenDay()
  })

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
