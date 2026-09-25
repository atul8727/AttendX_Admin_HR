import { apiSlice } from '../apiSlice.js'
import { OVERRIDE_STATUS_LABELS } from '../../constants/attendanceOverride.js'

function unwrapData(response) {
  return response?.data ?? response
}

function unwrapCollection(response) {
  const data = unwrapData(response)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.results)) return data.results
  return []
}

function unwrapPagination(response) {
  const data = unwrapData(response)
  return data?.pagination || { page: 1, limit: 20, total: unwrapCollection(response).length, total_pages: 1 }
}

// Backend date-only field ko ISO timestamp (e.g. 2026-10-04T18:30:00.000Z) bhejta hai,
// jo IST mein 2026-10-05 hai. Isliye local timezone se YYYY-MM-DD nikalte hain.
function toDateOnly(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function toStatusLabel(key) {
  if (!key) return ''
  if (OVERRIDE_STATUS_LABELS[key]) return OVERRIDE_STATUS_LABELS[key]
  const words = key.replace(/_/g, ' ').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function normalizeOverride(item = {}) {
  const status = item.status ? String(item.status).toUpperCase() : ''
  return {
    id: item.attendance_status_override_id ?? item.id,
    employeeId: item.employee_id,
    attendanceDate: toDateOnly(item.attendance_date),
    status, // raw backend value: ABSENT, HALF_DAY ...
    statusLabel: toStatusLabel(status), // Badge ke liye: Absent, Half-day ...
    reason: item.reason || '',
    setByAdminId: item.set_by_admin_id ?? null,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

export const attendanceOverridesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET {{base_url}}/admin/attendance/overrides?employee_id=&from=&to=&page=&limit=
    getAttendanceOverrides: builder.query({
      query: ({ employeeId = '', from = '', to = '', page = 1, limit = 20 } = {}) => ({
        url: '/admin/attendance/overrides',
        params: {
          page,
          limit,
          ...(employeeId ? { employee_id: employeeId } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {})
        }
      }),
      transformResponse: (response) => ({
        items: unwrapCollection(response).map(normalizeOverride),
        pagination: unwrapPagination(response)
      }),
      providesTags: (result) => [
        { type: 'AttendanceOverride', id: 'LIST' },
        ...(result?.items || []).map((item) => ({ type: 'AttendanceOverride', id: item.id }))
      ]
    }),

    // POST {{base_url}}/admin/attendance/overrides  body: { employee_id, attendance_date, status, reason }
    createAttendanceOverride: builder.mutation({
      query: ({ employeeId, attendanceDate, status, reason }) => ({
        url: '/admin/attendance/overrides',
        method: 'POST',
        body: {
          employee_id: Number.isNaN(Number(employeeId)) ? employeeId : Number(employeeId),
          attendance_date: attendanceDate,
          status,
          reason
        }
      }),
      transformResponse: (response) => normalizeOverride(unwrapData(response)),
      invalidatesTags: [{ type: 'AttendanceOverride', id: 'LIST' }]
    }),

    // DELETE {{base_url}}/admin/attendance/overrides/{id}
    deleteAttendanceOverride: builder.mutation({
      query: (id) => ({
        url: `/admin/attendance/overrides/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AttendanceOverride', id },
        { type: 'AttendanceOverride', id: 'LIST' }
      ]
    })
  })
})

export const {
  useGetAttendanceOverridesQuery,
  useCreateAttendanceOverrideMutation,
  useDeleteAttendanceOverrideMutation
} = attendanceOverridesApi