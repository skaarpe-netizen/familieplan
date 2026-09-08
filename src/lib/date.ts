export const dateLabels = ['I dag', 'I morgen', '+2 dage', '+3 dage', '+4 dage']

export const formatDay = (offset: number) => {
  const date = new Date(2026, 8, 8 + offset)
  return new Intl.DateTimeFormat('da-DK', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}
