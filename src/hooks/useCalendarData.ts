import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getCalendarEvents, getCalendars } from '../services/calendarService'

export function useCalendarData() {
  const query = useQuery({
    queryKey: ['calendar-data'],
    queryFn: async () => {
      if (!supabase) return { calendars: [], events: [] }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { calendars: [], events: [] }
      const [calendars, events] = await Promise.all([getCalendars(user.id), getCalendarEvents(user.id)])
      return { calendars, events }
    },
    enabled: Boolean(supabase),
    staleTime: 60_000,
  })

  return {
    calendars: query.data?.calendars ?? [],
    events: query.data?.events ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
