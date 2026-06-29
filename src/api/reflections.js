import { supabase } from '../supabase.js'
import { state } from '../app/state.js'
import { addDays } from '../lib/dates.js'
import { isDayClosed, nextSortOrderForDay } from '../lib/helpers.js'
import { showError } from '../lib/errors.js'
import { ui } from '../lib/dom.js'
import { refreshAppData } from './app-data.js'
import { renderAll } from '../ui/render-all.js'

export async function confirmCloseDay() {
  const reflection = ui.closeDayReflectionInput.value.trim()
  const pushIds = [...ui.closeDayPushList.querySelectorAll('.close-day-push-checkbox:checked')]
    .map((checkbox) => Number(checkbox.value))

  const { error: reflectionError } = await supabase.from('day_reflections').upsert(
    {
      user_id: state.user.id,
      day_date: state.selectedDate,
      reflection,
      closed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,day_date' }
  )

  if (reflectionError) {
    console.error('Failed to close day:', reflectionError.message)
    showError(`Could not close day: ${reflectionError.message}`)
    return false
  }

  const tomorrow = addDays(state.selectedDate, 1)

  if (pushIds.length > 0) {
    const startOrder = nextSortOrderForDay(tomorrow)
    const pushResults = await Promise.all(
      pushIds.map((id, index) =>
        supabase
          .from('todos')
          .update({ day_date: tomorrow, sort_order: startOrder + index })
          .eq('id', id)
      )
    )

    const pushError = pushResults.find((result) => result.error)?.error
    if (pushError) {
      console.error('Failed to push todos:', pushError.message)
      showError(`Could not push todos: ${pushError.message}`)
      return false
    }
  }

  state.showCloseDayPanel = false
  await refreshAppData()
  return true
}

export async function reopenDay() {
  if (!isDayClosed(state.selectedDate)) return false

  const { error } = await supabase
    .from('day_reflections')
    .delete()
    .eq('user_id', state.user.id)
    .eq('day_date', state.selectedDate)

  if (error) {
    console.error('Failed to reopen day:', error.message)
    showError(`Could not reopen day: ${error.message}`)
    return false
  }

  delete state.dayReflections[state.selectedDate]
  state.showCloseDayPanel = false
  state.editingCategoryId = null
  renderAll()
  return true
}
