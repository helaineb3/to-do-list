import { ui } from '../lib/dom.js'
import {
  navigateCalendar,
  selectDate,
  setCalendarViewMode,
} from '../app/navigation.js'

export function bindCalendarEvents() {
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
}
