import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calendars as initialCalendars, messages as initialMessages } from '../features/calendar/mockData'
import type { FamilyCalendar, FamilyMessage } from '../types'

type WeatherSettings = { city: string; latitude: number; longitude: number }
type FamilyState = {
  calendars: FamilyCalendar[]
  messages: FamilyMessage[]
  weather: WeatherSettings
  mealUrl: string
  addCalendar: (calendar: Omit<FamilyCalendar, 'id'> | FamilyCalendar) => void
  updateCalendar: (id: string, calendar: Partial<FamilyCalendar>) => void
  removeCalendar: (id: string) => void
  addMessage: (text: string, author?: string) => void
  removeMessage: (id: string) => void
  setWeather: (weather: WeatherSettings) => void
  setMealUrl: (mealUrl: string) => void
}

export const useFamilyStore = create<FamilyState>()(persist((set) => ({
  calendars: initialCalendars,
  messages: initialMessages,
  weather: { city: 'Hørsholm', latitude: 55.88, longitude: 12.50 },
  mealUrl: 'https://calendar.familie.dk/madplan',
  addCalendar: (calendar) => set((state) => ({ calendars: [...state.calendars, { ...calendar, id: 'id' in calendar ? calendar.id : crypto.randomUUID() }] })),
  updateCalendar: (id, calendar) => set((state) => ({ calendars: state.calendars.map((item) => item.id === id ? { ...item, ...calendar } : item) })),
  removeCalendar: (id) => set((state) => ({ calendars: state.calendars.filter((calendar) => calendar.id !== id) })),
  addMessage: (text, author = 'Familie') => set((state) => ({ messages: [{ id: crypto.randomUUID(), text, author, createdAt: 'Lige nu' }, ...state.messages] })),
  removeMessage: (id) => set((state) => ({ messages: state.messages.filter((message) => message.id !== id) })),
  setWeather: (weather) => set({ weather }),
  setMealUrl: (mealUrl) => set({ mealUrl }),
}), { name: 'familieplanen-data' }))
