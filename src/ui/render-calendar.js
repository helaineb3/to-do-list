import {
  formatDayLabel,
  formatMonthLabel,
  formatWeekRange,
} from '../lib/dates.js'
import { state } from '../app/state.js'
import { ui } from '../lib/dom.js'
import {
  calendarMonthTemplate,
  calendarMonthWeekdaysTemplate,
  calendarWeekTemplate,
} from './templates/calendar.js'

function renderCalendarNav() {
  let label = ''
  let prevLabel = 'Previous'
  let nextLabel = 'Next'

  if (state.calendarViewMode === 'day') {
    label = formatDayLabel(state.selectedDate)
    prevLabel = 'Previous day'
    nextLabel = 'Next day'
  } else if (state.calendarViewMode === 'week') {
    label = formatWeekRange(state.weekStart)
    prevLabel = 'Previous week'
    nextLabel = 'Next week'
  } else {
    label = formatMonthLabel(state.selectedDate)
    prevLabel = 'Previous month'
    nextLabel = 'Next month'
  }

  ui.calendarRangeEl.textContent = label
  ui.calendarPrevBtn.setAttribute('aria-label', prevLabel)
  ui.calendarNextBtn.setAttribute('aria-label', nextLabel)
}

function updateViewTabs() {
  ui.calendarViewTabs.forEach((tab) => {
    const isActive = tab.dataset.calendarView === state.calendarViewMode
    tab.classList.toggle('is-active', isActive)
    tab.setAttribute('aria-selected', isActive)
  })
}

export function renderCalendar() {
  renderCalendarNav()
  updateViewTabs()

  if (state.calendarViewMode === 'day') {
    ui.calendarWeekdaysEl.hidden = true
    ui.calendarDaysEl.hidden = true
    ui.calendarDaysEl.innerHTML = ''
    return
  }

  ui.calendarDaysEl.hidden = false

  if (state.calendarViewMode === 'week') {
    ui.calendarWeekdaysEl.hidden = true
    ui.calendarDaysEl.className = 'calendar-days calendar-days--week'
    ui.calendarDaysEl.innerHTML = calendarWeekTemplate()
    return
  }

  ui.calendarWeekdaysEl.hidden = false
  ui.calendarWeekdaysEl.innerHTML = calendarMonthWeekdaysTemplate()
  ui.calendarDaysEl.className = 'calendar-days calendar-days--month'
  ui.calendarDaysEl.innerHTML = calendarMonthTemplate()
}
