import { useCallback, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import i18n from '../../i18n/index.js'
import { API_BASE_URL, apiSlice, authorizedFetch } from '../../store/apiSlice.js'

// Maximum number of parallel requests, to avoid overloading the server.
const CONCURRENCY = 5
const PAGE_LIMIT = 100
const MAX_PAGES = 200

const idleState = {
  phase: 'idle', // idle | scanning | assigning | done | error
  employees: 0,
  types: 0,
  total: 0, // number of API operations to run (new assignments + updates)
  done: 0,
  created: 0,
  updated: 0,
  alreadyAssigned: 0,
  failed: 0,
  errors: []
}

async function request(path, options = {}) {
  const response = await authorizedFetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
       const error = new Error(body?.message || i18n.t('leave:assign.requestFailed', { status: response.status }))
    error.status = response.status
    throw error
  }
  return body
}

function unwrapData(body) {
  return body?.data ?? body
}

function unwrapItems(body) {
  const data = unwrapData(body)
  if (Array.isArray(data)) return data
  for (const key of ['items', 'rows', 'results', 'employees']) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

async function fetchAllPages(path, params = {}) {
  const all = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const query = new window.URLSearchParams({ ...params, page: String(page), limit: String(PAGE_LIMIT) })
    const body = await request(`${path}?${query.toString()}`)
    const items = unwrapItems(body)
    all.push(...items)
    const totalPages = unwrapData(body)?.pagination?.total_pages
    if (totalPages ? page >= totalPages : items.length < PAGE_LIMIT) break
  }
  return all
}

function isEmployeeActive(employee) {
  const status = String(employee?.status || 'ACTIVE').toLowerCase()
  return !['inactive', 'disabled', 'deactivated', 'terminated', 'deleted'].includes(status)
}

function isDuplicateError(error) {
  return error?.status === 409 || /already|exist|duplicate/i.test(error?.message || '')
}

function parseQuota(value) {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

/**
 * Lets the admin set up leave balances for every employee at once.
 *
 * assign({ leaveTypeIds, year, quotas, updateExisting, leaveTypes })
 *  - quotas:         { [leaveTypeId]: days }  yearly days per type (e.g. CL 12, SL 10)
 *  - leaveTypes:     the leave type objects, used to detect when a quota differs from the type default
 *  - updateExisting: also change already-assigned balances to the new quota
 *
 * Balances that already exist are skipped, so it is safe to run repeatedly (idempotent).
 * When a new employee joins or a type is activated later, just run it again.
 */
export function useLeaveAssignment() {
  const dispatch = useDispatch()
  const runningRef = useRef(false)
  const [state, setState] = useState(idleState)

  const reset = useCallback(() => setState(idleState), [])

  const assign = useCallback(
    async ({ leaveTypeIds, year, quotas = {}, updateExisting = false, leaveTypes = [] }) => {
      if (runningRef.current) return null
      runningRef.current = true
      const typeIds = [...new Set((leaveTypeIds || []).map(String))]
      setState({ ...idleState, phase: 'scanning', types: typeIds.length })

      try {
        // 1) If the admin changed a quota, save it as the type's default so new balances use it.
        let typesChanged = false
        for (const typeId of typeIds) {
          const quota = parseQuota(quotas[typeId])
          const type = leaveTypes.find((item) => String(item.id) === typeId)
          if (quota !== null && type && Number(type.defaultAnnualDays) !== quota) {
            await request(`/admin/leave/types/${typeId}`, {
              method: 'PUT',
              body: JSON.stringify({ name: type.name, default_annual_days: quota })
            })
            typesChanged = true
          }
        }
        if (typesChanged) dispatch(apiSlice.util.invalidateTags([{ type: 'LeaveType', id: 'LIST' }]))

        // 2) Load employees and the balances that already exist for this year.
        const [employeeRows, balanceRows] = await Promise.all([
          fetchAllPages('/admin/employees'),
          fetchAllPages('/admin/leave/balances', { year: String(year) })
        ])

        const employeeIds = employeeRows
          .filter(isEmployeeActive)
          .map((employee) => employee.employee_id ?? employee.active_employee_id ?? employee.id)
          .filter((id) => id != null)
          .map(String)

        const existing = new Map(balanceRows.map((balance) => [`${balance.employee_id}:${balance.leave_type_id}`, balance]))

        // 3) Build the work list: create what is missing, optionally update what differs.
        const tasks = []
        let createCount = 0
        for (const employeeId of employeeIds) {
          for (const leaveTypeId of typeIds) {
            const quota = parseQuota(quotas[leaveTypeId])
            const balance = existing.get(`${employeeId}:${leaveTypeId}`)
            if (!balance) {
              tasks.push({ kind: 'create', employeeId, leaveTypeId, quota })
              createCount += 1
            } else if (updateExisting && quota !== null && Number(balance.allocated_days) !== quota) {
              const balanceId = balance.employee_leave_balance_id ?? balance.id
              if (balanceId != null) tasks.push({ kind: 'update', balanceId, quota })
            }
          }
        }

        const summary = {
          ...idleState,
          phase: 'assigning',
          employees: employeeIds.length,
          types: typeIds.length,
          total: tasks.length,
          alreadyAssigned: employeeIds.length * typeIds.length - createCount,
          errors: []
        }
        setState({ ...summary })

        const updateAllocated = (balanceId, quota) =>
          request(`/admin/leave/balances/${balanceId}`, { method: 'PUT', body: JSON.stringify({ allocated_days: quota }) })

        let cursor = 0
        const worker = async () => {
          while (cursor < tasks.length) {
            const task = tasks[cursor]
            cursor += 1
            try {
              if (task.kind === 'create') {
                const body = await request('/admin/leave/balances', {
                  method: 'POST',
                  body: JSON.stringify({
                    employee_id: Number(task.employeeId),
                    leave_type_id: Number(task.leaveTypeId),
                    year: Number(year)
                  })
                })
                summary.created += 1
                // Safety net: if the server did not apply the quota, set it explicitly.
                const created = unwrapData(body)
                const createdId = created?.employee_leave_balance_id ?? created?.id
                if (task.quota !== null && createdId != null && created?.allocated_days != null && Number(created.allocated_days) !== task.quota) {
                  await updateAllocated(createdId, task.quota)
                }
              } else {
                await updateAllocated(task.balanceId, task.quota)
                summary.updated += 1
              }
            } catch (error) {
              if (task.kind === 'create' && isDuplicateError(error)) summary.alreadyAssigned += 1
              else {
                summary.failed += 1
                if (summary.errors.length < 5) summary.errors.push(error.message)
              }
            }
            summary.done += 1
            setState({ ...summary, errors: [...summary.errors] })
          }
        }
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker))

        // Refresh the tables once at the end instead of after every request.
        dispatch(apiSlice.util.invalidateTags([{ type: 'LeaveBalance', id: 'LIST' }]))

        const finished = { ...summary, phase: 'done', errors: [...summary.errors] }
        setState(finished)
        return finished
      } catch (error) {
        setState({ ...idleState, phase: 'error', errors: [error.message] })
        throw error
      } finally {
        runningRef.current = false
      }
    },
    [dispatch]
  )

  const running = state.phase === 'scanning' || state.phase === 'assigning'

  return { state, running, assign, reset }
}