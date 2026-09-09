import { supabase } from '../lib/supabase'

export async function syncMealPlan() {
  if (!supabase) throw new Error('Supabase er ikke konfigureret')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Du skal være logget ind for at synkronisere madplanen')
  const { data, error } = await supabase.functions.invoke('sync-meal-plan', { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (error) throw error
  return data as { synced?: number }
}
