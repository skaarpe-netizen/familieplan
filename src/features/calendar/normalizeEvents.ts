export type RawCalendarEvent = {
  externalId: string
  title: string
  startsAt: string
  endsAt: string | null
  calendarId?: string
  mergeTeachers?: boolean
  location?: string | null
  rawData?: Record<string, unknown>
}

const teacherMarkers = /\s*(?:[-|,]\s*)?(?:lærer|teacher|underviser|\([^)]*\b(?:lærer|teacher)\b[^)]*\))\s*.*$/i

export function extractSubject(title: string) {
  const cleaned = title.replace(/[,;]\s*/g, ' ').replace(teacherMarkers, '').trim()
  const parts = cleaned.split(/\s+[-|]\s+/)
  return (parts[0] || cleaned).replace(/\s{2,}/g, ' ').trim()
}

export function mergeOverlappingEvents(events: RawCalendarEvent[]) {
  const groups = new Map<string, RawCalendarEvent[]>()
  const passthrough = events.filter((event) => !event.mergeTeachers)
  for (const event of events.filter((item) => item.mergeTeachers)) {
    const key = `${event.calendarId ?? ''}|${event.startsAt}|${event.endsAt ?? ''}`
    const group = groups.get(key) ?? []
    group.push(event)
    groups.set(key, group)
  }

  return [...passthrough, ...[...groups.values()].map((group) => {
    const first = group[0]
    const subjects = [...new Set(group.map((event) => extractSubject(event.title)).filter(Boolean))]
    return {
      ...first,
      title: subjects.join(' / '),
      externalId: group.map((event) => event.externalId).join('|'),
      rawData: { mergedEventIds: group.map((event) => event.externalId), sourceTitles: group.map((event) => event.title) },
    }
  })]
}
