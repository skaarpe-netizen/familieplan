import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type ParsedEvent = { external_id: string; title: string; starts_at: string; ends_at: string | null; location: string | null; raw_data: Record<string, string> }
const aulaCalendarPrefix = 'https://kalenderlink.aula.dk'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function unfoldIcs(text: string) {
  return text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
}

function value(line: string) {
  return line.slice(line.indexOf(':') + 1).replace(/\\n/g, ' ').replace(/\\([,;])/g, '$1').trim()
}

function icsDate(raw: string) {
  const input = raw.replace(/Z$/, '')
  const match = input.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?$/)
  if (!match) return null
  const [, year, month, day, hour = '00', minute = '00', second = '00'] = match
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString()
}

function subject(title: string) {
  return title.replace(/\s*(?:[-|,]\s*)?(?:lærer|teacher|underviser|\([^)]*\b(?:lærer|teacher)\b[^)]*\))\s*.*$/i, '').split(/\s+[-|]\s+/)[0].trim()
}

function parseEvents(ics: string): ParsedEvent[] {
  const events: ParsedEvent[] = []
  let current: Record<string, string> | null = null
  for (const line of unfoldIcs(ics)) {
    if (line === 'BEGIN:VEVENT') current = {}
    else if (line === 'END:VEVENT' && current) {
      const startsAt = icsDate(current.DTSTART ?? '')
      if (current.UID && current.SUMMARY && startsAt) events.push({ external_id: current.UID, title: current.SUMMARY, starts_at: startsAt, ends_at: current.DTEND ? icsDate(current.DTEND) : null, location: current.LOCATION ?? null, raw_data: current })
      current = null
    } else if (current && line.includes(':')) current[line.slice(0, line.indexOf(':')).split(';')[0]] = value(line)
  }
  return events
}

function mergeEvents(events: ParsedEvent[]) {
  const groups = new Map<string, ParsedEvent[]>()
  for (const event of events) {
    const key = `${event.starts_at}|${event.ends_at ?? ''}`
    groups.set(key, [...(groups.get(key) ?? []), event])
  }
  return [...groups.values()].map((group) => ({ ...group[0], external_id: group.map((event) => event.external_id).join('|'), title: [...new Set(group.map((event) => subject(event.title)))].join(' / '), raw_data: { mergedEventIds: group.map((event) => event.external_id), sourceTitles: group.map((event) => event.title) } }))
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authHeader = request.headers.get('Authorization')
  const cronSecret = Deno.env.get('SYNC_CRON_SECRET')
  const isCron = Boolean(cronSecret && request.headers.get('x-sync-cron-secret') === cronSecret)
  if (!authHeader && !isCron) return json({ error: 'Unauthorized' }, 401)
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)
  const client = isCron ? adminClient : createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader! } } })
  const { data: { user } } = isCron ? { data: { user: null } } : await client.auth.getUser()
  if (!isCron && !user) return json({ error: 'Unauthorized' }, 401)
  const calendarQuery = client.from('calendars').select('id,ics_url').eq('active', true)
  const { data: calendars, error: calendarError } = user ? await calendarQuery.eq('user_id', user.id) : await calendarQuery
  if (calendarError) return json({ error: calendarError.message }, 500)
  let synced = 0
  for (const calendar of calendars ?? []) {
    const response = await fetch(calendar.ics_url)
    if (!response.ok) continue
    const parsed = parseEvents(await response.text())
    const normalized = calendar.ics_url.startsWith(aulaCalendarPrefix) ? mergeEvents(parsed) : parsed
    await adminClient.from('calendar_events').delete().eq('calendar_id', calendar.id)
    if (normalized.length) {
      const { error } = await adminClient.from('calendar_events').insert(normalized.map((event) => ({ ...event, calendar_id: calendar.id })))
      if (error) return json({ error: error.message }, 500)
      synced += normalized.length
    }
  }
  return json({ ok: true, userId: user?.id ?? null, synced, syncedAt: new Date().toISOString() })
})
