import { describe, expect, it } from 'vitest'
import { extractSubject, mergeOverlappingEvents } from './normalizeEvents'

describe('Aula event normalization', () => {
  it('keeps only the subject when a teacher is appended', () => {
    expect(extractSubject('Matematik - Lærer Jensen')).toBe('Matematik')
  })

  it('merges simultaneous teacher duplicates into one event', () => {
    const merged = mergeOverlappingEvents([
      { externalId: 'teacher-1', title: 'Matematik - Lærer Jensen', startsAt: '2026-09-09T08:00:00.000Z', endsAt: '2026-09-09T09:00:00.000Z', calendarId: 'aula', mergeTeachers: true },
      { externalId: 'teacher-2', title: 'Matematik - Lærer Hansen', startsAt: '2026-09-09T08:00:00.000Z', endsAt: '2026-09-09T09:00:00.000Z', calendarId: 'aula', mergeTeachers: true },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0].title).toBe('Matematik')
  })
})
