import { apiSlice } from '../apiSlice.js'

function unwrapData(response) {
  return response?.data ?? response
}

// The backend sends date-only fields as ISO timestamps (e.g. 2026-10-01T18:30:00.000Z, which is 2 Oct in IST),
// so the YYYY-MM-DD value is taken in the local timezone.
function toDateOnly(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function toCount(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0
}

function normalizeNextHoliday(holiday) {
  if (!holiday || typeof holiday !== 'object') return null
  const holidayType = String(holiday.holiday_type || holiday.holidayType || 'FULL_DAY').toUpperCase()
  return {
    date: toDateOnly(holiday.holiday_date || holiday.date),
    name: holiday.name || 'Upcoming holiday',
    holidayType,
    holidayTypeLabel: holidayType === 'HALF_DAY' ? 'Half Day' : 'Full Day'
  }
}

export function normalizeDashboard(response) {
  const data = unwrapData(response) || {}
  const attendance = data.attendance_today && typeof data.attendance_today === 'object' ? data.attendance_today : {}
  return {
    date: toDateOnly(data.date),
    totalActiveEmployees: toCount(data.total_active_employees),
    // Every status key sent by the backend is kept, so new statuses show up without a code change.
    attendanceToday: Object.fromEntries(
      Object.entries(attendance).map(([status, count]) => [String(status).toUpperCase(), toCount(count)])
    ),
    lateToday: toCount(data.late_today),
    pendingLeaveRequests: toCount(data.pending_leave_requests),
    pendingDeviceChangeRequests: toCount(data.pending_device_change_requests),
    nextHoliday: normalizeNextHoliday(data.next_holiday)
  }
}

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET {{base_url}}/admin/dashboard
    getDashboard: builder.query({
      query: () => '/admin/dashboard',
      transformResponse: normalizeDashboard,
      // Refreshes automatically after anything that changes these numbers.
      providesTags: [
        { type: 'Employee', id: 'LIST' },
        { type: 'LeaveRequest', id: 'LIST' },
        { type: 'DeviceRequest', id: 'LIST' },
        { type: 'AttendanceOverride', id: 'LIST' },
        { type: 'Holiday', id: 'LIST' }
      ]
    })
  })
})

export const { useGetDashboardQuery } = dashboardApi
