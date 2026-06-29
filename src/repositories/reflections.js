import { supabase } from '../supabase.js'

export async function fetchReflectionsInRange(userId, start, end) {
  return supabase
    .from('day_reflections')
    .select('day_date, reflection, closed_at')
    .eq('user_id', userId)
    .gte('day_date', start)
    .lte('day_date', end)
}

export async function upsertDayReflection({ userId, dayDate, reflection, closedAt }) {
  return supabase.from('day_reflections').upsert(
    {
      user_id: userId,
      day_date: dayDate,
      reflection,
      closed_at: closedAt,
    },
    { onConflict: 'user_id,day_date' }
  )
}

export async function deleteDayReflection(userId, dayDate) {
  return supabase
    .from('day_reflections')
    .delete()
    .eq('user_id', userId)
    .eq('day_date', dayDate)
}
