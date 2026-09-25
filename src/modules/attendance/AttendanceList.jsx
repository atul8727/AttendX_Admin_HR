import { useMemo, useState } from 'react'
import { FiCalendar, FiCheckCircle, FiFilter, FiSearch, FiTrash2, FiUserX, FiX } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useAttendanceOverrideSearch } from '../../hooks/useAttendanceOverrides.js'
import { useDeleteAttendanceOverrideMutation } from '../../store/api/attendanceOverridesApi.js'
import { useGetEmployeeQuery } from '../../store/api/employeesApi.js'

// 'YYYY-MM-DD' (both the API normalizer and <input type="date"> give us this) -> "24 Sept 2026"
// new Date('YYYY-MM-DD') assumes UTC, so we build the local date from its parts instead.
function formatDate(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(year, month - 1, day))
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function EmployeeCell({ employeeId }) {
  const { data: employee, isFetching } = useGetEmployeeQuery(employeeId, { skip: !employeeId })
  return (
    <div className="flex items-center gap-3">
      <Avatar name={employee?.name || String(employeeId)} />
      <div className="min-w-0">
        <p className="truncate font-bold">{isFetching && !employee ? 'Loading...' : employee?.name || `Employee #${employeeId}`}</p>
        <p className="truncate text-xs text-app-muted">{employee?.code || `ID: ${employeeId}`}</p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/15 text-warning',
    success: 'bg-success/10 text-success'
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-app-surface p-4 shadow-soft ring-1 ring-white/40 dark:ring-white/5">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tones[tone] || tones.primary}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black leading-tight text-app-text">{value}</p>
        <p className="truncate text-xs font-semibold text-app-muted">{label}</p>
      </div>
    </div>
  )
}

export default function AttendanceList() {
  // Input has its own state (typing is instant); the query only receives the debounced value
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput.trim(), 400)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

  const { rows, pagination, mode, truncated, isLoading, isFetching, isError, error: queryError } = useAttendanceOverrideSearch({
    search,
    from: fromDate,
    to: toDate,
    page
  })
  const [deleteOverride, deleteState] = useDeleteAttendanceOverrideMutation()

  const deleteError = deleteState.error?.data?.message || deleteState.error?.error || ''
  const hasActiveFilters = Boolean(searchInput || fromDate || toDate)

  const stats = useMemo(
    () => ({
      total: pagination?.total ?? rows.length,
      absent: rows.filter((row) => row.status === 'ABSENT').length,
      present: rows.filter((row) => row.status === 'PRESENT').length,
      onLeave: rows.filter((row) => row.status === 'ON_LEAVE').length
    }),
    [rows, pagination]
  )
  const statValue = (value) => (isLoading ? '-' : value)

  // Page reset happens inside the handlers (not in a useEffect), so we don't fire a double request
  function changeSearch(event) {
    setSearchInput(event.target.value)
    setPage(1)
  }
  function changeFromDate(event) {
    setFromDate(event.target.value)
    setPage(1)
  }
  function changeToDate(event) {
    setToDate(event.target.value)
    setPage(1)
  }
  function clearFilters() {
    setSearchInput('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  async function handleDeleteConfirm() {
    try {
      await deleteOverride(deletingId).unwrap()
      setDeletingId(null)
      // If we removed the last row, go back a page. The list refreshes itself via invalidatesTags.
      if (rows.length === 1 && page > 1) setPage(page - 1)
    } catch (err) {
      void err
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black sm:text-2xl">Attendance Management</h1>
        <p className="text-sm text-app-muted">Manually set or review attendance status overrides for employees.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiFilter} label="Total overrides" value={statValue(stats.total)} tone="primary" />
        <StatCard icon={FiUserX} label="Absent (this page)" value={statValue(stats.absent)} tone="danger" />
        <StatCard icon={FiCheckCircle} label="Present (this page)" value={statValue(stats.present)} tone="success" />
        <StatCard icon={FiCalendar} label="On leave (this page)" value={statValue(stats.onLeave)} tone="warning" />
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiFilter className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wide text-app-text">Filters</h2>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" icon={FiX} onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <div className="mb-5 grid gap-3 rounded-lg border border-primary/10 bg-app-bg/60 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Input
              label="Search employee"
              placeholder="Name or employee code"
              autoComplete="off"
              value={searchInput}
              onChange={changeSearch}
              className="pl-9"
            />
            <FiSearch className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-app-muted" />
          </div>
          <Input label="From" type="date" value={fromDate} max={toDate || undefined} onChange={changeFromDate} />
          <Input label="To" type="date" value={toDate} min={fromDate || undefined} onChange={changeToDate} />
        </div>

        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {searchInput && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Search: {searchInput}
              </span>
            )}
            {fromDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                From {formatDate(fromDate)}
              </span>
            )}
            {toDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                To {formatDate(toDate)}
              </span>
            )}
          </div>
        )}

        {isError && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{queryError}</p>}
        {truncated && (
          <p className="mb-4 rounded-lg bg-warning/15 p-3 text-xs font-semibold text-warning">
            Showing matches from the first 100 overrides in this range. Narrow the From/To range for complete results.
          </p>
        )}

        {/* Only this section reloads. min-height keeps the layout from jumping. */}
        <div className="min-h-[14rem]">
          {isLoading ? (
            <Loader />
          ) : mode === 'none' && !isFetching ? (
            <EmptyState title="No employee found" description="No employee matched this name or code." />
          ) : (
            <div className={`transition-opacity ${isFetching ? 'pointer-events-none opacity-50' : ''}`}>
              <Table
                rows={rows}
                columns={[
                  { key: 'employee', header: 'Employee', render: (row) => <EmployeeCell employeeId={row.employeeId} /> },
                  { key: 'attendanceDate', header: 'Date', render: (row) => formatDate(row.attendanceDate) },
                  { key: 'status', header: 'Status', render: (row) => <Badge status={row.statusLabel} /> },
                  {
                    key: 'reason',
                    header: 'Reason',
                    render: (row) => (
                      <span className="block max-w-xs truncate" title={row.reason}>
                        {row.reason || '-'}
                      </span>
                    )
                  },
                  { key: 'createdAt', header: 'Set On', render: (row) => formatDateTime(row.createdAt) },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => (
                      <Button variant="danger" icon={FiTrash2} onClick={() => setDeletingId(row.id)}>
                        Remove
                      </Button>
                    )
                  }
                ]}
              />
            </div>
          )}
        </div>

        {pagination && !isError && (
          <div className="mt-4 flex flex-col gap-3 border-t border-primary/10 pt-4 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              Page {pagination.page} of {pagination.total_pages} - Showing {rows.length} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button variant="ghost" disabled={page >= pagination.total_pages || isFetching} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={Boolean(deletingId)} title="Remove Attendance Override" onClose={() => setDeletingId(null)}>
        {deleteError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{deleteError}</p>}
        <p className="text-sm text-app-text">Are you sure you want to remove this attendance override? This action cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeletingId(null)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={deleteState.isLoading} onClick={handleDeleteConfirm}>
            {deleteState.isLoading ? 'Removing...' : 'Remove Override'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}