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

export function startOfMonth(dateStr) {
  const date = parseDateISO(dateStr)
  return formatDateISO(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function endOfMonth(dateStr) {
  const date = parseDateISO(dateStr)
  return formatDateISO(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function addMonths(dateStr, months) {
  const date = parseDateISO(dateStr)
  date.setMonth(date.getMonth() + months)
  return formatDateISO(date)
}

export function getMonthGridDates(dateStr) {
  const monthStart = startOfMonth(dateStr)
  const monthEnd = endOfMonth(dateStr)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = addDays(startOfWeek(monthEnd), 6)

  const dates = []
  let current = gridStart
  while (current <= gridEnd) {
    dates.push(current)
    current = addDays(current, 1)
  }
  return dates
}

export function formatMonthLabel(dateStr) {
  const date = parseDateISO(startOfMonth(dateStr))
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function formatDayNumber(dateStr) {
  return String(parseDateISO(dateStr).getDate())
}

export function isSameMonth(dateStr, monthAnchorStr) {
  const date = parseDateISO(dateStr)
  const anchor = parseDateISO(monthAnchorStr)
  return date.getFullYear() === anchor.getFullYear() && date.getMonth() === anchor.getMonth()
}

export function getWeekdayLabels() {
  const labels = []
  const monday = startOfWeek(todayISO())
  for (let index = 0; index < 7; index += 1) {
    labels.push(formatDayLabel(addDays(monday, index)).split(',')[0])
  }
  return labels
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
