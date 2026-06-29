import { formatDayLabel } from '../lib/dates.js'
import { state } from '../app/state.js'
import { ui } from '../lib/dom.js'
import { isDayClosed, todosForDay } from '../lib/helpers.js'
import { escapeHtml } from '../lib/html.js'
import { renderTodos } from './render-todos.js'

export function renderDayPanel() {
  const closed = isDayClosed(state.selectedDate)
  const reflection = state.dayReflections[state.selectedDate]

  ui.dayPanelTitleEl.textContent = formatDayLabel(state.selectedDate)
  ui.dayClosedBadgeEl.hidden = !closed
  ui.closeDayButton.hidden = closed || state.showCloseDayPanel
  ui.form.hidden = closed || state.showCloseDayPanel
  ui.list.hidden = state.showCloseDayPanel
  ui.closeDayPanel.hidden = !state.showCloseDayPanel || closed

  if (closed && reflection) {
    ui.dayReflectionDisplayEl.hidden = false
    ui.dayReflectionTextEl.textContent = reflection.reflection
  } else {
    ui.dayReflectionDisplayEl.hidden = true
    ui.dayReflectionTextEl.textContent = ''
  }

  renderTodos()
}

export function openCloseDayPanel() {
  if (isDayClosed(state.selectedDate)) return

  const incompleteTodos = todosForDay(state.selectedDate).filter((todo) => !todo.is_complete)

  ui.closeDayReflectionInput.value = state.dayReflections[state.selectedDate]?.reflection || ''

  if (incompleteTodos.length > 0) {
    ui.closeDayPushSection.hidden = false
    ui.closeDayPushList.innerHTML = incompleteTodos
      .map((todo) => `
        <li class="close-day-push-item">
          <label class="close-day-push-label">
            <input type="checkbox" class="close-day-push-checkbox" value="${todo.id}" checked />
            <span>${escapeHtml(todo.text)}</span>
          </label>
        </li>
      `)
      .join('')
  } else {
    ui.closeDayPushSection.hidden = true
    ui.closeDayPushList.innerHTML = ''
  }

  state.showCloseDayPanel = true
  renderDayPanel()
  ui.closeDayReflectionInput.focus()
}

export function closeCloseDayPanel() {
  state.showCloseDayPanel = false
  renderDayPanel()
}
