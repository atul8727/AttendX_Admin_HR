// Backend `status` values (POST /admin/attendance/overrides) -> English label.
// Ye labels statusConfig.js (Badge) ke keys se match hote hain aur attendanceOverridesApi.js
// inhe use karta hai, isliye inhe mat badlo. Screen par Hindi/English text labelKey se aata hai.
export const OVERRIDE_STATUS_LABELS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half-day',
  ON_LEAVE: 'On Leave'
}

// Dropdown options. Object KEY = backend value, `labelKey` = locales/*/status.json ki key.
// `label` sirf fallback hai. Component me t(labelKey) se text banta hai, taaki language badalne par update ho.
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