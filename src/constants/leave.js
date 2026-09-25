// Backend `status` values (leave requests) -> UI label.
// Label wahi rakha hai jo statusConfig.js (Badge) mein defined hai.
export const LEAVE_REQUEST_STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled'
}

// Backend `leave_duration_type` values -> UI label.
export const LEAVE_DURATION_LABELS = {
  FULL_DAY: 'Full Day',
  HALF_DAY: 'Half Day'
}

export const LEAVE_DURATION_OPTIONS = Object.entries(LEAVE_DURATION_LABELS).map(([value, label]) => ({ value, label }))

export const LEAVE_REQUEST_TABS = ['Pending', 'Approved', 'Rejected', 'All']