import { FiCalendar, FiClock, FiGift, FiLogIn, FiLogOut, FiSun, FiUserX } from 'react-icons/fi'

// Display order, label, icon and color for each attendance status sent by /admin/dashboard.
// `color` is a theme token (see index.css); `tone` is the matching set of Tailwind classes.
export const ATTENDANCE_STATUS_META = {
  CHECKED_IN: { label: 'Checked In', icon: FiLogIn, color: 'success', tone: 'bg-success/10 text-success', dot: 'bg-success' },
  CHECKED_OUT: { label: 'Checked Out', icon: FiLogOut, color: 'info', tone: 'bg-info/10 text-info', dot: 'bg-info' },
  NOT_CHECKED_IN: { label: 'Not Checked In', icon: FiClock, color: 'warning', tone: 'bg-warning/15 text-warning', dot: 'bg-warning' },
  ABSENT: { label: 'Absent', icon: FiUserX, color: 'danger', tone: 'bg-danger/10 text-danger', dot: 'bg-danger' },
  ON_LEAVE: { label: 'On Leave', icon: FiCalendar, color: 'secondary', tone: 'bg-secondary/10 text-secondary', dot: 'bg-secondary' },
  HALF_DAY_LEAVE: { label: 'Half Day Leave', icon: FiSun, color: 'teal', tone: 'bg-teal/10 text-teal', dot: 'bg-teal' },
  HOLIDAY: { label: 'Holiday', icon: FiGift, color: 'primary', tone: 'bg-primary/10 text-primary', dot: 'bg-primary' },
  HALF_DAY_HOLIDAY: { label: 'Half Day Holiday', icon: FiGift, color: 'muted', tone: 'bg-app-muted/15 text-app-muted', dot: 'bg-app-muted' }
}

// Used for any status the backend adds later that is not listed above.
export const UNKNOWN_STATUS_META = { icon: FiClock, color: 'muted', tone: 'bg-app-muted/15 text-app-muted', dot: 'bg-app-muted' }

export function getAttendanceStatusMeta(status) {
  const known = ATTENDANCE_STATUS_META[status]
  if (known) return known
  const label = status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase())
  return { ...UNKNOWN_STATUS_META, label }
}