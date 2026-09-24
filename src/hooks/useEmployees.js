import { useState } from 'react'
import { MODULE_API_STATUS } from '../config/moduleApiStatus.js'
import {
  createEmployee as createEmployeeLocal,
  getEmployeeById as getEmployeeByIdLocal,
  getEmployees as getEmployeesLocal,
  toggleEmployeeStatus as toggleEmployeeStatusLocal,
  updateEmployee as updateEmployeeLocal
} from '../services/employeeService.js'
import {
  useAddEmployeeMutation,
  useGetEmployeeQuery,
  useGetEmployeesQuery,
  useUpdateEmployeeMutation,
  useUpdateEmployeeStatusMutation
} from '../store/api/employeesApi.js'
import { useFetch } from './useFetch.js'

function getApiErrorMessage(error) {
  return error?.data?.message || error?.error || null
}

function paginateEmployees(employees, { page = 1, limit = 20, search = '', status = '' } = {}) {
  const query = search.trim().toLowerCase()
  const normalizedStatus = status.toLowerCase()
  const filtered = employees.filter((employee) => {
    const matchesSearch =
      !query ||
      [employee.name, employee.code, employee.email, employee.phone].some((value) => String(value || '').toLowerCase().includes(query))
    const matchesStatus = !normalizedStatus || employee.status.toLowerCase() === normalizedStatus
    return matchesSearch && matchesStatus
  })
  const start = (page - 1) * limit

  return {
    items: filtered.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      total_pages: Math.max(1, Math.ceil(filtered.length / limit))
    }
  }
}

function useEmployeeListFromApi(params) {
  const { data, isLoading, isFetching, isError, error, refetch } = useGetEmployeesQuery(params)

  return {
    data: data?.items || [],
    pagination: data?.pagination,
    loading: isLoading,
    fetching: isFetching,
    isError,
    error: getApiErrorMessage(error),
    refetch
  }
}

function useEmployeeListFromLocal(params) {
  const { data, loading, error, refetch } = useFetch(getEmployeesLocal, [params?.page, params?.limit, params?.search, params?.status])
  const page = paginateEmployees(data || [], params)

  return {
    data: page.items,
    pagination: page.pagination,
    loading,
    fetching: loading,
    isError: Boolean(error),
    error,
    refetch
  }
}

export function useEmployeeList(params) {
  return MODULE_API_STATUS.employees ? useEmployeeListFromApi(params) : useEmployeeListFromLocal(params)
}

function useEmployeeFromApi(id, options = {}) {
  const { data, isLoading, isFetching, isError, error, refetch } = useGetEmployeeQuery(id, options)

  return {
    data,
    loading: isLoading,
    fetching: isFetching,
    isError,
    error: getApiErrorMessage(error),
    refetch
  }
}

function useEmployeeFromLocal(id, options = {}) {
  const skip = options.skip || !id
  const { data, loading, error, refetch } = useFetch(() => (skip ? Promise.resolve(null) : getEmployeeByIdLocal(id)), [id, skip])

  return {
    data,
    loading,
    fetching: loading,
    isError: Boolean(error),
    error,
    refetch
  }
}

export function useEmployee(id, options) {
  return MODULE_API_STATUS.employees ? useEmployeeFromApi(id, options) : useEmployeeFromLocal(id, options)
}

function useLocalMutationState() {
  const [state, setState] = useState({ isLoading: false, error: null })

  async function run(action) {
    setState({ isLoading: true, error: null })
    try {
      return await action()
    } catch (error) {
      setState({ isLoading: false, error })
      throw error
    } finally {
      setState((current) => ({ ...current, isLoading: false }))
    }
  }

  return [run, state]
}

export function useEmployeeMutations() {
  const [addApi, addApiState] = useAddEmployeeMutation()
  const [updateApi, updateApiState] = useUpdateEmployeeMutation()
  const [statusApi, statusApiState] = useUpdateEmployeeStatusMutation()
  const [runAddLocal, addLocalState] = useLocalMutationState()
  const [runUpdateLocal, updateLocalState] = useLocalMutationState()
  const [runStatusLocal, statusLocalState] = useLocalMutationState()

  if (MODULE_API_STATUS.employees) {
    return {
      addEmployee: (form) => addApi(form).unwrap(),
      updateEmployee: (id, form) => updateApi({ id, ...form }).unwrap(),
      updateEmployeeStatus: (id, status) => statusApi({ id, status }).unwrap(),
      addState: addApiState,
      updateState: updateApiState,
      statusState: statusApiState
    }
  }

  return {
    addEmployee: (form) => runAddLocal(() => createEmployeeLocal(form)),
    updateEmployee: (id, form) => runUpdateLocal(() => updateEmployeeLocal(id, form)),
    updateEmployeeStatus: (id) => runStatusLocal(() => toggleEmployeeStatusLocal(id)),
    addState: addLocalState,
    updateState: updateLocalState,
    statusState: statusLocalState
  }
}
