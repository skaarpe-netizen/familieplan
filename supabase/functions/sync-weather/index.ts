import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (request) => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: settings } = await supabase.from('weather_settings').select('*').eq('user_id', user.id).single()
  if (!settings) return Response.json({ error: 'Weather settings missing' }, { status: 400 })
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${settings.latitude}&longitude=${settings.longitude}&current=temperature_2m,weather_code,wind_speed_10m,precipitation_probability`
  const weather = await fetch(url).then((response) => response.json())
  return Response.json(weather)
})
