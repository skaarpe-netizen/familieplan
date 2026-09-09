import { useQuery } from '@tanstack/react-query'
import { calendars as mockCalendars, events as mockEvents } from '../features/calendar/mockData'
import { supabase } from '../lib/supabase'
import { getCalendarEvents, getCalendars } from '../services/calendarService'

export function useCalendarData() {
  const query = useQuery({
    queryKey: ['calendar-data'],
    queryFn: async () => {
      if (!supabase) return { calendars: mockCalendars, events: mockEvents }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { calendars: mockCalendars, events: mockEvents }
      const [calendars, events] = await Promise.all([getCalendars(user.id), getCalendarEvents(user.id)])
      return {
        calendars: calendars.length ? calendars : mockCalendars,
        events: events.length ? events : mockEvents,
      }
    },
    enabled: Boolean(supabase),
    staleTime: 60_000,
  })

  return {
    calendars: query.data?.calendars ?? mockCalendars,
    events: query.data?.events ?? mockEvents,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
