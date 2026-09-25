import { apiSlice } from '../apiSlice.js'
import { LEAVE_REQUEST_STATUS_LABELS } from '../../constants/leave.js'

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

function normalizeStatus(status) {
  if (!status) return 'Active'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function toRequestStatusLabel(key) {
  if (!key) return ''
  if (LEAVE_REQUEST_STATUS_LABELS[key]) return LEAVE_REQUEST_STATUS_LABELS[key]
  const words = key.replace(/_/g, ' ').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/* ----------------------------- Leave Types ----------------------------- */

function normalizeLeaveType(type = {}) {
  return {
    id: type.leave_type_id ?? type.id,
    name: type.name || '',
    code: type.code || '',
    defaultAnnualDays: Number(type.default_annual_days ?? 0),
    status: normalizeStatus(type.status),
    createdAt: type.created_at,
    updatedAt: type.updated_at,
    deletedAt: type.deleted_at ?? null
  }
}

function leaveTypeCreatePayload(form) {
  return {
    name: form.name,
    code: form.code,
    default_annual_days: Number(form.defaultAnnualDays)
  }
}

function leaveTypeUpdatePayload(form) {
  return {
    name: form.name,
    default_annual_days: Number(form.defaultAnnualDays)
  }
}

/* --------------------------- Leave Balances ---------------------------- */

function normalizeLeaveBalance(balance = {}) {
  return {
    id: balance.employee_leave_balance_id ?? balance.id,
    employeeId: balance.employee_id,
    leaveTypeId: balance.leave_type_id,
    year: balance.year,
    allocatedDays: Number(balance.allocated_days ?? 0),
    usedDays: Number(balance.used_days ?? 0),
    remainingDays: Number(balance.remaining_days ?? 0),
    createdAt: balance.created_at,
    updatedAt: balance.updated_at,
    deletedAt: balance.deleted_at ?? null
  }
}

/* --------------------------- Leave Requests ---------------------------- */

function normalizeLeaveRequest(request = {}) {
  const status = request.status ? String(request.status).toUpperCase() : 'PENDING'
  const durationType = request.leave_duration_type || 'FULL_DAY'
  return {
    id: request.leave_request_id ?? request.id,
    employeeId: request.employee_id,
    leaveTypeId: request.leave_type_id,
    startDate: toDateOnly(request.start_date),
    endDate: toDateOnly(request.end_date),
    durationType,
    durationTypeLabel: durationType === 'HALF_DAY' ? 'Half Day' : 'Full Day',
    totalDays: Number(request.total_days ?? 0),
    reason: request.reason || '',
    status,
    statusLabel: toRequestStatusLabel(status),
    appliedAt: request.applied_at,
    reviewedByAdminId: request.reviewed_by_admin_id ?? null,
    reviewedAt: request.reviewed_at,
    rejectionReason: request.rejection_reason || '',
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    deletedAt: request.deleted_at ?? null
  }
}

export const leaveApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ---------- Leave Types ---------- */

    // GET {{base_url}}/admin/leave/types
    getLeaveTypes: builder.query({
      query: () => '/admin/leave/types',
      transformResponse: (response) => unwrapCollection(response).map(normalizeLeaveType),
      providesTags: (result) => [
        { type: 'LeaveType', id: 'LIST' },
        ...(result || []).map((item) => ({ type: 'LeaveType', id: item.id }))
      ]
    }),

    // POST {{base_url}}/admin/leave/types  body: { name, code, default_annual_days }
    addLeaveType: builder.mutation({
      query: (form) => ({
        url: '/admin/leave/types',
        method: 'POST',
        body: leaveTypeCreatePayload(form)
      }),
      transformResponse: (response) => normalizeLeaveType(unwrapData(response)),
      invalidatesTags: [{ type: 'LeaveType', id: 'LIST' }]
    }),

    // PUT {{base_url}}/admin/leave/types/{leave_type_id}  body: { name, default_annual_days }
    updateLeaveType: builder.mutation({
      query: ({ id, ...form }) => ({
        url: `/admin/leave/types/${id}`,
        method: 'PUT',
        body: leaveTypeUpdatePayload(form)
      }),
      transformResponse: (response) => normalizeLeaveType(unwrapData(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LeaveType', id },
        { type: 'LeaveType', id: 'LIST' }
      ]
    }),

    // PATCH {{base_url}}/admin/leave/types/{leave_type_id}/status  body: { status: 'ACTIVE' | 'INACTIVE' }
    updateLeaveTypeStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/leave/types/${id}/status`,
        method: 'PATCH',
        body: { status }
      }),
      transformResponse: (response) => normalizeLeaveType(unwrapData(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LeaveType', id },
        { type: 'LeaveType', id: 'LIST' }
      ]
    }),

    /* ---------- Leave Balances ---------- */

    // GET {{base_url}}/admin/leave/balances?employee_id=&year=&page=&limit=
    getLeaveBalances: builder.query({
      query: ({ employeeId = '', year = '', page = 1, limit = 20 } = {}) => ({
        url: '/admin/leave/balances',
        params: {
          page,
          limit,
          ...(employeeId ? { employee_id: employeeId } : {}),
          ...(year ? { year } : {})
        }
      }),
      transformResponse: (response) => ({
        items: unwrapCollection(response).map(normalizeLeaveBalance),
        pagination: unwrapPagination(response)
      }),
      providesTags: (result) => [
        { type: 'LeaveBalance', id: 'LIST' },
        ...(result?.items || []).map((item) => ({ type: 'LeaveBalance', id: item.id }))
      ]
    }),

    // POST {{base_url}}/admin/leave/balances  body: { employee_id, leave_type_id, year }
    addLeaveBalance: builder.mutation({
      query: ({ employeeId, leaveTypeId, year }) => ({
        url: '/admin/leave/balances',
        method: 'POST',
        body: {
          employee_id: Number(employeeId),
          leave_type_id: Number(leaveTypeId),
          year: Number(year)
        }
      }),
      transformResponse: (response) => normalizeLeaveBalance(unwrapData(response)),
      invalidatesTags: [{ type: 'LeaveBalance', id: 'LIST' }]
    }),

    // PUT {{base_url}}/admin/leave/balances/{leave_balance_id}  body: { allocated_days }
    updateLeaveBalance: builder.mutation({
      query: ({ id, allocatedDays }) => ({
        url: `/admin/leave/balances/${id}`,
        method: 'PUT',
        body: { allocated_days: Number(allocatedDays) }
      }),
      transformResponse: (response) => normalizeLeaveBalance(unwrapData(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LeaveBalance', id },
        { type: 'LeaveBalance', id: 'LIST' }
      ]
    }),

    /* ---------- Leave Requests ---------- */

    // GET {{base_url}}/admin/leave/requests?status=&page=&limit=
    getLeaveRequests: builder.query({
      query: ({ status = '', page = 1, limit = 20 } = {}) => ({
        url: '/admin/leave/requests',
        params: {
          page,
          limit,
          ...(status ? { status } : {})
        }
      }),
      transformResponse: (response) => ({
        items: unwrapCollection(response).map(normalizeLeaveRequest),
        pagination: unwrapPagination(response)
      }),
      providesTags: (result) => [
        { type: 'LeaveRequest', id: 'LIST' },
        ...(result?.items || []).map((item) => ({ type: 'LeaveRequest', id: item.id }))
      ]
    }),

    // GET {{base_url}}/admin/leave/requests/{leave_request_id}
    getLeaveRequest: builder.query({
      query: (id) => `/admin/leave/requests/${id}`,
      transformResponse: (response) => normalizeLeaveRequest(unwrapData(response)),
      providesTags: (_result, _error, id) => [{ type: 'LeaveRequest', id }]
    }),

    // POST {{base_url}}/admin/leave/requests/{leave_request_id}/approve
    approveLeaveRequest: builder.mutation({
      query: (id) => ({
        url: `/admin/leave/requests/${id}/approve`,
        method: 'POST'
      }),
      transformResponse: (response) => normalizeLeaveRequest(unwrapData(response)),
      invalidatesTags: (_result, _error, id) => [
        { type: 'LeaveRequest', id },
        { type: 'LeaveRequest', id: 'LIST' },
        { type: 'LeaveBalance', id: 'LIST' }
      ]
    }),

    // POST {{base_url}}/admin/leave/requests/{leave_request_id}/reject  body: { reason }
    rejectLeaveRequest: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/leave/requests/${id}/reject`,
        method: 'POST',
        body: { reason }
      }),
      transformResponse: (response) => normalizeLeaveRequest(unwrapData(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LeaveRequest', id },
        { type: 'LeaveRequest', id: 'LIST' }
      ]
    })
  })
})

export const {
  useGetLeaveTypesQuery,
  useAddLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useUpdateLeaveTypeStatusMutation,
  useGetLeaveBalancesQuery,
  useAddLeaveBalanceMutation,
  useUpdateLeaveBalanceMutation,
  useGetLeaveRequestsQuery,
  useGetLeaveRequestQuery,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation
} = leaveApi