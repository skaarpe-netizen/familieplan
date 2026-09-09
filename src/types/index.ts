export type CalendarColor = 'lilac' | 'blue' | 'pink' | 'green' | 'orange'

export type FamilyCalendar = {
  id: string
  name: string
  owner: string
  color: CalendarColor
  active: boolean
  source: string
  icsUrl?: string
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  time?: string
  calendarId: string
  location?: string
}

export type FamilyMessage = { id: string; text: string; author: string; createdAt: string }
