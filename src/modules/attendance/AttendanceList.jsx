import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCalendar, FiCheckCircle, FiChevronLeft, FiChevronRight, FiClock, FiEye, FiFilter, FiSearch, FiTrash2, FiUserX, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
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
import { getApiErrorMessage } from '../../lib/apiError.js'
import { useFormatters } from '../../lib/format.js'
import { useDeleteAttendanceOverrideMutation } from '../../store/api/attendanceOverridesApi.js'
import { useGetEmployeeQuery } from '../../store/api/employeesApi.js'
import { useGetDailyReportQuery } from '../../store/api/reportsApi.js'
import { toLocalDateString } from '../../lib/date.js'

// 'YYYY-MM-DD' (API normalizer aur <input type="date"> dono yahi dete hain) se local date banate hain.
// new Date('YYYY-MM-DD') UTC maan leta hai, isliye parts se banaya.
function parseDateOnly(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function EmployeeCell({ employeeId }) {
  const { t } = useTranslation('attendance')
  const { data: employee, isFetching } = useGetEmployeeQuery(employeeId, { skip: !employeeId })
  return (
    <div className="flex items-center gap-3">
      <Avatar name={employee?.name || String(employeeId)} />
      <div className="min-w-0">
        <p className="truncate font-bold">{isFetching && !employee ? t('common:actions.loading') : employee?.name || t('list.employeeFallback', { id: employeeId })}</p>
        <p className="truncate text-xs text-app-muted">{employee?.code || t('list.idLabel', { id: employeeId })}</p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, tone }) {
  const Icon = icon
  const tones = {
    primary: 'bg-primary/10 text-primary',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/15 text-warning',
    success: 'bg-success/10 text-success'
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-app-surface p-4 shadow-soft ring-1 ring-white/40 dark:ring-white/5">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tones[tone] || tones.primary}`}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black leading-tight text-app-text">{value}</p>
        <p className="truncate text-xs font-semibold text-app-muted">{label}</p>
      </div>
    </div>
  )
}

function OverridesTab() {
  const { t } = useTranslation('attendance')
  const fmt = useFormatters()
  const formatDate = (value) => (value ? fmt.date(parseDateOnly(value)) : '-')
  const formatDateTime = (value) => (value ? fmt.dateTime(value) : '-')
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

  const deleteError = deleteState.error ? getApiErrorMessage(deleteState.error) : ''
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
        <h1 className="text-xl font-black sm:text-2xl">{t('list.title')}</h1>
        <p className="text-sm text-app-muted">{t('list.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiFilter} label={t('list.stats.total')} value={statValue(stats.total)} tone="primary" />
        <StatCard icon={FiUserX} label={t('list.stats.absent')} value={statValue(stats.absent)} tone="danger" />
        <StatCard icon={FiCheckCircle} label={t('list.stats.present')} value={statValue(stats.present)} tone="success" />
        <StatCard icon={FiCalendar} label={t('list.stats.onLeave')} value={statValue(stats.onLeave)} tone="warning" />
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiFilter className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wide text-app-text">{t('list.filters.title')}</h2>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" icon={FiX} onClick={clearFilters}>
              {t('list.filters.clear')}
            </Button>
          )}
        </div>

        <div className="mb-5 grid gap-3 rounded-lg border border-primary/10 bg-app-bg/60 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Input
              label={t('list.filters.searchLabel')}
              placeholder={t('list.filters.searchPlaceholder')}
              autoComplete="off"
              value={searchInput}
              onChange={changeSearch}
              className="pl-9"
            />
            <FiSearch className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-app-muted" />
          </div>
          <Input label={t('list.filters.from')} type="date" value={fromDate} max={toDate || undefined} onChange={changeFromDate} />
          <Input label={t('list.filters.to')} type="date" value={toDate} min={fromDate || undefined} onChange={changeToDate} />
        </div>

        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {searchInput && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {t('list.filters.chipSearch', { value: searchInput })}
              </span>
            )}
            {fromDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {t('list.filters.chipFrom', { date: formatDate(fromDate) })}
              </span>
            )}
            {toDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {t('list.filters.chipTo', { date: formatDate(toDate) })}
              </span>
            )}
          </div>
        )}

        {isError && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{queryError}</p>}
        {truncated && (
          <p className="mb-4 rounded-lg bg-warning/15 p-3 text-xs font-semibold text-warning">
            {t('list.truncated')}
          </p>
        )}

        {/* Only this section reloads. min-height keeps the layout from jumping. */}
        <div className="min-h-[14rem]">
          {isLoading ? (
            <Loader />
          ) : mode === 'none' && !isFetching ? (
            <EmptyState title={t('list.noEmployeeTitle')} description={t('list.noEmployeeBody')} />
          ) : (
            <div className={`transition-opacity ${isFetching ? 'pointer-events-none opacity-50' : ''}`}>
              <Table
                rows={rows}
                columns={[
                  { key: 'employee', header: t('list.columns.employee'), render: (row) => <EmployeeCell employeeId={row.employeeId} /> },
                  { key: 'attendanceDate', header: t('list.columns.date'), render: (row) => formatDate(row.attendanceDate) },
                  { key: 'status', header: t('list.columns.status'), render: (row) => <Badge status={row.statusLabel} /> },
                  {
                    key: 'reason',
                    header: t('list.columns.reason'),
                    render: (row) => (
                      <span className="block max-w-xs truncate" title={row.reason}>
                        {row.reason || '-'}
                      </span>
                    )
                  },
                  { key: 'createdAt', header: t('list.columns.setOn'), render: (row) => formatDateTime(row.createdAt) },
                  {
                    key: 'actions',
                    header: t('list.columns.actions'),
                    render: (row) => (
                      <Button variant="danger" icon={FiTrash2} onClick={() => setDeletingId(row.id)}>
                        {t('list.remove')}
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
              {t('common:pagination.summary', { page: pagination.page, totalPages: pagination.total_pages, shown: rows.length, total: pagination.total })}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                {t('common:actions.previous')}
              </Button>
              <Button variant="ghost" disabled={page >= pagination.total_pages || isFetching} onClick={() => setPage((current) => current + 1)}>
                {t('common:actions.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={Boolean(deletingId)} title={t('list.delete.title')} onClose={() => setDeletingId(null)}>
        {deleteError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{deleteError}</p>}
        <p className="text-sm text-app-text">{t('list.delete.confirm')}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeletingId(null)}>
            {t('common:actions.cancel')}
          </Button>
          <Button variant="danger" disabled={deleteState.isLoading} onClick={handleDeleteConfirm}>
            {deleteState.isLoading ? t('list.delete.removing') : t('list.delete.submit')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function statusLabel(raw) {
  return String(raw || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function workedTime(minutes) {
  const value = Number(minutes || 0)
  return `${Math.floor(value / 60)}h ${value % 60}m`
}

function OverviewTab() {
  const { t } = useTranslation('attendance')
  const fmt = useFormatters()
  const navigate = useNavigate()
  const [date, setDate] = useState(() => toLocalDateString())
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const { data, isLoading, isFetching, isError, error } = useGetDailyReportQuery({ date, page, limit: 20 })
  const sourceRows = useMemo(() => data?.items || [], [data?.items])
  // The documented report endpoint has no search parameter; filtering deliberately stays page-local.
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return sourceRows.filter((row) => {
      const matchesSearch = !needle || `${row.employeeName} ${row.employeeCode}`.toLowerCase().includes(needle)
      return matchesSearch && (!status || row.status === status)
    })
  }, [sourceRows, query, status])
  const pagination = data?.pagination || { page: 1, total_pages: 1, total: sourceRows.length }
  const stats = useMemo(() => ({
    total: sourceRows.length,
    present: sourceRows.filter((row) => row.status === 'PRESENT').length,
    absent: sourceRows.filter((row) => row.status === 'ABSENT').length,
    leave: sourceRows.filter((row) => row.status === 'ON_LEAVE').length,
    late: sourceRows.filter((row) => row.status === 'LATE').length
  }), [sourceRows])
  const changeDate = (value) => { setDate(value); setPage(1) }
  const shiftDate = (amount) => {
    const next = new Date(`${date}T12:00:00`)
    next.setDate(next.getDate() + amount)
    changeDate(toLocalDateString(next))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={FiFilter} label={t('overview.stats.total')} value={isLoading ? '-' : stats.total} tone="primary" />
        <StatCard icon={FiCheckCircle} label={t('overview.stats.present')} value={isLoading ? '-' : stats.present} tone="success" />
        <StatCard icon={FiUserX} label={t('overview.stats.absent')} value={isLoading ? '-' : stats.absent} tone="danger" />
        <StatCard icon={FiCalendar} label={t('overview.stats.onLeave')} value={isLoading ? '-' : stats.leave} tone="warning" />
        <StatCard icon={FiClock} label={t('overview.stats.late')} value={isLoading ? '-' : stats.late} tone="warning" />
      </div>
      <Card>
        <div className="mb-5 grid gap-3 rounded-lg border border-primary/10 bg-app-bg/60 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-end gap-2"><Button variant="ghost" icon={FiChevronLeft} onClick={() => shiftDate(-1)}>{t('overview.previousDay')}</Button><Input label={t('overview.date')} type="date" value={date} onChange={(event) => changeDate(event.target.value)} /></div>
          <Button variant="ghost" icon={FiChevronRight} className="self-end" onClick={() => shiftDate(1)}>{t('overview.nextDay')}</Button>
          <Input label={t('overview.search')} placeholder={t('overview.searchPlaceholder')} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
          <select aria-label={t('overview.status')} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="min-h-10 self-end rounded-lg border border-primary/15 bg-app-bg px-3 text-sm text-app-text">
            <option value="">{t('status:all')}</option><option value="PRESENT">{t('status:present')}</option><option value="ABSENT">{t('status:absent')}</option><option value="LATE">{t('status:late')}</option><option value="ON_LEAVE">{t('status:onLeave')}</option><option value="HALF_DAY">{t('status:halfDay')}</option>
          </select>
        </div>
        <p className="mb-4 text-xs text-app-muted">{t('overview.pageSearchHint')}</p>
        {isError && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(error)}</p>}
        {isLoading ? <Loader /> : <Table rows={rows} columns={[
          { key: 'employee', header: t('overview.columns.employee'), render: (row) => <div className="flex items-center gap-3"><Avatar name={row.employeeName} /><div><p className="font-bold">{row.employeeName}</p><p className="text-xs text-app-muted">{row.employeeCode}</p></div></div> },
          { key: 'status', header: t('overview.columns.status'), render: (row) => <Badge status={statusLabel(row.status)} /> },
          { key: 'checkIn', header: t('overview.columns.checkIn'), render: (row) => row.checkIn ? fmt.time(row.checkIn) : '-' },
          { key: 'checkOut', header: t('overview.columns.checkOut'), render: (row) => row.checkOut ? fmt.time(row.checkOut) : '-' },
          { key: 'late', header: t('overview.columns.late'), render: (row) => row.lateMinutes || 0 },
          { key: 'early', header: t('overview.columns.early'), render: (row) => row.earlyMinutes || 0 },
          { key: 'worked', header: t('overview.columns.worked'), render: (row) => workedTime(row.workedMinutes) },
          { key: 'actions', header: t('overview.columns.actions'), render: (row) => <Button variant="outline" icon={FiEye} aria-label={t('common:actions.view')} onClick={() => navigate(`/reports?tab=employee&employee=${encodeURIComponent(row.employeeId)}`)} /> }
        ]} />}
        <div className="mt-4 flex flex-col gap-3 border-t border-primary/10 pt-4 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between"><span>{t('common:pagination.summary', { page: pagination.page, totalPages: pagination.total_pages, shown: rows.length, total: pagination.total })}</span><div className="flex gap-2"><Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => value - 1)}>{t('common:actions.previous')}</Button><Button variant="ghost" disabled={page >= pagination.total_pages || isFetching} onClick={() => setPage((value) => value + 1)}>{t('common:actions.next')}</Button></div></div>
      </Card>
    </div>
  )
}

export default function AttendanceList() {
  const { t } = useTranslation('attendance')
  const [tab, setTab] = useState('overview')
  return <div className="space-y-6"><div><h1 className="text-xl font-black sm:text-2xl">{t('overview.title')}</h1><p className="text-sm text-app-muted">{t('overview.subtitle')}</p></div><div className="hide-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-primary/10 bg-app-surface/70 p-1.5 shadow-soft ring-1 ring-white/40 backdrop-blur dark:ring-white/5"><button type="button" onClick={() => setTab('overview')} className={`flex min-h-10 shrink-0 items-center rounded-xl px-4 text-sm font-bold ${tab === 'overview' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_10px_22px_-8px_rgb(var(--color-primary)/0.6)]' : 'text-app-muted hover:bg-primary/10 hover:text-app-text'}`}>{t('overview.tab')}</button><button type="button" onClick={() => setTab('overrides')} className={`flex min-h-10 shrink-0 items-center rounded-xl px-4 text-sm font-bold ${tab === 'overrides' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_10px_22px_-8px_rgb(var(--color-primary)/0.6)]' : 'text-app-muted hover:bg-primary/10 hover:text-app-text'}`}>{t('overview.overridesTab')}</button></div>{tab === 'overview' ? <OverviewTab /> : <OverridesTab />}</div>
}
