import { state } from '../app/state.js'
import { addDays, getMonthGridDates } from './dates.js'

export function isAnonymousUser(currentUser) {
  return currentUser?.is_anonymous === true || !currentUser?.email
}

export function isDayClosed(dateStr) {
  return Boolean(state.dayReflections[dateStr])
}

export function todosForDay(dateStr) {
  return state.todos
    .filter((todo) => todo.day_date === dateStr)
    .sort((a, b) => {
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
      if (orderDiff !== 0) return orderDiff
      return new Date(a.created_at) - new Date(b.created_at)
    })
}

export function nextSortOrderForDay(dateStr) {
  const dayTodos = todosForDay(dateStr)
  if (dayTodos.length === 0) return 1
  return Math.max(...dayTodos.map((todo) => todo.sort_order ?? 0)) + 1
}

export function normalizeDate(dateVal) {
  if (!dateVal) return dateVal
  return String(dateVal).slice(0, 10)
}

export function getCalendarRange() {
  if (state.calendarViewMode === 'day') {
    return { start: state.selectedDate, end: state.selectedDate }
  }

  if (state.calendarViewMode === 'week') {
    return { start: state.weekStart, end: addDays(state.weekStart, 6) }
  }

  const monthDates = getMonthGridDates(state.selectedDate)
  return { start: monthDates[0], end: monthDates[monthDates.length - 1] }
}
