import { state } from '../app/state.js'
import { addDays } from '../lib/dates.js'
import { isDayClosed, nextSortOrderForDay } from '../lib/helpers.js'
import { reportError, warnUser } from '../lib/errors.js'
import { requireUser } from '../lib/guards.js'
import { ui } from '../lib/dom.js'
import { refreshAppData } from '../app/refresh.js'
import { renderAll } from '../ui/render-all.js'
import * as reflectionsRepo from '../repositories/reflections.js'
import * as todosRepo from '../repositories/todos.js'

export async function confirmCloseDay() {
  if (!requireUser()) return false

  if (isDayClosed(state.selectedDate)) {
    warnUser('This day is already closed.')
    return false
  }

  const reflection = ui.closeDayReflectionInput.value.trim()
  const pushIds = [...ui.closeDayPushList.querySelectorAll('.close-day-push-checkbox:checked')]
    .map((checkbox) => Number(checkbox.value))

  const { error: reflectionError } = await reflectionsRepo.upsertDayReflection({
    userId: state.user.id,
    dayDate: state.selectedDate,
    reflection,
    closedAt: new Date().toISOString(),
  })

  if (reflectionError) {
    reportError('close day', reflectionError)
    return false
  }

  const tomorrow = addDays(state.selectedDate, 1)

  if (pushIds.length > 0) {
    const pushResults = await todosRepo.pushTodosToDay(
      pushIds,
      tomorrow,
      nextSortOrderForDay(tomorrow)
    )

    const pushError = pushResults.find((result) => result.error)?.error
    if (pushError) {
      reportError('push todos', pushError)
      return false
    }
  }

  state.showCloseDayPanel = false
  await refreshAppData()
  return true
}

export async function reopenDay() {
  if (!requireUser()) return false

  if (!isDayClosed(state.selectedDate)) {
    warnUser('This day is not closed.')
    return false
  }

  const { error } = await reflectionsRepo.deleteDayReflection(state.user.id, state.selectedDate)

  if (error) {
    reportError('reopen day', error)
    return false
  }

  delete state.dayReflections[state.selectedDate]
  state.showCloseDayPanel = false
  state.editingCategoryId = null
  renderAll()
  return true
}
