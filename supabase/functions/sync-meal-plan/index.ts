import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
function unfold(text: string) { return text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/) }
function field(line: string) { return line.slice(line.indexOf(':') + 1).replace(/\\n/g, ' ').replace(/\\([,;])/g, '$1').trim() }
function dateValue(raw: string) { const input = raw.replace(/Z$/, ''); const match = input.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?$/); if (!match) return null; const [, y, m, d, h = '00', min = '00', s = '00'] = match; return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`).toISOString() }
function parse(ics: string) { const result: Array<{ external_id: string; title: string; starts_at: string; ends_at: string | null; raw_data: Record<string, string> }> = []; let current: Record<string, string> | null = null; for (const line of unfold(ics)) { if (line === 'BEGIN:VEVENT') current = {}; else if (line === 'END:VEVENT' && current) { const starts = dateValue(current.DTSTART ?? ''); if (current.UID && current.SUMMARY && starts) result.push({ external_id: current.UID, title: current.SUMMARY, starts_at: starts, ends_at: current.DTEND ? dateValue(current.DTEND) : null, raw_data: current }); current = null } else if (current && line.includes(':')) current[line.slice(0, line.indexOf(':')).split(';')[0]] = field(line) } return result }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: settings, error: settingsError } = await admin.from('meal_settings').select('ics_url').eq('user_id', user.id).maybeSingle()
  if (settingsError) return json({ error: settingsError.message }, 500)
  if (!settings?.ics_url) return json({ error: 'Madplanens ICS-link mangler' }, 400)
  const response = await fetch(settings.ics_url)
  if (!response.ok) return json({ error: `Madplanens ICS-feed svarede ${response.status}` }, 502)
  const meals = parse(await response.text())
  await admin.from('meal_events').delete().eq('user_id', user.id)
  if (meals.length) { const { error } = await admin.from('meal_events').insert(meals.map((meal) => ({ ...meal, user_id: user.id }))); if (error) return json({ error: error.message }, 500) }
  return json({ ok: true, synced: meals.length, syncedAt: new Date().toISOString() })
})
