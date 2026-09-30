// Weekday values backend ke hain (MON..SUN). Label i18n se aata hai: offices:weekdays.<VALUE>
export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// Timezone IANA identifiers hain (technical values), isliye translate nahi hote.
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

// t = useTranslation('offices') ka t. Weekday pehchaan na aaye to raw value hi dikha dete hain.
export function getWeekdayLabel(value, t, short = false) {
  if (!WEEKDAYS.includes(value)) return value || '-'
  return t(`${short ? 'weekdaysShort' : 'weekdays'}.${value}`)
}

export function getWeekdayOptions(t) {
  return WEEKDAYS.map((value) => ({ value, label: t(`weekdays.${value}`) }))
}

export function formatCoordinate(value) {
  return value === null || value === undefined ? '-' : Number(value).toFixed(6)
}

export function getMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

function isNumberInRange(value, min, max) {
  if (String(value).trim() === '') return false
  const number = Number(value)
  return Number.isFinite(number) && number >= min && number <= max
}

// t = useTranslation('offices') ka t. Errors object return karta hai. Khaali object = form valid hai.
export function validateOfficeForm(values, t) {
  const errors = {}
  const name = String(values.name || '').trim()

  if (!name) errors.name = t('validation.nameRequired')
  else if (name.length < 2) errors.name = t('validation.nameShort')

  if (!isNumberInRange(values.latitude, -90, 90)) errors.latitude = t('validation.latitude')
  if (!isNumberInRange(values.longitude, -180, 180)) errors.longitude = t('validation.longitude')
  if (!isNumberInRange(values.allowedRadius, 1, 10000)) errors.allowedRadius = t('validation.allowedRadius')
  if (!isNumberInRange(values.maxGpsAccuracy, 1, 1000)) errors.maxGpsAccuracy = t('validation.maxGpsAccuracy')
  if (!values.weeklyOff) errors.weeklyOff = t('validation.weeklyOff')
  if (!values.timezone) errors.timezone = t('validation.timezone')

  return errors
}