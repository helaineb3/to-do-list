import {
  formatDayLabel,
  formatDayNumber,
  getWeekDates,
  getWeekdayLabels,
  getMonthGridDates,
  todayISO,
} from '../../lib/dates.js'
import { isSameMonth } from '../../lib/dates.js'
import { isDayClosed, todosForDay } from '../../lib/helpers.js'
import { state } from '../../app/state.js'

export function calendarDayButtonTemplate(dateStr, { monthMode = false } = {}) {
  const dayTodos = todosForDay(dateStr)
  const openCount = dayTodos.filter((todo) => !todo.is_complete).length
  const doneCount = dayTodos.length - openCount
  const isSelected = dateStr === state.selectedDate
  const isClosed = isDayClosed(dateStr)
  const isToday = dateStr === todayISO()
  const outsideMonth = monthMode && !isSameMonth(dateStr, state.selectedDate)

  const label = monthMode ? formatDayNumber(dateStr) : formatDayLabel(dateStr)
  const countsMarkup = monthMode
    ? openCount > 0
      ? `<span class="calendar-day-open">${openCount} open</span>`
      : ''
    : `
      <span class="calendar-day-counts">
        <span class="calendar-day-open">${openCount} open</span>
        <span class="calendar-day-done">${doneCount} done</span>
      </span>
    `

  return `
    <button
      type="button"
      class="calendar-day${monthMode ? ' calendar-day--month' : ''}${isSelected ? ' is-selected' : ''}${isClosed ? ' is-closed' : ''}${isToday ? ' is-today' : ''}${outsideMonth ? ' is-outside-month' : ''}"
      data-date="${dateStr}"
      aria-pressed="${isSelected}"
      aria-label="${formatDayLabel(dateStr)}"
    >
      <span class="calendar-day-label">${label}</span>
      ${countsMarkup}
    </button>
  `
}

export function calendarWeekTemplate() {
  return getWeekDates(state.weekStart)
    .map((dateStr) => calendarDayButtonTemplate(dateStr))
    .join('')
}

export function calendarMonthWeekdaysTemplate() {
  return getWeekdayLabels()
    .map((weekday) => `<span class="calendar-weekday">${weekday}</span>`)
    .join('')
}

export function calendarMonthTemplate() {
  return getMonthGridDates(state.selectedDate)
    .map((dateStr) => calendarDayButtonTemplate(dateStr, { monthMode: true }))
    .join('')
}
