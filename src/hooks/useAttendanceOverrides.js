import { useRef } from 'react'
import { useGetAttendanceOverridesQuery } from '../store/api/attendanceOverridesApi.js'
import { useGetEmployeesQuery } from '../store/api/employeesApi.js'

const PAGE_SIZE = 20
const MULTI_FETCH_LIMIT = 100 // ek se zyada employee match hon to itne overrides ek saath laa kar filter karte hain
const MAX_MATCHED_EMPLOYEES = 20

/**
 * Attendance overrides list + search.
 * Backend sirf numeric `employee_id` se filter karta hai, isliye:
 *  - search khali        -> sab overrides (server-side pagination)
 *  - 1 employee match    -> us employee_id se (server-side pagination)
 *  - 1 se zyada match    -> range ke overrides laa kar matched employees ke rows filter + client pagination
 *  - koi match nahi      -> "no employee found"
 * `search` = name / employee code / email (already trimmed + debounced).
 */
export function useAttendanceOverrideSearch({ search = '', from = '', to = '', page = 1 }) {
  const {
    currentData: matches,
    isFetching: employeesFetching,
    isError: employeesIsError,
    error: employeesError
  } = useGetEmployeesQuery({ page: 1, limit: MAX_MATCHED_EMPLOYEES, search }, { skip: !search })

  const matchedIds = matches?.items?.map((employee) => String(employee.id))
  const resolving = Boolean(search) && !matches && !employeesIsError

  let mode = 'all'
  if (search && matchedIds) mode = matchedIds.length === 0 ? 'none' : matchedIds.length === 1 ? 'single' : 'multi'

  // Employee lookup chal raha ho ya koi match na ho, tab purane args hi rakhte hain (data + cache stable rehta hai)
  const lastArgs = useRef({ employeeId: '', from: '', to: '', page: 1, limit: PAGE_SIZE })
  if (mode === 'all') lastArgs.current = { employeeId: '', from, to, page, limit: PAGE_SIZE }
  if (mode === 'single') lastArgs.current = { employeeId: matchedIds[0], from, to, page, limit: PAGE_SIZE }
  if (mode === 'multi') lastArgs.current = { employeeId: '', from, to, page: 1, limit: MULTI_FETCH_LIMIT }

  const query = useGetAttendanceOverridesQuery(lastArgs.current)

  let rows = query.data?.items || []
  let pagination = query.data?.pagination
  let truncated = false

  if (mode === 'none') {
    rows = []
    pagination = { page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 }
  } else if (mode === 'multi') {
    const idSet = new Set(matchedIds)
    const filtered = rows.filter((row) => idSet.has(String(row.employeeId)))
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const safePage = Math.min(page, totalPages)
    truncated = (query.data?.pagination?.total ?? 0) > MULTI_FETCH_LIMIT
    rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    pagination = { page: safePage, limit: PAGE_SIZE, total: filtered.length, total_pages: totalPages }
  }

  const failed = query.error || employeesError
  return {
    rows,
    pagination,
    mode,
    truncated,
    isLoading: query.isLoading,
    isFetching: query.isFetching || employeesFetching || resolving,
    isError: query.isError || employeesIsError,
    error: failed?.data?.message || failed?.error || failed?.message || ''
  }
}