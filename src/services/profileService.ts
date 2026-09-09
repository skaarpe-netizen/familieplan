import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export async function upsertUserProfile(user: User) {
  if (!supabase) return

  const { error } = await supabase.from('users').upsert({
    id: user.id,
    email: user.email ?? null,
    display_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null,
  }, { onConflict: 'id' })

  if (error) throw error
}
