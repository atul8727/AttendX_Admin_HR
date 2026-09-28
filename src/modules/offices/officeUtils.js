export const WEEKDAY_OPTIONS = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
  { value: 'SAT', label: 'Saturday' },
  { value: 'SUN', label: 'Sunday' }
]

export const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC'
].map((zone) => ({ value: zone, label: zone }))

// Form ki default values (backend ke Postman examples ke hisaab se)
export const DEFAULT_OFFICE_FORM = {
  name: '',
  latitude: '',
  longitude: '',
  allowedRadius: '100',
  maxGpsAccuracy: '50',
  weeklyOff: 'SUN',
  timezone: 'Asia/Kolkata'
}

export function toFormValues(office) {
  return {
    name: office.name,
    latitude: office.latitude === null ? '' : String(office.latitude),
    longitude: office.longitude === null ? '' : String(office.longitude),
    allowedRadius: String(office.allowedRadius),
    maxGpsAccuracy: String(office.maxGpsAccuracy),
    weeklyOff: office.weeklyOff,
    timezone: office.timezone
  }
}

export function getWeekdayLabel(value) {
  return WEEKDAY_OPTIONS.find((option) => option.value === value)?.label || value || '-'
}

export function getApiErrorMessage(error) {
  const data = error?.data
  return (
    data?.message ||
    data?.error?.message ||
    (typeof data?.error === 'string' ? data.error : '') ||
    data?.error?.code ||
    error?.error ||
    error?.message ||
    ''
  )
}

export function formatCoordinate(value) {
  return value === null || value === undefined ? '-' : Number(value).toFixed(6)
}

export function getMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function isNumberInRange(value, min, max) {
  if (String(value).trim() === '') return false
  const number = Number(value)
  return Number.isFinite(number) && number >= min && number <= max
}

// Errors object return karta hai. Khaali object = form valid hai.
export function validateOfficeForm(values) {
  const errors = {}
  const name = String(values.name || '').trim()

  if (!name) errors.name = 'Office name zaroori hai.'
  else if (name.length < 2) errors.name = 'Office name kam se kam 2 characters ka hona chahiye.'

  if (!isNumberInRange(values.latitude, -90, 90)) errors.latitude = 'Latitude -90 se 90 ke beech hona chahiye.'
  if (!isNumberInRange(values.longitude, -180, 180)) errors.longitude = 'Longitude -180 se 180 ke beech hona chahiye.'
  if (!isNumberInRange(values.allowedRadius, 1, 10000)) errors.allowedRadius = 'Radius 1 se 10000 meter ke beech hona chahiye.'
  if (!isNumberInRange(values.maxGpsAccuracy, 1, 1000)) errors.maxGpsAccuracy = 'GPS accuracy 1 se 1000 meter ke beech honi chahiye.'
  if (!values.weeklyOff) errors.weeklyOff = 'Weekly off select karo.'
  if (!values.timezone) errors.timezone = 'Timezone select karo.'

  return errors
}