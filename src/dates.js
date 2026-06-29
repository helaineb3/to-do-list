export function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateISO(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(dateStr, days) {
  const date = parseDateISO(dateStr)
  date.setDate(date.getDate() + days)
  return formatDateISO(date)
}

export function startOfWeek(dateStr) {
  const date = parseDateISO(dateStr)
  const weekday = date.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  date.setDate(date.getDate() + mondayOffset)
  return formatDateISO(date)
}

export function getWeekDates(weekStartStr) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStartStr, index))
}

export function formatDayLabel(dateStr) {
  const date = parseDateISO(dateStr)
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatWeekRange(weekStartStr) {
  const end = addDays(weekStartStr, 6)
  const startDate = parseDateISO(weekStartStr)
  const endDate = parseDateISO(end)
  const startLabel = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const endLabel = endDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${startLabel} – ${endLabel}`
}

export function todayISO() {
  return formatDateISO(new Date())
}
