import { create } from 'zustand'

export type CalendarMode = 'five-days' | 'day'

type UiState = {
  calendarMode: CalendarMode
  visibleCalendars: string[]
  setCalendarMode: (mode: CalendarMode) => void
  toggleCalendar: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  calendarMode: 'five-days',
  visibleCalendars: ['mom', 'dad', 'emma', 'oliver', 'family'],
  setCalendarMode: (calendarMode) => set({ calendarMode }),
  toggleCalendar: (id) => set((state) => ({
    visibleCalendars: state.visibleCalendars.includes(id)
      ? state.visibleCalendars.filter((calendarId) => calendarId !== id)
      : [...state.visibleCalendars, id],
  })),
}))
