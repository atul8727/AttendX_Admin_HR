import { apiSlice } from '../apiSlice.js'

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
  return data?.pagination || { page: 1, limit: 50, total: unwrapCollection(response).length, total_pages: 1 }
}

// Backend date-only field ko ISO timestamp (e.g. 2026-10-08T18:30:00.000Z) bhejta hai,
// jo IST mein 2026-10-09 hai. Isliye local timezone se YYYY-MM-DD nikalte hain.
function toDateOnly(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function normalizeStatus(status) {
  if (!status) return 'Active'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function normalizeHalfDayPeriod(period) {
  if (!period) return ''
  return period === 'FIRST_HALF' ? 'First Half' : 'Second Half'
}

function normalizeHoliday(holiday = {}) {
  const holidayType = holiday.holiday_type || 'FULL_DAY'
  return {
    id: holiday.holiday_id ?? holiday.id,
    date: toDateOnly(holiday.holiday_date),
    name: holiday.name || '',
    holidayType, // raw backend value: FULL_DAY, HALF_DAY
    holidayTypeLabel: holidayType === 'HALF_DAY' ? 'Half Day' : 'Full Day',
    halfDayPeriod: holiday.half_day_period || '',
    halfDayPeriodLabel: normalizeHalfDayPeriod(holiday.half_day_period),
    status: normalizeStatus(holiday.status),
    createdAt: holiday.created_at,
    updatedAt: holiday.updated_at,
    deletedAt: holiday.deleted_at ?? null
  }
}

function holidayPayload(form) {
  const payload = {
    holiday_date: form.date,
    name: form.name,
    holiday_type: form.holidayType
  }
  if (form.holidayType === 'HALF_DAY') {
    payload.half_day_period = form.halfDayPeriod || 'FIRST_HALF'
  }
  return payload
}

export const holidaysApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET {{base_url}}/admin/holidays?year=&page=&limit=
    getHolidays: builder.query({
      query: ({ year = '', page = 1, limit = 50 } = {}) => ({
        url: '/admin/holidays',
        params: {
          page,
          limit,
          ...(year ? { year } : {})
        }
      }),
      transformResponse: (response) => ({
        items: unwrapCollection(response).map(normalizeHoliday),
        pagination: unwrapPagination(response)
      }),
      providesTags: (result) => [
        { type: 'Holiday', id: 'LIST' },
        ...(result?.items || []).map((holiday) => ({ type: 'Holiday', id: holiday.id }))
      ]
    }),

    // POST {{base_url}}/admin/holidays  body: { holiday_date, name, holiday_type, half_day_period? }
    addHoliday: builder.mutation({
      query: (form) => ({
        url: '/admin/holidays',
        method: 'POST',
        body: holidayPayload(form)
      }),
      transformResponse: (response) => normalizeHoliday(unwrapData(response)),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }]
    }),

    // PUT {{base_url}}/admin/holidays/{holiday_id}  body: { holiday_date, name, holiday_type, half_day_period? }
    updateHoliday: builder.mutation({
      query: ({ id, ...form }) => ({
        url: `/admin/holidays/${id}`,
        method: 'PUT',
        body: holidayPayload(form)
      }),
      transformResponse: (response) => normalizeHoliday(unwrapData(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Holiday', id },
        { type: 'Holiday', id: 'LIST' }
      ]
    }),

    // DELETE {{base_url}}/admin/holidays/{holiday_id}
    deleteHoliday: builder.mutation({
      query: (id) => ({
        url: `/admin/holidays/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }]
    })
  })
})

export const {
  useGetHolidaysQuery,
  useAddHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation
} = holidaysApi