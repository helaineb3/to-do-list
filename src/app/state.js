import { startOfWeek, todayISO } from '../lib/dates.js'

export const state = {
  todos: [],
  dayReflections: {},
  user: null,
  editingCategoryId: null,
  selectedDate: todayISO(),
  weekStart: startOfWeek(todayISO()),
  calendarViewMode: 'week',
  showCloseDayPanel: false,
  userCategories: [],
  recentlyCompletedId: null,
}
