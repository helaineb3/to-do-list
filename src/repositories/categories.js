import { supabase } from '../supabase.js'

export async function fetchUserCategories(userId) {
  return supabase
    .from('user_categories')
    .select('id, name, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
}

export async function insertStarterCategories(userId, names) {
  return supabase.from('user_categories').insert(
    names.map((name, index) => ({
      user_id: userId,
      name,
      sort_order: index + 1,
    }))
  )
}

export async function insertCategories(userId, names, startSortOrder) {
  return supabase.from('user_categories').insert(
    names.map((name, index) => ({
      user_id: userId,
      name,
      sort_order: startSortOrder + index,
    }))
  )
}

export async function insertCategory(userId, name, sortOrder) {
  return supabase
    .from('user_categories')
    .insert({
      user_id: userId,
      name,
      sort_order: sortOrder,
    })
    .select('id, name, sort_order')
    .single()
}

export async function deleteCategoryById(categoryId) {
  return supabase.from('user_categories').delete().eq('id', categoryId)
}
