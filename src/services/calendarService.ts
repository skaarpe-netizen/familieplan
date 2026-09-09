import type { CalendarEvent, FamilyCalendar } from '../types'
import { mergeOverlappingEvents } from '../features/calendar/normalizeEvents'

const aulaCalendarPrefix = 'https://kalenderlink.aula.dk'
import { supabase } from '../lib/supabase'

export async function getCalendars(userId: string): Promise<FamilyCalendar[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('calendars').select('id,name,color,active,source,ics_url').eq('user_id', userId).order('created_at')
  if (error) throw error
  return (data ?? []).map((calendar) => ({
    id: calendar.id,
    name: calendar.name,
    owner: calendar.name,
    color: calendar.color,
    active: calendar.active,
    source: calendar.source,
    icsUrl: calendar.ics_url,
  }))
}

export async function getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('calendar_events').select('id,title,starts_at,ends_at,location,calendar_id,calendars!inner(user_id,ics_url)').eq('calendars.user_id', userId).order('starts_at')
  if (error) throw error
  const normalized = mergeOverlappingEvents((data ?? []).map((event) => ({
    externalId: event.id,
    title: event.title,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    calendarId: event.calendar_id,
    mergeTeachers: event.calendars[0]?.ics_url.startsWith(aulaCalendarPrefix) ?? false,
    location: event.location,
  })))
  return normalized.map((event) => {
    const startsAt = new Date(event.startsAt)
    return {
      id: event.externalId,
      title: event.title,
      date: startsAt.toISOString().slice(0, 10),
      time: startsAt.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      calendarId: event.calendarId ?? '',
      location: event.location ?? undefined,
    }
  })
}

async function currentUserId() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function createCalendar(calendar: Omit<FamilyCalendar, 'id'>) {
  if (!supabase) return null
  const userId = await currentUserId()
  if (!userId) throw new Error('Du skal være logget ind for at oprette en kalender')
  const { data, error } = await supabase.from('calendars').insert({
    user_id: userId,
    name: calendar.name,
    color: calendar.color,
    active: calendar.active,
    source: calendar.source,
    ics_url: calendar.source === 'ICS' ? 'https://example.invalid/calendar.ics' : `https://calendar.familie.dk/${calendar.name.toLowerCase()}`,
  }).select('id').single()
  if (error) throw error
  return { ...calendar, id: data.id }
}

export async function updateCalendar(id: string, values: Partial<FamilyCalendar>) {
  if (!supabase) return
  const { error } = await supabase.from('calendars').update({
    ...(values.name !== undefined ? { name: values.name } : {}),
    ...(values.color !== undefined ? { color: values.color } : {}),
    ...(values.active !== undefined ? { active: values.active } : {}),
    ...(values.icsUrl !== undefined ? { ics_url: values.icsUrl } : {}),
  }).eq('id', id)
  if (error) throw error
}

export async function deleteCalendar(id: string) {
  if (!supabase) return
  const { error } = await supabase.from('calendars').delete().eq('id', id)
  if (error) throw error
}
