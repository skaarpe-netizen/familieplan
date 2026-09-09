export const dateLabels = ['I dag', 'I morgen', '+2 dage', '+3 dage', '+4 dage']

export const dateForOffset = (offset: number, baseDate = new Date()) => {
  const date = new Date(baseDate)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export const formatDay = (offset: number, baseDate = new Date()) => {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + offset)
  return new Intl.DateTimeFormat('da-DK', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}
