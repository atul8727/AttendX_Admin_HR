import {
  useAddEmployeeMutation,
  useGetEmployeeQuery,
  useGetEmployeesQuery,
  useUpdateEmployeeMutation,
  useUpdateEmployeeStatusMutation
} from '../store/api/employeesApi.js'
import { getApiErrorMessage } from '../lib/apiError.js'

export function useEmployeeList(params) {
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

export function useEmployee(id, options = {}) {
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

export function useEmployeeMutations() {
  const [addEmployee, addState] = useAddEmployeeMutation()
  const [updateEmployee, updateState] = useUpdateEmployeeMutation()
  const [updateEmployeeStatus, statusState] = useUpdateEmployeeStatusMutation()

  return {
    addEmployee: (form) => addEmployee(form).unwrap(),
    updateEmployee: (id, form) => updateEmployee({ id, ...form }).unwrap(),
    updateEmployeeStatus: (id, status) => updateEmployeeStatus({ id, status }).unwrap(),
    addState,
    updateState,
    statusState
  }
}
