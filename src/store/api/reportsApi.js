import { apiSlice } from '../apiSlice.js'

function unwrapData(response) {
  return response?.data ?? response
}

function unwrapPagination(response) {
  const data = unwrapData(response)
  return data?.pagination || { page: 1, limit: 20, total: (data?.items || []).length, total_pages: 1 }
}

// Backend date/timestamp fields IST offset ke saath aate hain, isliye local
// timezone se hi YYYY-MM-DD nikalte hain (leaveApi.js jaisa hi pattern).
function toDateOnly(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/* ------------------------------ Daily ------------------------------ */

function normalizeDailyRow(row = {}) {
  return {
    id: row.attendance_id,
    employeeId: row.employee_id,
    employeeCode: row.employee_code,
    employeeName: row.employee_name,
    date: toDateOnly(row.attendance_date),
    status: row.status,
    expectedLogin: row.expected_login_time,
    expectedLogout: row.expected_logout_time,
    checkIn: row.actual_check_in,
    checkOut: row.actual_check_out,
    lateMinutes: Number(row.late_minutes ?? 0),
    earlyMinutes: Number(row.early_checkout_minutes ?? 0),
    workedMinutes: Number(row.worked_minutes ?? 0),
    isAutoCheckout: Boolean(row.is_auto_checkout)
  }
}

/* ----------------------------- Monthly ------------------------------ */

function normalizeMonthlyRow(row = {}) {
  return {
    id: row.employee_id,
    employeeId: row.employee_id,
    employeeCode: row.employee_code,
    name: row.name,
    workingDays: row.working_days,
    presentDays: row.present_days,
    absentDays: row.absent_days,
    leaveDays: row.leave_days,
    holidayDays: row.holiday_days,
    lateCount: row.late_count,
    totalLateMinutes: row.total_late_minutes,
    earlyCount: row.early_count,
    totalEarlyMinutes: row.total_early_minutes,
    workedHours: row.worked_hours
  }
}

/* ------------------------------- Late -------------------------------- */

function normalizeLateRow(row = {}, index = 0) {
  return {
    id: `${row.employee_code}-${toDateOnly(row.attendance_date)}-${index}`,
    date: toDateOnly(row.attendance_date),
    employeeCode: row.employee_code,
    employeeName: row.employee_name,
    expectedLogin: row.expected_login_time,
    checkIn: row.actual_check_in,
    lateMinutes: Number(row.late_minutes ?? 0)
  }
}

/* ------------------------------ Leave -------------------------------- */

function normalizeLeaveRow(row = {}, index = 0) {
  return {
    id: `${row.employee_code}-${toDateOnly(row.start_date)}-${index}`,
    employeeCode: row.employee_code,
    employeeName: row.employee_name,
    leaveTypeName: row.leave_type_name,
    startDate: toDateOnly(row.start_date),
    endDate: toDateOnly(row.end_date),
    durationType: row.leave_duration_type,
    totalDays: Number(row.total_days ?? 0),
    status: row.status,
    reason: row.reason || '',
    rejectionReason: row.rejection_reason || '',
    reviewedByName: row.reviewed_by_name || '',
    reviewedAt: row.reviewed_at
  }
}

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET {{base_url}}/admin/reports/daily?date=&page=&limit=
    getDailyReport: builder.query({
      query: ({ date, page = 1, limit = 20 } = {}) => ({
        url: '/admin/reports/daily',
        params: { date, page, limit }
      }),
      transformResponse: (response) => {
        const data = unwrapData(response)
        return {
          date: data?.date,
          items: (data?.items || []).map(normalizeDailyRow),
          pagination: unwrapPagination(response)
        }
      },
      providesTags: [{ type: 'Report', id: 'DAILY' }]
    }),

    // GET {{base_url}}/admin/reports/monthly?year=&month=
    getMonthlyReport: builder.query({
      query: ({ year, month } = {}) => ({
        url: '/admin/reports/monthly',
        params: { year, month }
      }),
      transformResponse: (response) => {
        const data = unwrapData(response)
        return {
          year: data?.year,
          month: data?.month,
          weekendDays: data?.weekend_days,
          holidayDays: data?.holiday_days,
          items: (data?.items || []).map(normalizeMonthlyRow)
        }
      },
      providesTags: [{ type: 'Report', id: 'MONTHLY' }]
    }),

    // GET {{base_url}}/admin/reports/late?year=&month=&page=&limit=
    getLateReport: builder.query({
      query: ({ year, month, page = 1, limit = 20 } = {}) => ({
        url: '/admin/reports/late',
        params: { year, month, page, limit }
      }),
      transformResponse: (response) => ({
        items: (unwrapData(response)?.items || []).map(normalizeLateRow),
        pagination: unwrapPagination(response)
      }),
      providesTags: [{ type: 'Report', id: 'LATE' }]
    }),

    // GET {{base_url}}/admin/reports/leave?year=&month=&page=&limit=
    getLeaveReport: builder.query({
      query: ({ year, month, page = 1, limit = 20 } = {}) => ({
        url: '/admin/reports/leave',
        params: { year, month, page, limit }
      }),
      transformResponse: (response) => ({
        items: (unwrapData(response)?.items || []).map(normalizeLeaveRow),
        pagination: unwrapPagination(response)
      }),
      providesTags: [{ type: 'Report', id: 'LEAVE' }]
    })
  })
})

export const {
  useGetDailyReportQuery,
  useGetMonthlyReportQuery,
  useGetLateReportQuery,
  useGetLeaveReportQuery
} = reportsApi