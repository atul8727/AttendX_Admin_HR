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
  return data?.pagination || { page: 1, limit: 20, total: unwrapCollection(response).length, total_pages: 1 }
}

function normalizeStatus(status) {
  if (!status) return 'Pending'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function normalizeDeviceRequest(request = {}) {
  return {
    id: request.device_change_request_id,
    employeeId: request.employee_id,
    oldEmployeeDeviceId: request.old_employee_device_id,
    newDeviceId: request.new_device_id,
    newDeviceName: request.new_device_name,
    newDeviceModel: request.new_device_model,
    newPlatform: request.new_platform,
    status: normalizeStatus(request.status),
    requestedAt: request.requested_at,
    reviewedByAdminId: request.reviewed_by_admin_id,
    reviewedAt: request.reviewed_at,
    rejectionReason: request.rejection_reason,
    createdAt: request.created_at,
    updatedAt: request.updated_at
  }
}

function normalizeEmployeeDevice(device = {}) {
  return {
    id: device.employee_device_id,
    deviceId: device.device_id,
    deviceName: device.device_name,
    deviceModel: device.device_model,
    platform: device.platform,
    status: normalizeStatus(device.status),
    registeredAt: device.registered_at,
    lastLoginAt: device.last_login_at
  }
}

export const devicesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET {{base_url}}/admin/device-change-requests?status=PENDING
    getDeviceChangeRequests: builder.query({
      query: ({ page = 1, limit = 20, status = '' } = {}) => ({
        url: '/admin/device-change-requests',
        params: {
          page,
          limit,
          ...(status ? { status } : {})
        }
      }),
      transformResponse: (response) => ({
        items: unwrapCollection(response).map(normalizeDeviceRequest),
        pagination: unwrapPagination(response)
      }),
      providesTags: (result) => [
        { type: 'DeviceRequest', id: 'LIST' },
        ...(result?.items || []).map((request) => ({ type: 'DeviceRequest', id: request.id }))
      ]
    }),

    // POST {{base_url}}/admin/device-change-requests/{id}/approve
    approveDeviceChangeRequest: builder.mutation({
      query: (id) => ({
        url: `/admin/device-change-requests/${id}/approve`,
        method: 'POST'
      }),
      transformResponse: (response) => normalizeDeviceRequest(unwrapData(response)),
      invalidatesTags: (_result, _error, id) => [
        { type: 'DeviceRequest', id },
        { type: 'DeviceRequest', id: 'LIST' },
        { type: 'EmployeeDevice', id: 'LIST' }
      ]
    }),

    // POST {{base_url}}/admin/device-change-requests/{id}/reject  body: { reason }
    rejectDeviceChangeRequest: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/device-change-requests/${id}/reject`,
        method: 'POST',
        body: { reason }
      }),
      transformResponse: (response) => normalizeDeviceRequest(unwrapData(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DeviceRequest', id },
        { type: 'DeviceRequest', id: 'LIST' }
      ]
    }),

    // GET {{base_url}}/admin/employees/{employee_id}/devices
    getEmployeeDevices: builder.query({
      query: (employeeId) => `/admin/employees/${employeeId}/devices`,
      transformResponse: (response) => unwrapCollection(response).map(normalizeEmployeeDevice),
      providesTags: (result, _error, employeeId) => [
        { type: 'EmployeeDevice', id: employeeId },
        ...(result || []).map((device) => ({ type: 'EmployeeDevice', id: device.id }))
      ]
    })
  })
})

export const {
  useGetDeviceChangeRequestsQuery,
  useApproveDeviceChangeRequestMutation,
  useRejectDeviceChangeRequestMutation,
  useGetEmployeeDevicesQuery
} = devicesApi