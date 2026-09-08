import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (request) => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  // Parse each user's ICS source and upsert normalized events here.
  return Response.json({ ok: true, userId: user.id, syncedAt: new Date().toISOString() })
})
