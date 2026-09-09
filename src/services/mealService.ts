import { supabase } from '../lib/supabase'

export type MealEvent = { id: string; title: string; date: string; startsAt: string }

export async function getMealSettings(userId: string) {
  if (!supabase) return null
  const { data, error } = await supabase.from('meal_settings').select('ics_url').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.ics_url ?? ''
}

export async function saveMealSettings(icsUrl: string) {
  if (!supabase) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Du skal være logget ind for at gemme madplanen')
  const { error } = await supabase.from('meal_settings').upsert({ user_id: user.id, ics_url: icsUrl, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function getMeals(userId: string): Promise<MealEvent[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('meal_events').select('id,title,starts_at').eq('user_id', userId).order('starts_at')
  if (error) throw error
  return (data ?? []).map((meal) => {
    const date = new Date(meal.starts_at)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return { id: meal.id, title: meal.title, startsAt: meal.starts_at, date: `${date.getFullYear()}-${month}-${day}` }
  })
}
