import { FiAlertTriangle, FiCheckCircle, FiClock, FiSun, FiXCircle } from 'react-icons/fi'

// Object KEY (English) = stable identifier — ise mat badlo, logic isi se match hota hai.
// Screen par dikhne wala text labelKey se aata hai (locales/*/status.json).
// `label` sirf fallback hai (jab translation na mile).
export const statusConfig = {
  Active: { labelKey: 'status:active', label: 'Active', color: 'success', icon: FiCheckCircle },
  'Full Day': { labelKey: 'status:fullDay', label: 'Full Day', color: 'info', icon: FiCheckCircle },
  'Half Day': { labelKey: 'status:halfDay', label: 'Half Day', color: 'warning', icon: FiSun },
  'First Half': { labelKey: 'status:firstHalf', label: 'First Half', color: 'teal', icon: FiClock },
  'Second Half': { labelKey: 'status:secondHalf', label: 'Second Half', color: 'secondary', icon: FiClock },
  Inactive: { labelKey: 'status:inactive', label: 'Inactive', color: 'danger', icon: FiXCircle },
  Pending: { labelKey: 'status:pending', label: 'Pending', color: 'warning', icon: FiClock },
  Approved: { labelKey: 'status:approved', label: 'Approved', color: 'success', icon: FiCheckCircle },
  Rejected: { labelKey: 'status:rejected', label: 'Rejected', color: 'danger', icon: FiXCircle },
  Cancelled: { labelKey: 'status:cancelled', label: 'Cancelled', color: 'secondary', icon: FiXCircle },
  Present: { labelKey: 'status:present', label: 'Present', color: 'success', icon: FiCheckCircle },
  Absent: { labelKey: 'status:absent', label: 'Absent', color: 'danger', icon: FiXCircle },
  'Checked In': { labelKey: 'status:checkedIn', label: 'Checked In', color: 'success', icon: FiCheckCircle },
  'Checked Out': { labelKey: 'status:checkedOut', label: 'Checked Out', color: 'info', icon: FiCheckCircle },
  Holiday: { labelKey: 'status:holiday', label: 'Holiday', color: 'teal', icon: FiSun },
  Weekend: { labelKey: 'status:weekend', label: 'Weekend', color: 'secondary', icon: FiClock },
  Late: { labelKey: 'status:late', label: 'Late', color: 'warning', icon: FiAlertTriangle },
  'Half-day': { labelKey: 'status:halfDayShort', label: 'Half-day', color: 'warning', icon: FiClock },
  WFH: { labelKey: 'status:wfh', label: 'WFH', color: 'teal', icon: FiCheckCircle },
  Flagged: { labelKey: 'status:flagged', label: 'Flagged', color: 'danger', icon: FiAlertTriangle },
  Enabled: { labelKey: 'status:enabled', label: 'Enabled', color: 'teal', icon: FiCheckCircle },
  Disabled: { labelKey: 'status:disabled', label: 'Disabled', color: 'warning', icon: FiAlertTriangle },
  'On Leave': { labelKey: 'status:onLeave', label: 'On Leave', color: 'secondary', icon: FiClock },
  'Log Only': { labelKey: 'status:logOnly', label: 'Log Only', color: 'teal', icon: FiCheckCircle },
  Revoked: { labelKey: 'status:revoked', label: 'Revoked', color: 'warning', icon: FiAlertTriangle }
}