import { supabase } from '../supabase.js'

export async function getSession() {
  return supabase.auth.getSession()
}

export async function signInAnonymously() {
  return supabase.auth.signInAnonymously()
}

export async function signInWithPassword(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function updateUser({ email, password }) {
  return supabase.auth.updateUser({ email, password })
}

export async function signUp({ email, password }) {
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
