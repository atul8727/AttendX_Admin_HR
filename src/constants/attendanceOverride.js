// Backend `status` values (POST /admin/attendance/overrides) -> English label.
// Ye labels statusConfig.js (Badge) ke keys se match hote hain, isliye inhe mat badlo.
// Screen par Hindi/English text labelKey se aata hai.
export const OVERRIDE_STATUS_LABELS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half-day',
  ON_LEAVE: 'On Leave'
}

const OVERRIDE_STATUS_LABEL_KEYS = {
  PRESENT: 'status:present',
  ABSENT: 'status:absent',
  HALF_DAY: 'status:halfDayShort',
  ON_LEAVE: 'status:onLeave'
}

export const OVERRIDE_STATUS_OPTIONS = Object.entries(OVERRIDE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
  labelKey: OVERRIDE_STATUS_LABEL_KEYS[value]
}))

// Raw backend status ("ON_LEAVE", "CHECKED_OUT") -> Badge label ("On Leave", "Checked Out").
export function toBadgeLabel(raw) {
  const key = String(raw || '').trim().toUpperCase()
  if (!key) return ''
  if (OVERRIDE_STATUS_LABELS[key]) return OVERRIDE_STATUS_LABELS[key]
  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}