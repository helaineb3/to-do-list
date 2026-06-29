import { state } from '../app/state.js'
import { addDays, addMonths, startOfWeek } from '../lib/dates.js'
import { getCalendarRange } from '../lib/helpers.js'
import { refreshAppData } from '../app/refresh.js'
import { renderAll } from '../ui/render-all.js'

export function selectDate(dateStr) {
  state.selectedDate = dateStr
  state.weekStart = startOfWeek(dateStr)
  state.showCloseDayPanel = false
  state.editingCategoryId = null

  const { start, end } = getCalendarRange()
  if (dateStr < start || dateStr > end) {
    refreshAppData()
  } else {
    renderAll()
  }
}

export function navigateCalendar(direction) {
  if (state.calendarViewMode === 'day') {
    state.selectedDate = addDays(state.selectedDate, direction)
  } else if (state.calendarViewMode === 'week') {
    state.selectedDate = addDays(state.selectedDate, direction * 7)
    state.weekStart = startOfWeek(state.selectedDate)
  } else {
    state.selectedDate = addMonths(state.selectedDate, direction)
    state.weekStart = startOfWeek(state.selectedDate)
  }

  state.showCloseDayPanel = false
  state.editingCategoryId = null
  refreshAppData()
}

export function setCalendarViewMode(mode) {
  if (state.calendarViewMode === mode) return

  state.calendarViewMode = mode
  state.weekStart = startOfWeek(state.selectedDate)
  state.showCloseDayPanel = false
  state.editingCategoryId = null
  refreshAppData()
}
