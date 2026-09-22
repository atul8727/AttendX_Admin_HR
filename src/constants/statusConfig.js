import { FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi'

export const statusConfig = {
  Active: { label: 'Active', color: 'success', icon: FiCheckCircle },
  Inactive: { label: 'Inactive', color: 'danger', icon: FiXCircle },
  Pending: { label: 'Pending', color: 'warning', icon: FiClock },
  Approved: { label: 'Approved', color: 'success', icon: FiCheckCircle },
  Rejected: { label: 'Rejected', color: 'danger', icon: FiXCircle },
  Present: { label: 'Present', color: 'success', icon: FiCheckCircle },
  Absent: { label: 'Absent', color: 'danger', icon: FiXCircle },
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
