import type { CalendarEvent, FamilyCalendar } from '../types'
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
  }))
}

export async function getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('calendar_events').select('id,title,starts_at,location,calendar_id,calendars!inner(user_id)').eq('calendars.user_id', userId).order('starts_at')
  if (error) throw error
  return (data ?? []).map((event) => {
    const startsAt = new Date(event.starts_at)
    return {
      id: event.id,
      title: event.title,
      date: startsAt.toISOString().slice(0, 10),
      time: startsAt.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      calendarId: event.calendar_id,
      location: event.location ?? undefined,
    }
  })
}
