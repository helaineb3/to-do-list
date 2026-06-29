import { supabase } from '../supabase.js'

export async function fetchTodosInRange(userId, start, end) {
  return supabase
    .from('todos')
    .select('id, text, is_complete, category, day_date, sort_order, created_at')
    .eq('user_id', userId)
    .gte('day_date', start)
    .lte('day_date', end)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
}

export async function insertTodo({ userId, text, dayDate, sortOrder }) {
  return supabase.from('todos').insert({
    text,
    is_complete: false,
    user_id: userId,
    day_date: dayDate,
    sort_order: sortOrder,
  })
}

export async function updateTodoComplete(id, isComplete) {
  return supabase.from('todos').update({ is_complete: isComplete }).eq('id', id)
}

export async function deleteTodoById(id) {
  return supabase.from('todos').delete().eq('id', id)
}

export async function updateTodoSortOrder(id, sortOrder) {
  return supabase.from('todos').update({ sort_order: sortOrder }).eq('id', id)
}

export async function updateTodoCategory(id, category) {
  return supabase.from('todos').update({ category }).eq('id', id)
}

export async function clearTodoCategoryForUser(userId, categoryName) {
  return supabase
    .from('todos')
    .update({ category: null })
    .eq('user_id', userId)
    .eq('category', categoryName)
}

export async function pushTodosToDay(ids, dayDate, startSortOrder) {
  return Promise.all(
    ids.map((id, index) =>
      supabase
        .from('todos')
        .update({ day_date: dayDate, sort_order: startSortOrder + index })
        .eq('id', id)
    )
  )
}
