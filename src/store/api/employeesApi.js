import { apiSlice } from '../apiSlice.js'

function toTimeInput(value, fallback = '') {
  if (!value) return fallback
  return String(value).slice(0, 5)
}

function normalizeStatus(status) {
  if (!status) return 'Active'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function normalizeEmployee(employee = {}) {
  const id = employee.employee_id ?? employee.id ?? employee.employee_code ?? employee.code
  const code = employee.employee_code ?? employee.code ?? id

  return {
    id: String(id),
    code: String(code),
    name: employee.name || '',
    email: employee.email || '',
    phone: employee.phone || '',
    role: employee.role || 'Employee',
    department: employee.department || 'General',
    office: employee.office || employee.office_name || 'Noida HQ',
    expectedLogin: toTimeInput(employee.expected_login_time ?? employee.expectedLogin, '09:30'),
    expectedLogout: toTimeInput(employee.expected_logout_time ?? employee.expectedLogout, '18:30'),
    lateGraceMinutes: employee.late_grace_minutes ?? employee.lateGraceMinutes ?? 15,
    status: normalizeStatus(employee.status),
    wfh: employee.wfh || 'Enabled',
    wfhLocation: employee.wfhLocation || { latitude: '', longitude: '', radius: 150 },
    leaveBalance: employee.leaveBalance || { casual: 12, sick: 8, earned: 18 },
    joined: employee.joined || employee.created_at?.slice(0, 10) || '',
    createdAt: employee.created_at,
    updatedAt: employee.updated_at
  }
}

function unwrapData(response) {
  return response?.data ?? response
}

function unwrapCollection(response) {
  const data = unwrapData(response)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.employees)) return data.employees
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.results)) return data.results
  return []
}

function unwrapPagination(response) {
  const data = unwrapData(response)
  return data?.pagination || { page: 1, limit: 20, total: unwrapCollection(response).length, total_pages: 1 }
}

function employeePayload(form) {
  return {
    employee_code: form.code,
    name: form.name,
    email: form.email,
    password: form.password,
    phone: form.phone,
    expected_login_time: form.expectedLogin,
    expected_logout_time: form.expectedLogout,
    late_grace_minutes: form.lateGraceMinutes ?? 15
  }
}

function updateEmployeePayload(form) {
  return {
    name: form.name,
    phone: form.phone,
    expected_login_time: form.expectedLogin,
    expected_logout_time: form.expectedLogout,
    late_grace_minutes: form.lateGraceMinutes ?? 15
  }
}

export const employeesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: ({ page = 1, limit = 20, search = '', status = '' } = {}) => ({
        url: '/admin/employees',
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(status ? { status } : {})
        }
      }),
      transformResponse: (response) => ({
        items: unwrapCollection(response).map(normalizeEmployee),
        pagination: unwrapPagination(response)
      }),
      providesTags: (result) => [
        { type: 'Employee', id: 'LIST' },
        ...(result?.items || []).map((employee) => ({ type: 'Employee', id: employee.id }))
      ]
    }),
    getEmployee: builder.query({
      query: (id) => `/admin/employees/${id}`,
      transformResponse: (response) => normalizeEmployee(unwrapData(response)),
      providesTags: (_result, _error, id) => [{ type: 'Employee', id }]
    }),
    addEmployee: builder.mutation({
      query: (form) => ({
        url: '/admin/employees',
        method: 'POST',
        body: employeePayload(form)
      }),
      transformResponse: (response) => normalizeEmployee(unwrapData(response)),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }]
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...form }) => ({
        url: `/admin/employees/${id}`,
        method: 'PUT',
        body: updateEmployeePayload(form)
      }),
      transformResponse: (response) => normalizeEmployee(unwrapData(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' }
      ]
    }),
    updateEmployeeStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/employees/${id}/status`,
        method: 'PATCH',
        body: { status: status.toUpperCase() }
      }),
      transformResponse: (response) => normalizeEmployee(unwrapData(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' }
      ]
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/admin/employees/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }]
    })
  })
})

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useAddEmployeeMutation,
  useUpdateEmployeeMutation,
  useUpdateEmployeeStatusMutation,
  useDeleteEmployeeMutation
} = employeesApi
