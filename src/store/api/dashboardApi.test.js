import { describe, expect, test } from 'vitest'
import { normalizeDashboard } from './dashboardApi.js'

describe('normalizeDashboard', () => {
  test('normalizes date-only values, status keys, and numeric counts', () => {
    const dashboard = normalizeDashboard({
      data: {
        date: '2026-10-01T18:30:00.000Z',
        total_active_employees: '8',
        attendance_today: { checked_in: '5', absent: -2, unknown_status: '2.4' },
        late_today: '1',
        pending_leave_requests: '2',
        pending_device_change_requests: '3',
        next_holiday: { holiday_date: '2026-10-04T18:30:00.000Z', name: 'Festival', holiday_type: 'half_day' }
      }
    })

    expect(dashboard).toMatchObject({
      date: '2026-10-02',
      totalActiveEmployees: 8,
      attendanceToday: { CHECKED_IN: 5, ABSENT: 0, UNKNOWN_STATUS: 2 },
      lateToday: 1,
      pendingLeaveRequests: 2,
      pendingDeviceChangeRequests: 3,
      nextHoliday: { date: '2026-10-05', name: 'Festival', holidayType: 'HALF_DAY', holidayTypeLabel: 'Half Day' }
    })
  })

  test('uses safe defaults when optional dashboard fields are missing', () => {
    expect(normalizeDashboard({ data: { attendance_today: null } })).toMatchObject({
      date: '',
      totalActiveEmployees: 0,
      attendanceToday: {},
      lateToday: 0,
      pendingLeaveRequests: 0,
      pendingDeviceChangeRequests: 0,
      nextHoliday: null
    })
  })
})
