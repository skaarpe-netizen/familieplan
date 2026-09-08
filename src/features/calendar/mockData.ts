import type { CalendarEvent, FamilyCalendar, FamilyMessage } from '../../types'

export const calendars: FamilyCalendar[] = [
  { id: 'mom', name: 'Mor', owner: 'Mor', color: 'lilac', active: true, source: 'Google Calendar' },
  { id: 'dad', name: 'Far', owner: 'Far', color: 'blue', active: true, source: 'Outlook' },
  { id: 'emma', name: 'Emma', owner: 'Emma', color: 'pink', active: true, source: 'Aula' },
  { id: 'oliver', name: 'Oliver', owner: 'Oliver', color: 'green', active: true, source: 'Aula' },
  { id: 'family', name: 'Familie', owner: 'Alle', color: 'orange', active: true, source: 'Familieplanen' },
]

export const events: CalendarEvent[] = [
  { id: '1', title: 'Tandlæge', date: '2026-09-08', time: '08:30', calendarId: 'mom', location: 'City Tand' },
  { id: '2', title: 'Fodboldtræning', date: '2026-09-08', time: '16:15', calendarId: 'oliver', location: 'Stadion' },
  { id: '3', title: 'Forældremøde', date: '2026-09-09', time: '19:00', calendarId: 'emma', location: 'Skolen' },
  { id: '4', title: 'Svømning', date: '2026-09-10', time: '15:45', calendarId: 'emma' },
  { id: '5', title: 'Handle ind', date: '2026-09-11', time: '17:00', calendarId: 'family' },
  { id: '6', title: 'Far kommer sent hjem', date: '2026-09-12', time: '21:30', calendarId: 'dad' },
]

export const messages: FamilyMessage[] = [
  { id: '1', text: 'Husk gymnastiktøj torsdag', author: 'Mor', createdAt: 'I dag' },
  { id: '2', text: 'Far kommer sent hjem fredag', author: 'Far', createdAt: 'I går' },
  { id: '3', text: 'Emma skal have madpakke med', author: 'Mor', createdAt: 'Mandag' },
]
