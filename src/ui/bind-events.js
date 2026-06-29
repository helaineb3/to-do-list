import { bindAuthEvents } from './bind-auth.js'
import { bindCalendarEvents } from './bind-calendar.js'
import { bindDayEvents } from './bind-day.js'
import { bindTodoEvents } from './bind-todos.js'

export function bindEvents() {
  bindAuthEvents()
  bindCalendarEvents()
  bindDayEvents()
  bindTodoEvents()
}
