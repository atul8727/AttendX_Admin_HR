const IST = 'Asia/Kolkata'

export function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

// 5404 -> "90h 4m", 7 -> "7m", 0 -> "0m"
export function formatMinutes(value) {
  const total = Math.round(toNumber(value))
  if (total <= 0) return '0m'
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (!hours) return `${minutes}m`
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}

// 25 -> "25 min", 295 -> "4h 55 min", 120 -> "2h", 0 -> "0 min"
export function formatDurationMin(value) {
  const total = Math.round(toNumber(value))
  if (total <= 0) return '0 min'
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (!hours) return `${minutes} min`
  return minutes ? `${hours}h ${minutes} min` : `${hours}h`
}

// "2026-10-16T04:22:57.000Z" -> "09:52" (office time = IST)
export function formatClock(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 5)
  return new Intl.DateTimeFormat('en-GB', { timeZone: IST, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)
}

// "10:00:00" -> "10:00"
export function formatShortTime(value) {
  if (!value) return '-'
  return String(value).slice(0, 5)
}

// CHECKED_IN -> "Checked In"
export function statusLabel(raw) {
  if (!raw) return ''
  return String(raw)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

export function padMonth(month) {
  return String(month).padStart(2, '0')
}

export function periodKey(year, month) {
  return `${year}-${padMonth(month)}`
}