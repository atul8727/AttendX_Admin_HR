import { useEffect, useMemo, useState } from 'react'
import { FiCalendar, FiClock, FiDownload, FiPieChart, FiPrinter, FiSearch, FiSun, FiUser, FiX } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Select from '../../components/ui/Select.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import Table from '../../components/ui/Table.jsx'
import ReportPrintHeader from '../../components/reports/ReportPrintHeader.jsx'
import { useGetEmployeesQuery } from '../../store/api/employeesApi.js'
import { useGetDailyReportQuery, useGetLateReportQuery, useGetLeaveReportQuery, useGetMonthlyReportQuery } from '../../store/api/reportsApi.js'
import { downloadCompanyExcelReport, downloadEmployeeExcelReport } from '../../services/reportExportService.js'

const NOW = new Date()
const CURRENT_YEAR = NOW.getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((year) => ({ value: String(year), label: String(year) }))
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Date(2000, index, 1).toLocaleString('en-US', { month: 'long' })
}))

const TABS = [
  { key: 'employee', label: 'Employee Report', icon: FiUser },
  { key: 'daily', label: 'Daily', icon: FiCalendar },
  { key: 'monthly', label: 'Monthly', icon: FiPieChart },
  { key: 'late', label: 'Late', icon: FiClock },
  { key: 'leave', label: 'Leave', icon: FiSun }
]

function getApiErrorMessage(error) {
  return error?.data?.message || error?.error || error?.message || 'Something went wrong.'
}

function monthLabel(month) {
  return MONTH_OPTIONS[Number(month) - 1]?.label || month
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 5) : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// "CHECKED_OUT" -> "Checked Out" (statusConfig.js ke Badge labels se match karne ke liye)
function statusLabel(raw) {
  if (!raw) return ''
  return String(raw)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('employee')
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const [month, setMonth] = useState(String(NOW.getMonth() + 1))
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  async function handleCompanyExport() {
    setExporting(true)
    setExportError('')
    try {
      await downloadCompanyExcelReport({ year, month })
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
          <h1 className="text-xl font-black sm:text-2xl">Reports</h1>
          <p className="text-sm text-app-muted">Daily, monthly, late aur leave reports — print karo ya Excel me download.</p>
        </div>

        {activeTab !== 'employee' && (
          <div className="flex flex-wrap items-end gap-2">
            <Select label="Year" value={year} onChange={(event) => setYear(event.target.value)} options={YEAR_OPTIONS} className="w-24" />
            <Select label="Month" value={month} onChange={(event) => setMonth(event.target.value)} options={MONTH_OPTIONS} className="w-36" />
            <Button icon={FiDownload} onClick={handleCompanyExport} disabled={exporting} className="whitespace-nowrap">
              {exporting ? 'Exporting...' : 'Company Excel'}
            </Button>
          </div>
        )}
      </div>

      {exportError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger print:hidden">{exportError}</p>}

      <div className="hide-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-primary/10 bg-app-surface/70 p-1.5 shadow-soft ring-1 ring-white/40 backdrop-blur print:hidden dark:ring-white/5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-all duration-200 ease-out ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_10px_22px_-8px_rgb(var(--color-primary)/0.6)]'
                  : 'text-app-muted hover:bg-primary/10 hover:text-app-text'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? '' : 'opacity-70'}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'employee' && <EmployeeReportTab year={year} month={month} />}
      {activeTab === 'daily' && <DailyReportTab />}
      {activeTab === 'monthly' && <MonthlyReportTab year={year} month={month} />}
      {activeTab === 'late' && <LateReportTab year={year} month={month} />}
      {activeTab === 'leave' && <LeaveReportTab year={year} month={month} />}
    </div>
  )
}

/* ------------------------------ Daily tab ------------------------------ */

function DailyReportTab() {
  const [date, setDate] = useState(NOW.toISOString().slice(0, 10))
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, isLoading, isFetching, isError, error } = useGetDailyReportQuery({ date, page, limit })
  const rows = data?.items || []
  const pagination = data?.pagination || { page: 1, total_pages: 1, total: rows.length }

  useEffect(() => setPage(1), [date])

  return (
    <Card className="space-y-4">
      <ReportPrintHeader title="Daily Attendance Report" subtitle={date} />
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <Input label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full sm:w-56" />
        <Button variant="ghost" icon={FiPrinter} onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {isError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(error)}</p>}
      {isFetching && !isLoading && <p className="text-sm font-semibold text-app-muted print:hidden">Refreshing...</p>}

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
            { key: 'status', header: 'Status', render: (row) => <Badge status={statusLabel(row.status)} /> },
            { key: 'checkIn', header: 'Check In', render: (row) => formatTime(row.checkIn) },
            { key: 'checkOut', header: 'Check Out', render: (row) => formatTime(row.checkOut) },
            { key: 'late', header: 'Late (min)', render: (row) => row.lateMinutes || 0 },
            { key: 'early', header: 'Early (min)', render: (row) => row.earlyMinutes || 0 },
            { key: 'worked', header: 'Worked (min)', render: (row) => row.workedMinutes || 0 }
          ]}
        />
      )}

      <div className="flex flex-col gap-3 text-sm text-app-muted print:hidden sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {pagination.page} of {pagination.total_pages || 1} - {pagination.total ?? rows.length} records
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </Button>
          <Button variant="ghost" disabled={page >= (pagination.total_pages || 1) || isFetching} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* ----------------------------- Monthly tab ------------------------------ */

function MonthlyReportTab({ year, month }) {
  const { data, isLoading, isError, error } = useGetMonthlyReportQuery({ year, month })
  const rows = data?.items || []

  return (
    <Card className="space-y-4">
      <ReportPrintHeader title="Monthly Attendance Summary" subtitle={`${monthLabel(month)} ${year}`} />
      <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-app-muted">
          Weekend days: <strong className="text-app-text">{data?.weekendDays ?? '-'}</strong> · Holiday days:{' '}
          <strong className="text-app-text">{data?.holidayDays ?? '-'}</strong>
        </p>
        <Button variant="ghost" icon={FiPrinter} onClick={() => window.print()}>
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

function LateReportTab({ year, month }) {
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, isLoading, isFetching, isError, error } = useGetLateReportQuery({ year, month, page, limit })
  const rows = data?.items || []
  const pagination = data?.pagination || { page: 1, total_pages: 1, total: rows.length }

  useEffect(() => setPage(1), [year, month])

  return (
    <Card className="space-y-4">
      <ReportPrintHeader title="Late Arrivals Report" subtitle={`${monthLabel(month)} ${year}`} />
      <div className="flex justify-end print:hidden">
        <Button variant="ghost" icon={FiPrinter} onClick={() => window.print()}>
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
          <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </Button>
          <Button variant="ghost" disabled={page >= (pagination.total_pages || 1) || isFetching} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------- Leave tab -------------------------------- */

function LeaveReportTab({ year, month }) {
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, isLoading, isFetching, isError, error } = useGetLeaveReportQuery({ year, month, page, limit })
  const rows = data?.items || []
  const pagination = data?.pagination || { page: 1, total_pages: 1, total: rows.length }

  useEffect(() => setPage(1), [year, month])

  return (
    <Card className="space-y-4">
      <ReportPrintHeader title="Leave Report" subtitle={`${monthLabel(month)} ${year}`} />
      <div className="flex justify-end print:hidden">
        <Button variant="ghost" icon={FiPrinter} onClick={() => window.print()}>
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
          <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </Button>
          <Button variant="ghost" disabled={page >= (pagination.total_pages || 1) || isFetching} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* --------------------------- Employee Report tab --------------------------- */
// Yahi tumhara main ask hai: employee search karo (naam / employee ID), aur
// uska poora month ka report (summary + late + leave + kisi ek din ka detail)
// ek jagah dikhe, print bhi ho sake aur Excel me bhi download ho.

function EmployeeReportTab({ year, month }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [date, setDate] = useState('')
  const [excelExporting, setExcelExporting] = useState(false)
  const [excelError, setExcelError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: employeeResults, isFetching: employeesFetching } = useGetEmployeesQuery(
    { search: debouncedSearch, limit: 8 },
    { skip: !debouncedSearch }
  )

  const { data: monthlyData, isLoading: monthlyLoading } = useGetMonthlyReportQuery({ year, month }, { skip: !selectedEmployee })
  // Late/Leave APIs abhi employee-wise filter support nahi karte (sirf year/month/page/limit),
  // isliye ek bada page fetch karke client-side is employee ke rows filter kiye ja rahe hain.
  const { data: lateData, isLoading: lateLoading } = useGetLateReportQuery({ year, month, page: 1, limit: 200 }, { skip: !selectedEmployee })
  const { data: leaveData, isLoading: leaveLoading } = useGetLeaveReportQuery({ year, month, page: 1, limit: 200 }, { skip: !selectedEmployee })
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
  }

  async function handleEmployeeExcel() {
    if (!selectedEmployee) return
    setExcelExporting(true)
    setExcelError('')
    try {
      await downloadEmployeeExcelReport({
        employee: selectedEmployee,
        year,
        month,
        summary,
        lateRows,
        leaveRows,
        dailyRows: dailyRow ? [dailyRow] : []
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
                      setSelectedEmployee(employee)
                      setSearch(`${employee.name} (${employee.code})`)
                      setDropdownOpen(false)
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
        <Card>
          <p className="text-center text-sm text-app-muted">
            Upar employee search karo (naam ya employee ID) uska poora {monthLabel(month)} {year} ka report dekhne ke liye.
          </p>
        </Card>
      )}

      {selectedEmployee && (
        <Card className="space-y-6">
          <ReportPrintHeader
            title="Employee Attendance Report"
            subtitle={`${selectedEmployee.name} (${selectedEmployee.code}) · ${monthLabel(month)} ${year}`}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={selectedEmployee.name} />
              <div>
                <p className="text-lg font-black text-app-text">{selectedEmployee.name}</p>
                <p className="text-sm text-app-muted">
                  {selectedEmployee.code} · {selectedEmployee.department} · {selectedEmployee.role}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="ghost" icon={FiPrinter} onClick={() => window.print()}>
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
                <p className="text-sm text-app-muted">Is mahine ke monthly summary me is employee ka data nahi mila.</p>
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
                    <p className="text-sm text-app-muted">Is date ke liye record nahi mila.</p>
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