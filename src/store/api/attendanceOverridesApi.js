import { apiSlice } from '../apiSlice.js'
import { OVERRIDE_STATUS_LABELS, toBadgeLabel } from '../../constants/attendanceOverride.js'

const OVERRIDES_URL = '/admin/attendance/overrides'
const BY_DATE_PAGE_SIZE = 100
const BY_DATE_MAX_PAGES = 10

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

// Backend date-only field ko ISO timestamp bhej sakta hai (IST me din badal jata hai),
// isliye local timezone se YYYY-MM-DD nikalte hain.
function toDateOnly(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function normalizeOverride(item = {}) {
  const status = item.status ? String(item.status).trim().toUpperCase() : ''
  return {
    id: item.attendance_status_override_id ?? item.id,
    employeeId: item.employee_id,
    attendanceDate: toDateOnly(item.attendance_date),
    status, // raw backend value: ABSENT, HALF_DAY ...
    statusLabel: OVERRIDE_STATUS_LABELS[status] || toBadgeLabel(status), // Badge ke liye
    reason: item.reason || '',
    setByAdminId: item.set_by_admin_id ?? null,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

// Daily / monthly report ke status override se badal sakte hain, isliye unhe bhi refresh karte hain.
const REPORT_TAGS = [
  { type: 'Report', id: 'DAILY' },
  { type: 'Report', id: 'MONTHLY' }
]

export const attendanceOverridesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET {{base_url}}/admin/attendance/overrides?employee_id=&from=&to=&page=&limit=
    getAttendanceOverrides: builder.query({
      query: ({ employeeId = '', from = '', to = '', page = 1, limit = 20 } = {}) => ({
        url: OVERRIDES_URL,
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

    // Ek din ke SAARE overrides (saare pages). Daily attendance list me merge karne ke kaam aata hai.
    // arg = 'YYYY-MM-DD'
    getOverridesByDate: builder.query({
      async queryFn(date, _api, _extra, baseQuery) {
        const items = []
        let page = 1
        let totalPages = 1
        do {
          const result = await baseQuery({
            url: OVERRIDES_URL,
            params: { from: date, to: date, page, limit: BY_DATE_PAGE_SIZE }
          })
          if (result.error) return { error: result.error }
          items.push(...unwrapCollection(result.data).map(normalizeOverride))
          totalPages = Number(unwrapPagination(result.data).total_pages) || 1
          page += 1
        } while (page <= totalPages && page <= BY_DATE_MAX_PAGES)
        return { data: items.filter((item) => item.attendanceDate === date) }
      },
      providesTags: [{ type: 'AttendanceOverride', id: 'LIST' }]
    }),

    // POST {{base_url}}/admin/attendance/overrides  body: { employee_id, attendance_date, status, reason }
    // Backend ke sirf 3 override API hain: GET (list), POST (add), DELETE (remove). Edit/update API nahi hai.
    createAttendanceOverride: builder.mutation({
      query: ({ employeeId, attendanceDate, status, reason }) => ({
        url: OVERRIDES_URL,
        method: 'POST',
        body: {
          employee_id: Number.isNaN(Number(employeeId)) ? employeeId : Number(employeeId),
          attendance_date: attendanceDate,
          status: String(status || '').trim().toUpperCase(), // backend sirf PRESENT / ABSENT / HALF_DAY / ON_LEAVE leta hai
          reason: String(reason || '').trim()
        }
      }),
      transformResponse: (response) => normalizeOverride(unwrapData(response)),
      invalidatesTags: [{ type: 'AttendanceOverride', id: 'LIST' }, ...REPORT_TAGS]
    }),

    // DELETE {{base_url}}/admin/attendance/overrides/{id}
    deleteAttendanceOverride: builder.mutation({
      query: (id) => ({
        url: `${OVERRIDES_URL}/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AttendanceOverride', id },
        { type: 'AttendanceOverride', id: 'LIST' },
        ...REPORT_TAGS
      ]
    })
  })
})

export const {
  useGetAttendanceOverridesQuery,
  useGetOverridesByDateQuery,
  useCreateAttendanceOverrideMutation,
  useDeleteAttendanceOverrideMutation
} = attendanceOverridesApi