import { apiSlice } from '../apiSlice.js'

function unwrapData(response) {
  return response?.data ?? response
}

function unwrapCollection(response) {
  const data = unwrapData(response)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
}

function unwrapPagination(response, count) {
  const data = unwrapData(response)
  return data?.pagination || { page: 1, limit: 30, total: count, total_pages: 1 }
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeSuspiciousAttempt(item = {}) {
  return {
    id: item.suspicious_attempt_id,
    employeeId: item.employee_id,
    employeeCode: item.employee_code || '',
    employeeName: item.employee_name || '',
    action: item.action || '', // CHECK_IN | CHECK_OUT
    type: item.type || '', // MOCK_LOCATION ...
    isBlocked: Boolean(Number(item.is_blocked)),
    latitude: toNumber(item.latitude),
    longitude: toNumber(item.longitude),
    accuracy: toNumber(item.accuracy),
    deviceId: item.device_id || '',
    locationTimestamp: item.location_timestamp || '',
    attendanceDate: item.attendance_date || '',
    createdAt: item.created_at || ''
  }
}

export const suspiciousAttemptsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /admin/attendance/suspicious-attempts?page=1&limit=30
    getSuspiciousAttempts: builder.query({
      query: ({ page = 1, limit = 30 } = {}) => ({
        url: '/admin/attendance/suspicious-attempts',
        params: { page, limit }
      }),
      transformResponse: (response) => {
        const items = unwrapCollection(response).map(normalizeSuspiciousAttempt)
        return { items, pagination: unwrapPagination(response, items.length) }
      },
      providesTags: ['SuspiciousAttempt']
    })
  })
})

export const { useGetSuspiciousAttemptsQuery } = suspiciousAttemptsApi