import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (request) => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })
  const { mealName } = await request.json() as { mealName?: string }
  if (!mealName?.trim()) return Response.json({ error: 'mealName is required' }, { status: 400 })
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: cached } = await supabase.from('meal_images').select('*').eq('user_id', user.id).eq('meal_name', mealName).maybeSingle()
  if (cached) return Response.json({ cached: true, imagePath: cached.storage_path })
  // Call the configured image provider here, upload result to meal-images, then insert cache row.
  return Response.json({ cached: false, mealName, message: 'Image provider not configured' }, { status: 501 })
})
