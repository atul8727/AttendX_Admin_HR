// Backend `status` values (POST /admin/attendance/overrides) -> UI label.
// Label wahi rakha hai jo statusConfig.js (Badge) mein defined hai.
export const OVERRIDE_STATUS_LABELS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half-day',
  ON_LEAVE: 'On Leave'
}

export const OVERRIDE_STATUS_OPTIONS = Object.entries(OVERRIDE_STATUS_LABELS).map(([value, label]) => ({ value, label }))