import { FiAlertTriangle, FiCheckCircle, FiClock, FiSun, FiXCircle } from 'react-icons/fi'

export const statusConfig = {
  Active: { label: 'Active', color: 'success', icon: FiCheckCircle },
  'Full Day': { label: 'Full Day', color: 'info', icon: FiCheckCircle },
  'Half Day': { label: 'Half Day', color: 'warning', icon: FiSun },
  'First Half': { label: 'First Half', color: 'teal', icon: FiClock },
  'Second Half': { label: 'Second Half', color: 'secondary', icon: FiClock },
  Inactive: { label: 'Inactive', color: 'danger', icon: FiXCircle },
  Pending: { label: 'Pending', color: 'warning', icon: FiClock },
  Approved: { label: 'Approved', color: 'success', icon: FiCheckCircle },
  Rejected: { label: 'Rejected', color: 'danger', icon: FiXCircle },
  Cancelled: { label: 'Cancelled', color: 'secondary', icon: FiXCircle },
  Present: { label: 'Present', color: 'success', icon: FiCheckCircle },
  Absent: { label: 'Absent', color: 'danger', icon: FiXCircle },
  'Checked In': { label: 'Checked In', color: 'success', icon: FiCheckCircle },
  'Checked Out': { label: 'Checked Out', color: 'info', icon: FiCheckCircle },
  Holiday: { label: 'Holiday', color: 'teal', icon: FiSun },
  Weekend: { label: 'Weekend', color: 'secondary', icon: FiClock },
  Late: { label: 'Late', color: 'warning', icon: FiAlertTriangle },
  'Half-day': { label: 'Half-day', color: 'warning', icon: FiClock },
  WFH: { label: 'WFH', color: 'teal', icon: FiCheckCircle },
  Flagged: { label: 'Flagged', color: 'danger', icon: FiAlertTriangle },
  Enabled: { label: 'Enabled', color: 'teal', icon: FiCheckCircle },
  Disabled: { label: 'Disabled', color: 'warning', icon: FiAlertTriangle },
  'On Leave': { label: 'On Leave', color: 'secondary', icon: FiClock },
  'Log Only': { label: 'Log Only', color: 'teal', icon: FiCheckCircle },
  Revoked: { label: 'Revoked', color: 'warning', icon: FiAlertTriangle }
}