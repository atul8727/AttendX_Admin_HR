import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCalendar, FiCheck, FiChevronLeft, FiChevronRight, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import Avatar from '../../../components/ui/Avatar.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Loader from '../../../components/ui/Loader.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Table from '../../../components/ui/Table.jsx'
import { toBadgeLabel } from '../../../constants/attendanceOverride.js'
import { getApiErrorMessage } from '../../../lib/apiError.js'
import { toLocalDateString } from '../../../lib/date.js'
import { useFormatters } from '../../../lib/format.js'
import { useGetOverridesByDateQuery } from '../../../store/api/attendanceOverridesApi.js'
import { useGetDailyReportQuery } from '../../../store/api/reportsApi.js'
import { OverrideForm } from './OverrideModal.jsx'

const SETTABLE = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE']
const FIELD_CLASS =
  'min-h-11 w-full rounded-lg border border-primary/15 bg-app-bg px-3 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-primary focus:ring-2 focus:ring-primary/20'

// 'YYYY-MM-DD' -> local Date (new Date('YYYY-MM-DD') UTC maan leta hai)
function parseDateOnly(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Add Override flow:
 *  Step 1 -> attendance (daily report) list: date + search + status filter se employee chuno
 *  Step 2 -> us employee/date ke liye naya status + reason, Save -> override list me dikhega
 * Step 1 wide modal me khulta hai, Step 2 (form) normal width me.
 */
export default function OverridePickerModal({ open, onClose }) {
  const { t } = useTranslation('attendance')
  const [picked, setPicked] = useState(null)

  function close() {
    setPicked(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      title={picked ? t('modal.overrideTitle') : t('picker.title')}
      onClose={close}
      className={picked ? '' : '!max-w-6xl sm:!p-6'}
    >
      {picked ? <OverrideForm initial={picked} locked onClose={close} onBack={() => setPicked(null)} /> : <PickerList onPick={setPicked} />}
    </Modal>
  )
}

function PickerList({ onPick }) {
  const { t } = useTranslation('attendance')
  const fmt = useFormatters()
  const today = toLocalDateString()
  const [date, setDate] = useState(today)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading, isFetching, isError, error } = useGetDailyReportQuery({ date, page, limit: 20 })
  const { data: overrides } = useGetOverridesByDateQuery(date)

  const rows = useMemo(() => {
    const overrideByEmployee = new Map((overrides || []).map((item) => [String(item.employeeId), item]))
    const needle = query.trim().toLowerCase()
    return (data?.items || [])
      .map((row) => ({
        ...row,
        id: row.id ?? `${row.employeeId}-${date}`,
        reportStatus: String(row.status || '').toUpperCase(),
        override: overrideByEmployee.get(String(row.employeeId)) || null
      }))
      .filter((row) => {
        const matchesSearch = !needle || `${row.employeeName} ${row.employeeCode}`.toLowerCase().includes(needle)
        return matchesSearch && (!status || row.reportStatus === status)
      })
  }, [data?.items, overrides, query, status, date])

  const pagination = data?.pagination || { page: 1, total_pages: 1, total: rows.length }
  const hasFilters = Boolean(query || status)

  function changeDate(value) {
    if (!value) return
    setDate(value)
    setPage(1)
  }
  function shiftDate(amount) {
    const next = new Date(`${date}T12:00:00`)
    next.setDate(next.getDate() + amount)
    changeDate(toLocalDateString(next))
  }
  function clearFilters() {
    setQuery('')
    setStatus('')
  }

  // Backend me update API nahi hai, isliye jo employee us date par pehle se override hai use dobara override nahi karte.
  // Badalna ho to override list se Remove karke naya add karo.
  function pick(row) {
    if (row.override) return
    onPick({
      employeeId: row.employeeId,
      attendanceDate: date,
      status: SETTABLE.includes(row.reportStatus) ? row.reportStatus : 'PRESENT',
      originalStatus: row.reportStatus
    })
  }

  const columns = [
    {
      key: 'employee',
      header: t('overview.columns.employee'),
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.employeeName} />
          <div className="min-w-0">
            <p className="truncate font-bold">{row.employeeName}</p>
            <p className="truncate text-xs text-app-muted">{row.employeeCode}</p>
          </div>
        </div>
      )
    },
    { key: 'status', header: t('overview.columns.status'), render: (row) => <Badge status={toBadgeLabel(row.reportStatus)} /> },
    {
      key: 'overridden',
      header: t('picker.overrideColumn'),
      render: (row) =>
        row.override ? (
          <div className="space-y-1">
            <Badge status={toBadgeLabel(row.override.status)} />
            <p className="text-xs text-app-muted">{t('picker.removeFirst')}</p>
          </div>
        ) : (
          <span className="text-app-muted">-</span>
        )
    },
    {
      key: 'action',
      header: t('overview.columns.actions'),
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        row.override ? (
          <Button variant="ghost" icon={FiCheck} disabled>
            {t('picker.alreadyOverridden')}
          </Button>
        ) : (
          <Button variant="warning" icon={FiPlus} onClick={() => pick(row)}>
            {t('picker.select')}
          </Button>
        )
      )
    }
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-app-muted">{t('picker.subtitle')}</p>

      {/* Toolbar */}
      <div className="grid gap-4 rounded-xl border border-primary/10 bg-app-bg/60 p-4 md:grid-cols-[minmax(17rem,1.1fr)_minmax(0,1.4fr)_minmax(10rem,0.8fr)]">
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-app-text">{t('overview.date')}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" icon={FiChevronLeft} className="!min-h-11 shrink-0 border border-primary/15 px-3" aria-label={t('overview.previousDay')} onClick={() => shiftDate(-1)} />
            <input type="date" value={date} onChange={(event) => changeDate(event.target.value)} className={`${FIELD_CLASS} min-w-0 flex-1`} aria-label={t('overview.date')} />
            <Button variant="ghost" icon={FiChevronRight} className="!min-h-11 shrink-0 border border-primary/15 px-3" aria-label={t('overview.nextDay')} onClick={() => shiftDate(1)} />
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-app-muted">
            <FiCalendar className="h-3.5 w-3.5" />
            {fmt.date(parseDateOnly(date), { dateStyle: 'full' })}
            {date !== today && (
              <button type="button" onClick={() => changeDate(today)} className="ms-1 font-bold text-primary hover:underline">
                {t('picker.today')}
              </button>
            )}
          </p>
        </div>

        <label className="block text-sm font-semibold text-app-text">
          <span className="mb-1.5 block">{t('overview.search')}</span>
          <span className="relative block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
            <input
              type="search"
              autoComplete="off"
              placeholder={t('overview.searchPlaceholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={`${FIELD_CLASS} pl-9`}
            />
          </span>
        </label>

        <label className="block text-sm font-semibold text-app-text">
          <span className="mb-1.5 block">{t('overview.status')}</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={FIELD_CLASS}>
            <option value="">{t('status:all')}</option>
            <option value="PRESENT">{t('status:present')}</option>
            <option value="ABSENT">{t('status:absent')}</option>
            <option value="LATE">{t('status:late')}</option>
            <option value="ON_LEAVE">{t('status:onLeave')}</option>
            <option value="HALF_DAY">{t('status:halfDay')}</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-app-muted">{t('overview.pageSearchHint')}</p>
        {hasFilters && (
          <Button variant="ghost" icon={FiX} className="!min-h-8 !py-1 text-xs" onClick={clearFilters}>
            {t('list.filters.clear')}
          </Button>
        )}
      </div>

      {isError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(error)}</p>}

      {/* List: sirf ye hissa scroll hota hai, footer hamesha dikhta hai */}
      <div className="hide-scrollbar max-h-[46vh] min-h-[12rem] overflow-y-auto rounded-lg">
        {isLoading ? (
          <Loader />
        ) : (
          <div className={`transition-opacity ${isFetching ? 'pointer-events-none opacity-60' : ''}`}>
            <Table rows={rows} columns={columns} onRowClick={(row) => pick(row)} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-primary/10 pt-4 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between">
        <span>{t('common:pagination.summary', { page: pagination.page, totalPages: pagination.total_pages, shown: rows.length, total: pagination.total })}</span>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            {t('common:actions.previous')}
          </Button>
          <Button variant="ghost" disabled={page >= pagination.total_pages || isFetching} onClick={() => setPage((value) => value + 1)}>
            {t('common:actions.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}