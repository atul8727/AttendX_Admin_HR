import { apiSlice } from '../apiSlice.js'

function unwrapData(response) {
  return response?.data ?? response
}

function unwrapCollection(response) {
  const data = unwrapData(response)
  if (Array.isArray(data)) return data
  for (const key of ['items', 'offices', 'rows', 'results']) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

// Backend latitude/longitude ko string ("28.5708000") mein bhejta hai, isliye number mein badalte hain.
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function normalizeOffice(office = {}) {
  const id = office.office_setting_id ?? office.id
  return {
    id: String(id),
    name: office.office_name ?? office.name ?? '',
    latitude: toNumber(office.latitude),
    longitude: toNumber(office.longitude),
    allowedRadius: toNumber(office.allowed_radius) ?? 0,
    maxGpsAccuracy: toNumber(office.max_gps_accuracy) ?? 0,
    weeklyOff: office.weekly_off || 'SUN',
    timezone: office.timezone || 'Asia/Kolkata',
    createdAt: office.created_at || '',
    updatedAt: office.updated_at || '',
    deletedAt: office.deleted_at ?? null
  }
}

function officePayload(form) {
  return {
    office_name: String(form.name).trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    allowed_radius: Number(form.allowedRadius),
    max_gps_accuracy: Number(form.maxGpsAccuracy),
    weekly_off: form.weeklyOff,
    timezone: form.timezone
  }
}

export const officesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOffices: builder.query({
      query: () => '/admin/offices',
      transformResponse: (response) =>
        unwrapCollection(response)
          .map(normalizeOffice)
          .filter((office) => !office.deletedAt),
      providesTags: (result) => [
        { type: 'Office', id: 'LIST' },
        ...(result || []).map((office) => ({ type: 'Office', id: office.id }))
      ]
    }),
    getOffice: builder.query({
      query: (id) => `/admin/offices/${id}`,
      transformResponse: (response) => normalizeOffice(unwrapData(response)),
      providesTags: (_result, _error, id) => [{ type: 'Office', id: String(id) }]
    }),
    addOffice: builder.mutation({
      query: (form) => ({ url: '/admin/offices', method: 'POST', body: officePayload(form) }),
      transformResponse: (response) => normalizeOffice(unwrapData(response)),
      invalidatesTags: [{ type: 'Office', id: 'LIST' }]
    }),
    updateOffice: builder.mutation({
      query: ({ id, ...form }) => ({ url: `/admin/offices/${id}`, method: 'PUT', body: officePayload(form) }),
      transformResponse: (response) => normalizeOffice(unwrapData(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Office', id: String(id) },
        { type: 'Office', id: 'LIST' }
      ]
    }),
    deleteOffice: builder.mutation({
      query: (id) => ({ url: `/admin/offices/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Office', id: 'LIST' }]
    })
  })
})

export const {
  useGetOfficesQuery,
  useGetOfficeQuery,
  useAddOfficeMutation,
  useUpdateOfficeMutation,
  useDeleteOfficeMutation
} = officesApi