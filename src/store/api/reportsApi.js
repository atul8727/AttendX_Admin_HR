import { apiSlice } from '../apiSlice.js'
import { toNumber } from '../../lib/reportFormat.js'


const PAGE_LIMIT = 50
const MAX_PAGES = 40

function unwrapData(response) {
  return response?.data ?? response
}

// Backend dates IST offset ke saath aati hain, isliye local timezone se YYYY-MM-DD nikalte hain.
function toDateOnly(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function withEmployee(params, employeeId) {
  return employeeId ? { ...params, employee_id: employeeId } : params
}

async function fetchAllPages(baseQuery, { url, params, normalize }) {
  const items = []
  let first = null
  let page = 1
  let totalPages = 1

  do {
    const result = await baseQuery({ url, params: { ...params, page, limit: PAGE_LIMIT } })
    if (result.error) return { error: result.error }
    const data = unwrapData(result.data)
    if (!first) first = data
    const start = items.length
    items.push(...(data?.items || []).map((row, index) => normalize(row, start + index)))
    totalPages = Number(data?.pagination?.total_pages) || 1
    page += 1
  } while (page <= totalPages && page <= MAX_PAGES)

  return {
    data: {
      date: first?.date,
      items,
      pagination: { page: 1, limit: items.length, total: items.length, total_pages: 1 }
    }
  }
}

/* ------------------------------ Daily ------------------------------ */
// GET /admin/reports/daily?date=YYYY-MM-DD&page=&limit=

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
    lateMinutes: toNumber(row.late_minutes),
    earlyMinutes: toNumber(row.early_checkout_minutes), // jaldi JAANE ke minutes
    earlyCheckinMinutes: toNumber(row.early_checkin_minutes), // agar kabhi daily API bheje
    workedMinutes: row.worked_minutes === null || row.worked_minutes === undefined ? null : toNumber(row.worked_minutes),
    isAutoCheckout: Boolean(row.is_auto_checkout)
  }
}

/* ----------------------------- Monthly ------------------------------ */
// GET /admin/reports/monthly?year=&month=&employee_id=

function normalizeMonthlyRow(row = {}) {
  const fullLeave = toNumber(row.full_leave_days)
  const halfLeave = toNumber(row.half_leave_days)
  const fullHoliday = toNumber(row.full_holiday_days)
  const halfHoliday = toNumber(row.half_holiday_days)

  return {
    id: row.employee_id,
    employeeId: row.employee_id,
    employeeCode: row.employee_code,
    employeeName: row.employee_name,
    presentDays: toNumber(row.present_days),
    absentDays: toNumber(row.missed_days) + toNumber(row.override_absent_days),
    fullLeaveDays: fullLeave,
    halfLeaveDays: halfLeave,
    leaveDays: fullLeave + halfLeave * 0.5,
    holidayDays: fullHoliday + halfHoliday * 0.5,
    lateCount: toNumber(row.late_count),
    totalLateMinutes: toNumber(row.total_late_minutes),
    earlyCount: toNumber(row.early_count),
    totalEarlyMinutes: toNumber(row.total_early_minutes),
    earlyCheckoutCount: toNumber(row.early_checkout_count),
    totalEarlyCheckoutMinutes: toNumber(row.total_early_checkout_minutes),
    workedMinutes: toNumber(row.total_worked_minutes)
  }
}

/* ------------------------------- Late -------------------------------- */
// GET /admin/reports/late?year=&month=&employee_id=&page=&limit=

function normalizeLateRow(row = {}, index = 0) {
  return {
    id: `${row.employee_code}-${toDateOnly(row.attendance_date)}-${index}`,
    date: toDateOnly(row.attendance_date),
    employeeCode: row.employee_code,
    employeeName: row.employee_name,
    expectedLogin: row.expected_login_time,
    checkIn: row.actual_check_in,
    lateMinutes: toNumber(row.late_minutes),
    lateDisplay: row.late_display
  }
}

/* ------------------------------- Early -------------------------------- */
// GET /admin/reports/early?year=&month=&employee_id=&page=&limit=

function normalizeEarlyRow(row = {}, index = 0) {
  return {
    id: `${row.employee_code}-${toDateOnly(row.attendance_date)}-${index}`,
    date: toDateOnly(row.attendance_date),
    employeeCode: row.employee_code,
    employeeName: row.employee_name,
    expectedLogin: row.expected_login_time,
    checkIn: row.actual_check_in,
    earlyMinutes: toNumber(row.early_checkin_minutes),
    earlyDisplay: row.early_display
  }
}

/* ------------------------------ Leave -------------------------------- */
// GET /admin/reports/leave?year=&month=&employee_id=&status=&page=&limit=

function normalizeLeaveRow(row = {}, index = 0) {
  return {
    id: `${row.employee_code}-${toDateOnly(row.start_date)}-${index}`,
    employeeCode: row.employee_code,
    employeeName: row.employee_name,
    leaveTypeName: row.leave_type_name || row.leave_type || '',
    startDate: toDateOnly(row.start_date),
    endDate: toDateOnly(row.end_date),
    durationType: row.leave_duration_type,
    totalDays: toNumber(row.total_days),
    status: row.status,
    reason: row.reason || '',
    rejectionReason: row.rejection_reason || '',
    reviewedByName: row.reviewed_by_name || '',
    reviewedAt: row.reviewed_at
  }
}

const monthParams = ({ year, month, employeeId } = {}) => withEmployee({ year, month }, employeeId)

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDailyReport: builder.query({
      queryFn: ({ date, fromDate } = {}, _api, _extra, baseQuery) =>
        fetchAllPages(baseQuery, { url: '/admin/reports/daily', params: { date: date || fromDate }, normalize: normalizeDailyRow }),
      providesTags: [{ type: 'Report', id: 'DAILY' }]
    }),

    getMonthlyReport: builder.query({
      query: (arg) => ({ url: '/admin/reports/monthly', params: monthParams(arg) }),
      transformResponse: (response) => {
        const data = unwrapData(response)
        return {
          year: data?.year,
          month: data?.month,
          weekendDays: toNumber(data?.weekend_days),
          holidayDays: toNumber(data?.holiday_days),
          items: (data?.items || []).map(normalizeMonthlyRow)
        }
      },
      providesTags: [{ type: 'Report', id: 'MONTHLY' }]
    }),

    getLateReport: builder.query({
      queryFn: (arg, _api, _extra, baseQuery) =>
        fetchAllPages(baseQuery, { url: '/admin/reports/late', params: monthParams(arg), normalize: normalizeLateRow }),
      providesTags: [{ type: 'Report', id: 'LATE' }]
    }),

    getEarlyReport: builder.query({
      queryFn: (arg, _api, _extra, baseQuery) =>
        fetchAllPages(baseQuery, { url: '/admin/reports/early', params: monthParams(arg), normalize: normalizeEarlyRow }),
      providesTags: [{ type: 'Report', id: 'EARLY' }]
    }),

    getLeaveReport: builder.query({
      queryFn: (arg, _api, _extra, baseQuery) =>
        fetchAllPages(baseQuery, { url: '/admin/reports/leave', params: monthParams(arg), normalize: normalizeLeaveRow }),
      providesTags: [{ type: 'Report', id: 'LEAVE' }]
    })
  })
})

export const {
  useGetDailyReportQuery,
  useGetMonthlyReportQuery,
  useGetLateReportQuery,
  useGetEarlyReportQuery,
  useGetLeaveReportQuery
} = reportsApi