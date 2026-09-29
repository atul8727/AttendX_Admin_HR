import { apiSlice } from '../apiSlice.js'

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeStatus(status) {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

// Returns null when the employee has no WFH location (the API sends { data: null }).
export function normalizeWfhLocation(location) {
  if (!location || typeof location !== 'object' || location.deleted_at) return null
  return {
    id: String(location.employee_wfh_location_id ?? ''),
    employeeId: String(location.employee_id ?? ''),
    name: location.name || '',
    latitude: toNumber(location.latitude),
    longitude: toNumber(location.longitude),
    radiusMeters: toNumber(location.radius_meters),
    status: normalizeStatus(location.status),
    createdAt: location.created_at || '',
    updatedAt: location.updated_at || ''
  }
}

function wfhLocationPayload({ name, latitude, longitude, radiusMeters }) {
  return {
    name: String(name).trim(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    radius_meters: Number(radiusMeters)
  }
}

export const wfhApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /admin/employees/:id/wfh-location
    getWfhLocation: builder.query({
      query: (employeeId) => `/admin/employees/${employeeId}/wfh-location`,
      transformResponse: (response) => normalizeWfhLocation(response?.data),
      providesTags: (_result, _error, employeeId) => [{ type: 'WfhLocation', id: String(employeeId) }]
    }),
    // PUT /admin/employees/:id/wfh-location
    saveWfhLocation: builder.mutation({
      query: ({ employeeId, ...form }) => ({
        url: `/admin/employees/${employeeId}/wfh-location`,
        method: 'PUT',
        body: wfhLocationPayload(form)
      }),
      transformResponse: (response) => normalizeWfhLocation(response?.data),
      invalidatesTags: (_result, _error, { employeeId }) => [{ type: 'WfhLocation', id: String(employeeId) }]
    }),
    // PATCH /admin/employees/:id/wfh-location/status
    updateWfhLocationStatus: builder.mutation({
      query: ({ employeeId, status }) => ({
        url: `/admin/employees/${employeeId}/wfh-location/status`,
        method: 'PATCH',
        body: { status: String(status).toUpperCase() }
      }),
      transformResponse: (response) => normalizeWfhLocation(response?.data),
      invalidatesTags: (_result, _error, { employeeId }) => [{ type: 'WfhLocation', id: String(employeeId) }]
    })
  })
})

export const { useGetWfhLocationQuery, useSaveWfhLocationMutation, useUpdateWfhLocationStatusMutation } = wfhApi
