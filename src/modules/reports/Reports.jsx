import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiCalendar, FiClock, FiDownload, FiEye, FiPieChart, FiPrinter, FiSearch, FiSun, FiUser, FiX } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import Table from '../../components/ui/Table.jsx'
import ReportPrintHeader from '../../components/reports/ReportPrintHeader.jsx'
import { useGetEmployeeQuery, useGetEmployeesQuery } from '../../store/api/employeesApi.js'
import { useGetDailyReportQuery, useGetLateReportQuery, useGetLeaveReportQuery, useGetMonthlyReportQuery } from '../../store/api/reportsApi.js'
import { downloadCompanyExcelReport, downloadEmployeeExcelReport } from '../../services/reportExportService.js'
import { getApiErrorMessage } from '../../lib/apiError.js'
import { toLocalDateString } from '../../lib/date.js'
import { useFormatters } from '../../lib/format.js'


const NOW = new Date()

const DEFAULT_FROM_DATE = toLocalDateString(new Date(NOW.getFullYear(), NOW.getMonth(), 1))
const DEFAULT_TO_DATE = toLocalDateString(NOW)


const TABS = [
  { key: 'daily', icon: FiCalendar }, { key: 'monthly', icon: FiPieChart }, { key: 'late', icon: FiClock }, { key: 'leave', icon: FiSun }, { key: 'employee', icon: FiUser }
]

const DEFAULT_TAB = 'daily'


function isValidRange(fromDate, toDate) {
  return Boolean(fromDate && toDate && fromDate <= toDate)
}

function rangeLabel(fromDate, toDate) {
  return `${fromDate} to ${toDate}`
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 5) : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}


function statusLabel(raw) {
  if (!raw) return ''
  return String(raw)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function Reports() {
  const { t } = useTranslation('reports')
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || DEFAULT_TAB)
  const [fromDate, setFromDate] = useState(DEFAULT_FROM_DATE)
  const [toDate, setToDate] = useState(DEFAULT_TO_DATE)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const rangeValid = isValidRange(fromDate, toDate)

  async function handleCompanyExport() {
    if (!rangeValid) return
    setExporting(true)
    setExportError('')
    try {
      await downloadCompanyExcelReport({ fromDate, toDate })
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 print:hidden lg:flex-row lg:items-end">
        <div>
          <h1 className="text-xl font-black sm:text-2xl">{t('title')}</h1>
          <p className="text-sm text-app-muted">{t('subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Input label={t('filters.fromDate')} type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="w-40" />
          <Input label={t('filters.toDate')} type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="w-40" />
          {activeTab !== 'employee' && (
            <Button icon={FiDownload} onClick={handleCompanyExport} disabled={exporting || !rangeValid} className="whitespace-nowrap">
              {exporting ? t('actions.exporting') : t('actions.companyExcel')}
            </Button>
          )}
        </div>
      </div>

      {!rangeValid && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger print:hidden">{t('errors.invalidRange')}</p>}

      {exportError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger print:hidden">{exportError}</p>}

      <div className="hide-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-primary/10 bg-app-surface/70 p-1.5 shadow-soft ring-1 ring-white/40 backdrop-blur print:hidden dark:ring-white/5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key); setSearchParams((current) => { const next = new window.URLSearchParams(current); next.set('tab', tab.key); return next }) }}
              className={`flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-all duration-200 ease-out ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_10px_22px_-8px_rgb(var(--color-primary)/0.6)]'
                  : 'text-app-muted hover:bg-primary/10 hover:text-app-text'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? '' : 'opacity-70'}`} />
              {t(`tabs.${tab.key}`)}
            </button>
          )
        })}
      </div>

      {activeTab === 'daily' && <DailyReportTab />}
      {activeTab === 'monthly' && <MonthlyReportTab fromDate={fromDate} toDate={toDate} />}
      {activeTab === 'late' && <LateReportTab fromDate={fromDate} toDate={toDate} />}
      {activeTab === 'leave' && <LeaveReportTab fromDate={fromDate} toDate={toDate} />}
      {activeTab === 'employee' && <EmployeeReportTab fromDate={fromDate} toDate={toDate} />}
    </div>
  )
}

/* ------------------------------ Daily tab ------------------------------ */

function DailyReportTab() {
  const { t } = useTranslation('reports')
  const [date, setDate] = useState(() => toLocalDateString())
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, isLoading, isFetching, isError, error } = useGetDailyReportQuery({ date, page, limit })
  const rows = data?.items || []
  const pagination = data?.pagination || { page: 1, total_pages: 1, total: rows.length }

  useEffect(() => {
    setPage(1)
  }, [date])

  return (
    <Card className="space-y-4">
      <ReportPrintHeader title={t('daily.title')} subtitle={date} />
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <Input label={t('filters.date')} type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full sm:w-56" />
        <Button variant="outline" icon={FiPrinter} onClick={() => window.print()}>
          {t('actions.print')}
        </Button>
      </div>

      {isError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(error)}</p>}
      {isFetching && !isLoading && <p className="text-sm font-semibold text-app-muted print:hidden">{t('actions.refreshing')}</p>}

      {isLoading ? (
        <Loader />
      ) : (
        <Table
          rows={rows}
          columns={[
            {
              key: 'employee',
              header: t('daily.columns.employee'),
              render: (row) => (
                <div>
                  <p className="font-bold">{row.employeeName}</p>
                  <p className="text-xs text-app-muted">{row.employeeCode}</p>
                </div>
              )
            },
            { key: 'status', header: t('daily.columns.status'), render: (row) => <Badge status={statusLabel(row.status)} /> },
            { key: 'checkIn', header: t('daily.columns.checkIn'), render: (row) => formatTime(row.checkIn) },
            { key: 'checkOut', header: t('daily.columns.checkOut'), render: (row) => formatTime(row.checkOut) },
            { key: 'late', header: t('daily.columns.late'), render: (row) => row.lateMinutes || 0 },
            { key: 'early', header: t('daily.columns.early'), render: (row) => row.earlyMinutes || 0 },
            { key: 'worked', header: t('daily.columns.worked'), render: (row) => row.workedMinutes || 0 }
          ]}
        />
      )}

      <div className="flex flex-col gap-3 text-sm text-app-muted print:hidden sm:flex-row sm:items-center sm:justify-between">
        <span>
          {t('common:pagination.summary', { page: pagination.page, totalPages: pagination.total_pages || 1, shown: rows.length, total: pagination.total ?? rows.length })}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            {t('common:actions.previous')}
          </Button>
          <Button variant="outline" disabled={page >= (pagination.total_pages || 1) || isFetching} onClick={() => setPage((current) => current + 1)}>
            {t('common:actions.next')}
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* ----------------------------- Monthly tab ------------------------------ */

function MonthlyReportTab({ fromDate, toDate }) {
  const { data, isLoading, isError, error } = useGetMonthlyReportQuery({ fromDate, toDate }, { skip: !isValidRange(fromDate, toDate) })
  const rows = data?.items || []

  return (
    <Card className="space-y-4">
      <ReportPrintHeader title="Monthly Attendance Summary" subtitle={rangeLabel(fromDate, toDate)} />
      <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-app-muted">
          Weekend days: <strong className="text-app-text">{data?.weekendDays ?? '-'}</strong> · Holiday days:{' '}
          <strong className="text-app-text">{data?.holidayDays ?? '-'}</strong>
        </p>
        <Button variant="outline" icon={FiPrinter} onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {isError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(error)}</p>}

      {isLoading ? (
        <Loader />
      ) : (
        <Table
          rows={rows}
          columns={[
            {
              key: 'employee',
              header: 'Employee',
              render: (row) => (
                <div>
                  <p className="font-bold">{row.name}</p>
                  <p className="text-xs text-app-muted">{row.employeeCode}</p>
                </div>
              )
            },
            { key: 'workingDays', header: 'Working Days', render: (row) => row.workingDays },
            { key: 'presentDays', header: 'Present', render: (row) => row.presentDays },
            { key: 'absentDays', header: 'Absent', render: (row) => row.absentDays },
            { key: 'leaveDays', header: 'Leave', render: (row) => row.leaveDays },
            { key: 'lateCount', header: 'Late Count', render: (row) => row.lateCount },
            { key: 'workedHours', header: 'Worked Hours', render: (row) => row.workedHours }
          ]}
        />
      )}
    </Card>
  )
}

/* ------------------------------- Late tab -------------------------------- */

function LateReportTab({ fromDate, toDate }) {
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, isLoading, isFetching, isError, error } = useGetLateReportQuery({ fromDate, toDate, page, limit }, { skip: !isValidRange(fromDate, toDate) })
  const rows = data?.items || []
  const pagination = data?.pagination || { page: 1, total_pages: 1, total: rows.length }

  useEffect(() => {
    setPage(1)
  }, [fromDate, toDate])

  return (
    <Card className="space-y-4">
      <ReportPrintHeader title="Late Arrivals Report" subtitle={rangeLabel(fromDate, toDate)} />
      <div className="flex justify-end print:hidden">
        <Button variant="outline" icon={FiPrinter} onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {isError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(error)}</p>}

      {isLoading ? (
        <Loader />
      ) : (
        <Table
          rows={rows}
          columns={[
            { key: 'date', header: 'Date', render: (row) => row.date },
            {
              key: 'employee',
              header: 'Employee',
              render: (row) => (
                <div>
                  <p className="font-bold">{row.employeeName}</p>
                  <p className="text-xs text-app-muted">{row.employeeCode}</p>
                </div>
              )
            },
            { key: 'expected', header: 'Expected In', render: (row) => row.expectedLogin },
            { key: 'actual', header: 'Actual In', render: (row) => formatTime(row.checkIn) },
            { key: 'late', header: 'Late (min)', render: (row) => row.lateMinutes }
          ]}
        />
      )}

      <div className="flex flex-col gap-3 text-sm text-app-muted print:hidden sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {pagination.page} of {pagination.total_pages || 1} - {pagination.total ?? rows.length} records
        </span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </Button>
          <Button variant="outline" disabled={page >= (pagination.total_pages || 1) || isFetching} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------- Leave tab -------------------------------- */

function LeaveReportTab({ fromDate, toDate }) {
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, isLoading, isFetching, isError, error } = useGetLeaveReportQuery({ fromDate, toDate, page, limit }, { skip: !isValidRange(fromDate, toDate) })
  const rows = data?.items || []
  const pagination = data?.pagination || { page: 1, total_pages: 1, total: rows.length }

  useEffect(() => {
    setPage(1)
  }, [fromDate, toDate])

  return (
    <Card className="space-y-4">
      <ReportPrintHeader title="Leave Report" subtitle={rangeLabel(fromDate, toDate)} />
      <div className="flex justify-end print:hidden">
        <Button variant="outline" icon={FiPrinter} onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {isError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(error)}</p>}

      {isLoading ? (
        <Loader />
      ) : (
        <Table
          rows={rows}
          columns={[
            {
              key: 'employee',
              header: 'Employee',
              render: (row) => (
                <div>
                  <p className="font-bold">{row.employeeName}</p>
                  <p className="text-xs text-app-muted">{row.employeeCode}</p>
                </div>
              )
            },
            { key: 'type', header: 'Leave Type', render: (row) => row.leaveTypeName },
            { key: 'range', header: 'Dates', render: (row) => `${row.startDate} to ${row.endDate}` },
            { key: 'days', header: 'Days', render: (row) => row.totalDays },
            { key: 'status', header: 'Status', render: (row) => <Badge status={statusLabel(row.status)} /> },
            { key: 'reason', header: 'Reason', render: (row) => row.reason || '-' }
          ]}
        />
      )}

      <div className="flex flex-col gap-3 text-sm text-app-muted print:hidden sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {pagination.page} of {pagination.total_pages || 1} - {pagination.total ?? rows.length} records
        </span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </Button>
          <Button variant="outline" disabled={page >= (pagination.total_pages || 1) || isFetching} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* --------------------------- Employee Report tab --------------------------- */
// Employee search karo (naam / employee ID), aur uska poora month ka report
// (summary + late + leave + kisi ek din ka detail) ek jagah dikhe,
// print bhi ho sake aur Excel me bhi download ho.

function EmployeeReportTab({ fromDate, toDate }) {
  const { t } = useTranslation('reports')
  const formatters = useFormatters()
  const [params, setParams] = useSearchParams()
  const employeeId = params.get('employee')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [date, setDate] = useState('')
  const [excelExporting, setExcelExporting] = useState(false)
  const [excelError, setExcelError] = useState('')
  const [employeePage, setEmployeePage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setEmployeePage(1)
  }, [debouncedSearch])

  const { data: employeeResults, isFetching: employeesFetching } = useGetEmployeesQuery(
    { page: employeePage, search: debouncedSearch, limit: 20 }
  )
  const { data: linkedEmployee } = useGetEmployeeQuery(employeeId, { skip: !employeeId })

  useEffect(() => {
    if (employeeId && linkedEmployee) setSelectedEmployee(linkedEmployee)
  }, [employeeId, linkedEmployee])

  const rangeValid = isValidRange(fromDate, toDate)
  const { data: monthlyData, isLoading: monthlyLoading } = useGetMonthlyReportQuery({ fromDate, toDate }, { skip: !selectedEmployee || !rangeValid })
  // Late/Leave APIs abhi employee-wise filter support nahi karte (sirf year/month/page/limit),
  // isliye ek bada page fetch karke client-side is employee ke rows filter kiye ja rahe hain.
  const { data: lateData, isLoading: lateLoading } = useGetLateReportQuery({ fromDate, toDate, page: 1, limit: 200 }, { skip: !selectedEmployee || !rangeValid })
  const { data: leaveData, isLoading: leaveLoading } = useGetLeaveReportQuery({ fromDate, toDate, page: 1, limit: 200 }, { skip: !selectedEmployee || !rangeValid })
  const { data: dailyData, isFetching: dailyFetching } = useGetDailyReportQuery(
    { date, page: 1, limit: 200 },
    { skip: !selectedEmployee || !date }
  )

  const summary = useMemo(() => {
    if (!selectedEmployee) return null
    return (monthlyData?.items || []).find((row) => String(row.employeeId) === String(selectedEmployee.id)) || null
  }, [monthlyData, selectedEmployee])

  const lateRows = useMemo(() => {
    if (!selectedEmployee) return []
    return (lateData?.items || []).filter((row) => row.employeeCode === selectedEmployee.code)
  }, [lateData, selectedEmployee])

  const leaveRows = useMemo(() => {
    if (!selectedEmployee) return []
    return (leaveData?.items || []).filter((row) => row.employeeCode === selectedEmployee.code)
  }, [leaveData, selectedEmployee])

  const dailyRow = useMemo(() => {
    if (!selectedEmployee || !date) return null
    return (dailyData?.items || []).find((row) => String(row.employeeId) === String(selectedEmployee.id)) || null
  }, [dailyData, selectedEmployee, date])

  const isBusy = monthlyLoading || lateLoading || leaveLoading

  function clearEmployee() {
    setSelectedEmployee(null)
    setSearch('')
    setParams((current) => { const next = new window.URLSearchParams(current); next.delete('employee'); return next })
  }

  function backToList() {
    setSelectedEmployee(null)
    setDate('')
    setSearch('')
    setDebouncedSearch('')
    setDropdownOpen(false)
    setEmployeePage(1)
    setParams((current) => { const next = new window.URLSearchParams(current); next.delete('employee'); return next })
  }

  function selectEmployee(employee) {
    setSelectedEmployee(employee)
    setParams((current) => { const next = new window.URLSearchParams(current); next.set('employee', employee.id); return next })
    setSearch(`${employee.name} (${employee.code})`)
    setDropdownOpen(false)
  }

  async function handleEmployeeExcel() {
    if (!selectedEmployee) return
    setExcelExporting(true)
    setExcelError('')
    try {
      await downloadEmployeeExcelReport({
        employee: selectedEmployee,
        fromDate,
        toDate,
        summary,
        lateRows,
        leaveRows,
        dailyRows: dailyRow ? [dailyRow] : [],
        t,
        formatters
      })
    } catch (err) {
      setExcelError(err.message || 'Excel export failed.')
    } finally {
      setExcelExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="print:hidden">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <label className="mb-1.5 block text-sm font-semibold text-app-text">Search Employee (Name / Employee ID)</label>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
              <input
                className="min-h-10 w-full rounded-lg border border-primary/15 bg-app-bg pl-9 pr-9 text-app-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Satyam Singh or EMP001"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setSelectedEmployee(null)
                  setParams((current) => { const next = new window.URLSearchParams(current); next.delete('employee'); return next })
                  setDropdownOpen(true)
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              />
              {search && (
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted" onClick={clearEmployee}>
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            {dropdownOpen && debouncedSearch && !selectedEmployee && (
              <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-primary/15 bg-app-surface shadow-soft">
                {employeesFetching && <p className="p-3 text-sm text-app-muted">Searching...</p>}
                {!employeesFetching && !(employeeResults?.items || []).length && <p className="p-3 text-sm text-app-muted">No employee found.</p>}
                {(employeeResults?.items || []).map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-primary/10"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      selectEmployee(employee)
                    }}
                  >
                    <span className="font-semibold text-app-text">{employee.name}</span>
                    <span className="text-xs text-app-muted">{employee.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input label="Specific Date (optional)" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </Card>

      {!selectedEmployee && (
        <Card className="space-y-4">
          <p className="text-sm text-app-muted">{t('employee.searchHint', { from: fromDate, to: toDate })}</p>
          {employeesFetching ? <Loader /> : <Table rows={employeeResults?.items || []} columns={[
            { key: 'employee', header: t('employee.list.employee'), render: (employee) => <button type="button" className="flex items-center gap-3 text-left" onClick={() => selectEmployee(employee)}><Avatar name={employee.name} /><span className="font-bold text-app-text">{employee.name}</span></button> },
            { key: 'code', header: t('employee.list.code'), render: (employee) => employee.code || '-' },
            { key: 'email', header: t('employee.list.email'), render: (employee) => employee.email || '-' },
            { key: 'phone', header: t('employee.list.phone'), render: (employee) => employee.phone || '-' },
            { key: 'status', header: t('employee.list.status'), render: (employee) => <Badge status={employee.status} /> },
            { key: 'actions', header: t('employee.list.actions'), headerClassName: 'text-left', cellClassName: 'text-left', render: (employee) => <Button variant="outline" icon={FiEye} aria-label={t('actions.view')} onClick={() => selectEmployee(employee)} /> }
          ]} />}
          {(employeeResults?.pagination?.total_pages || 1) > 1 && <div className="flex items-center justify-between border-t border-primary/10 pt-4 text-sm text-app-muted"><span>{t('common:pagination.summary', { page: employeeResults.pagination.page, totalPages: employeeResults.pagination.total_pages, shown: employeeResults.items.length, total: employeeResults.pagination.total })}</span><div className="flex gap-2"><Button variant="outline" disabled={employeePage <= 1 || employeesFetching} onClick={() => setEmployeePage((page) => page - 1)}>{t('common:actions.previous')}</Button><Button variant="outline" disabled={employeePage >= employeeResults.pagination.total_pages || employeesFetching} onClick={() => setEmployeePage((page) => page + 1)}>{t('common:actions.next')}</Button></div></div>}
        </Card>
      )}

      {selectedEmployee && (
        <Card className="space-y-6">
          <ReportPrintHeader
            title="Employee Attendance Report"
            subtitle={`${selectedEmployee.name} (${selectedEmployee.code}) · ${rangeLabel(fromDate, toDate)}`}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" icon={FiArrowLeft} className="print:hidden" onClick={backToList}>{t('actions.back')}</Button>
              <Avatar name={selectedEmployee.name} />
              <div>
                <p className="text-lg font-black text-app-text">{selectedEmployee.name}</p>
                <p className="text-sm text-app-muted">
                  {selectedEmployee.code}  {selectedEmployee.department}  {selectedEmployee.role}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" icon={FiPrinter} onClick={() => window.print()}>
                Print / Save PDF
              </Button>
              <Button icon={FiDownload} onClick={handleEmployeeExcel} disabled={excelExporting}>
                {excelExporting ? 'Preparing...' : 'Download Excel'}
              </Button>
            </div>
          </div>

          {excelError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger print:hidden">{excelError}</p>}

          {isBusy ? (
            <Loader />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Present Days" value={summary?.presentDays ?? '-'} tone="success" icon={FiCalendar} />
                <StatCard label="Absent Days" value={summary?.absentDays ?? '-'} tone="danger" icon={FiCalendar} />
                <StatCard label="Leave Days" value={summary?.leaveDays ?? '-'} tone="secondary" icon={FiCalendar} />
                <StatCard
                  label="Late Count"
                  value={summary?.lateCount ?? '-'}
                  tone="warning"
                  icon={FiCalendar}
                  meta={summary ? `${summary.totalLateMinutes || 0} min total` : ''}
                />
              </div>

              {!summary && (
               <p className="text-sm text-app-muted">No data found for this employee in the selected date range.</p>
              )}

              {date && (
                <div>
                  <h3 className="mb-2 font-bold text-app-text">Attendance on {date}</h3>
                  {dailyFetching ? (
                    <Loader />
                  ) : dailyRow ? (
                    <Table
                      rows={[dailyRow]}
                      columns={[
                        { key: 'status', header: 'Status', render: (row) => <Badge status={statusLabel(row.status)} /> },
                        { key: 'checkIn', header: 'Check In', render: (row) => formatTime(row.checkIn) },
                        { key: 'checkOut', header: 'Check Out', render: (row) => formatTime(row.checkOut) },
                        { key: 'late', header: 'Late (min)', render: (row) => row.lateMinutes || 0 },
                        { key: 'worked', header: 'Worked (min)', render: (row) => row.workedMinutes || 0 }
                      ]}
                    />
                  ) : (
                   <p className="text-sm text-app-muted">No record found for this date.</p>
                  )}
                </div>
              )}

              <div>
                <h3 className="mb-2 font-bold text-app-text">Late Arrivals ({lateRows.length})</h3>
                <Table
                  rows={lateRows}
                  columns={[
                    { key: 'date', header: 'Date', render: (row) => row.date },
                    { key: 'expected', header: 'Expected In', render: (row) => row.expectedLogin },
                    { key: 'actual', header: 'Actual In', render: (row) => formatTime(row.checkIn) },
                    { key: 'late', header: 'Late (min)', render: (row) => row.lateMinutes }
                  ]}
                />
              </div>

              <div>
                <h3 className="mb-2 font-bold text-app-text">Leave History ({leaveRows.length})</h3>
                <Table
                  rows={leaveRows}
                  columns={[
                    { key: 'type', header: 'Leave Type', render: (row) => row.leaveTypeName },
                    { key: 'range', header: 'Dates', render: (row) => `${row.startDate} to ${row.endDate}` },
                    { key: 'days', header: 'Days', render: (row) => row.totalDays },
                    { key: 'status', header: 'Status', render: (row) => <Badge status={statusLabel(row.status)} /> },
                    { key: 'reason', header: 'Reason', render: (row) => row.reason || '-' }
                  ]}
                />
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}