import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCalendar, FiCheckCircle, FiFilter, FiPlus, FiSearch, FiTrash2, FiUserX, FiX } from 'react-icons/fi'
import Avatar from '../../../components/ui/Avatar.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Card from '../../../components/ui/Card.jsx'
import EmptyState from '../../../components/ui/EmptyState.jsx'
import Input from '../../../components/ui/Input.jsx'
import Loader from '../../../components/ui/Loader.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Table from '../../../components/ui/Table.jsx'
import { useDebounce } from '../../../hooks/useDebounce.js'
import { useAttendanceOverrideSearch } from '../../../hooks/useAttendanceOverrides.js'
import { getApiErrorMessage } from '../../../lib/apiError.js'
import { useFormatters } from '../../../lib/format.js'
import { notify } from '../../../lib/notify.js'
import { useDeleteAttendanceOverrideMutation } from '../../../store/api/attendanceOverridesApi.js'
import { useGetEmployeeQuery } from '../../../store/api/employeesApi.js'
import AttendanceStat from './AttendanceStat.jsx'
import OverridePickerModal from './OverridePickerModal.jsx'

// 'YYYY-MM-DD' ko local date banate hain (new Date('YYYY-MM-DD') UTC maan leta hai).
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

export default function OverridesTab() {
  const { t } = useTranslation('attendance')
  const fmt = useFormatters()
  const formatDate = (value) => (value ? fmt.date(parseDateOnly(value)) : '-')
  const formatDateTime = (value) => (value ? fmt.dateTime(value) : '-')

  // Input ki apni state (typing instant); query ko sirf debounced value milti hai
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput.trim(), 400)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)

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

  // Page reset handlers me hota hai (useEffect me nahi) taaki double request na jaye
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

  function closeDelete() {
    deleteState.reset()
    setDeletingId(null)
  }

  async function handleDeleteConfirm() {
    try {
      await deleteOverride(deletingId).unwrap()
      notify.success(t('list.delete.done'))
      setDeletingId(null)
      // Last row hata di to pichhle page par jao. List invalidatesTags se khud refresh hoti hai.
      if (rows.length === 1 && page > 1) setPage(page - 1)
    } catch (err) {
      void err
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black sm:text-2xl">{t('list.title')}</h1>
          <p className="text-sm text-app-muted">{t('list.subtitle')}</p>
        </div>
        <Button variant="warning" icon={FiPlus} onClick={() => setPickerOpen(true)}>
          {t('list.add')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AttendanceStat icon={FiFilter} label={t('list.stats.total')} value={statValue(stats.total)} tone="primary" />
        <AttendanceStat icon={FiUserX} label={t('list.stats.absent')} value={statValue(stats.absent)} tone="danger" />
        <AttendanceStat icon={FiCheckCircle} label={t('list.stats.present')} value={statValue(stats.present)} tone="success" />
        <AttendanceStat icon={FiCalendar} label={t('list.stats.onLeave')} value={statValue(stats.onLeave)} tone="warning" />
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
        {truncated && <p className="mb-4 rounded-lg bg-warning/15 p-3 text-xs font-semibold text-warning">{t('list.truncated')}</p>}

        {/* Sirf ye section reload hota hai. min-height se layout jump nahi karta. */}
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
                  { key: 'createdAt', header: t('list.columns.setOn'), render: (row) => formatDateTime(row.updatedAt || row.createdAt) },
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

      <OverridePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />

      <Modal open={Boolean(deletingId)} title={t('list.delete.title')} onClose={closeDelete}>
        {deleteError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{deleteError}</p>}
        <p className="text-sm text-app-text">{t('list.delete.confirm')}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={closeDelete}>
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