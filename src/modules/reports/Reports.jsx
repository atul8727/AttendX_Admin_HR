import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  FiArrowLeft, FiCalendar, FiCheckCircle, FiClock, FiDownload, FiEye, FiLogOut, FiPieChart,
  FiPrinter, FiSearch, FiSun, FiSunrise, FiUser, FiUsers, FiX
} from 'react-icons/fi'
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
import ReportTab from './components/ReportTab.jsx'
import { useGetEmployeeQuery, useGetEmployeesQuery } from '../../store/api/employeesApi.js'
import {
  useGetDailyReportQuery,
  useGetEarlyReportQuery,
  useGetLateReportQuery,
  useGetLeaveReportQuery,
  useGetMonthlyReportQuery
} from '../../store/api/reportsApi.js'
import { downloadCompanyExcelReport, downloadWorkbook } from '../../services/reportExportService.js'
import { printReport } from '../../lib/printReport.js'
import { toLocalDateString } from '../../lib/date.js'
import { useFormatters } from '../../lib/format.js'
import { daysInMonth, formatClock, formatDurationMin, formatMinutes, formatShortTime, padMonth, periodKey, statusLabel } from '../../lib/reportFormat.js'

const NOW = new Date()
const CURRENT_YEAR = NOW.getFullYear()
const YEARS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - 4 + index)

const TABS = [
  { key: 'daily', icon: FiCalendar },
  { key: 'monthly', icon: FiPieChart },
  { key: 'late', icon: FiClock },
  { key: 'early', icon: FiSunrise },
  { key: 'leave', icon: FiSun },
  { key: 'employee', icon: FiUser }
]

const DEFAULT_TAB = 'daily'

/* ------------------------------ small UI bits ------------------------------ */

function EmployeeCell({ name, code }) {
  return (
    <div className="min-w-[150px] whitespace-nowrap py-0.5">
      <p className="font-bold text-app-text whitespace-nowrap text-sm leading-snug">{name}</p>
      {code && <p className="text-xs font-semibold text-app-muted whitespace-nowrap tracking-wide">{code}</p>}
    </div>
  )
}

const PILL_STYLES = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/10 text-danger'
}

function Pill({ tone = 'success', children }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${PILL_STYLES[tone]}`}>{children}</span>
}

function MinutesPill({ minutes, tone }) {
  return minutes > 0 ? <Pill tone={tone}>{formatMinutes(minutes)}</Pill> : <span className="text-app-muted">-</span>
}

function Metric({ count, minutes }) {
  const { t } = useTranslation('reports')
  if (!count) return <span className="text-app-muted font-medium">-</span>
  return (
    <div className="leading-snug whitespace-nowrap">
      <p className="whitespace-nowrap">
        <span className="font-extrabold text-app-text">{count}</span>{' '}
        <span className="text-xs font-medium text-app-muted">{t('monthly.units.times', { count })}</span>
      </p>
      {minutes > 0 && <p className="whitespace-nowrap text-xs font-semibold text-app-muted">{formatDurationMin(minutes)}</p>}
    </div>
  )
}

function ratePercent(row) {
  const base = row.presentDays + row.absentDays
  return base ? Math.round((row.presentDays / base) * 100) : null
}

/* -------------------------------- Main page -------------------------------- */

export default function Reports() {
  const { t } = useTranslation('reports')
  const formatters = useFormatters()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || DEFAULT_TAB)
  const [month, setMonth] = useState(NOW.getMonth() + 1)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const period = `${formatters.monthName(month - 1)} ${year}`
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: formatters.monthName(index) }))
  const yearOptions = YEARS.map((value) => ({ value, label: String(value) }))

  async function handleCompanyExport() {
    setExporting(true)
    setExportError('')
    try {
      await downloadCompanyExcelReport({ year, month })
    } catch (err) {
      setExportError(err.message || t('errors.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  function changeTab(key) {
    setActiveTab(key)
    setSearchParams((current) => {
      const next = new window.URLSearchParams(current)
      next.set('tab', key)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 print:hidden lg:flex-row lg:items-end">
        <div>
          <h1 className="text-xl font-black sm:text-2xl">{t('title')}</h1>
          <p className="text-sm text-app-muted">{t('subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Select label={t('filters.month')} value={month} onChange={(event) => setMonth(Number(event.target.value))} options={monthOptions} className="w-40" />
          <Select label={t('filters.year')} value={year} onChange={(event) => setYear(Number(event.target.value))} options={yearOptions} className="w-28" />
          {activeTab !== 'employee' && (
            <Button icon={FiDownload} onClick={handleCompanyExport} disabled={exporting} className="whitespace-nowrap">
              {exporting ? t('actions.exporting') : t('actions.companyExcel')}
            </Button>
          )}
        </div>
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
              onClick={() => changeTab(tab.key)}
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
      {activeTab === 'monthly' && <MonthlyReportTab year={year} month={month} period={period} />}
      {activeTab === 'late' && <LateReportTab year={year} month={month} period={period} />}
      {activeTab === 'early' && <EarlyReportTab year={year} month={month} period={period} />}
      {activeTab === 'leave' && <LeaveReportTab year={year} month={month} period={period} />}
      {activeTab === 'employee' && <EmployeeReportTab year={year} month={month} period={period} />}
    </div>
  )
}

/* ------------------------------- Daily tab ------------------------------- */
// Daily API me "jaldi aane" ka data nahi hota, isliye us din ka Early API data match karte hain.

function DailyReportTab() {
  const { t } = useTranslation('reports')
  const [date, setDate] = useState(() => toLocalDateString())
  const [year, month] = (date || '').split('-').map(Number)

  const { data, isLoading, isFetching, error } = useGetDailyReportQuery({ date }, { skip: !date })
  const { data: earlyData } = useGetEarlyReportQuery({ year, month }, { skip: !year || !month })

  const rows = useMemo(() => {
    const earlyByCode = new Map()
    ;(earlyData?.items || []).filter((item) => item.date === date).forEach((item) => earlyByCode.set(item.employeeCode, item.earlyMinutes))
    return (data?.items || []).map((row) => ({
      ...row,
      earlyInMinutes: row.earlyCheckinMinutes || earlyByCode.get(row.employeeCode) || 0
    }))
  }, [data, earlyData, date])

  const columns = [
    { key: 'code', header: t('shared.code'), excelOnly: true, excel: (row) => row.employeeCode },
    {
      key: 'employee',
      header: t('daily.columns.employee'),
      headerClassName: 'min-w-[160px] whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => <EmployeeCell name={row.employeeName} code={row.employeeCode} />,
      excel: (row) => row.employeeName
    },
    { key: 'status', header: t('daily.columns.status'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (row) => <Badge status={statusLabel(row.status)} />, excel: (row) => statusLabel(row.status) },
    {
      key: 'shift',
      header: t('daily.columns.shift'),
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => `${formatShortTime(row.expectedLogin)} – ${formatShortTime(row.expectedLogout)}`,
      excel: (row) => `${formatShortTime(row.expectedLogin)} - ${formatShortTime(row.expectedLogout)}`
    },
    { key: 'checkIn', header: t('daily.columns.checkIn'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap font-medium', render: (row) => formatClock(row.checkIn), excel: (row) => formatClock(row.checkIn) },
    { key: 'checkOut', header: t('daily.columns.checkOut'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap font-medium', render: (row) => formatClock(row.checkOut), excel: (row) => formatClock(row.checkOut) },
    { key: 'late', header: t('daily.columns.late'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (row) => <MinutesPill minutes={row.lateMinutes} tone="warning" />, excel: (row) => row.lateMinutes },
    { key: 'earlyIn', header: t('daily.columns.earlyIn'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (row) => <MinutesPill minutes={row.earlyInMinutes} tone="success" />, excel: (row) => row.earlyInMinutes },
    { key: 'earlyOut', header: t('daily.columns.earlyOut'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (row) => <MinutesPill minutes={row.earlyMinutes} tone="danger" />, excel: (row) => row.earlyMinutes },
    {
      key: 'worked',
      header: t('daily.columns.worked'),
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap font-medium',
      render: (row) => (row.workedMinutes === null ? '-' : formatMinutes(row.workedMinutes)),
      excel: (row) => (row.workedMinutes === null ? '' : formatMinutes(row.workedMinutes))
    }
  ]

  const stats = [
    { label: t('daily.stats.records'), value: rows.length, tone: 'primary', icon: FiUsers },
    { label: t('daily.stats.late'), value: rows.filter((row) => row.lateMinutes > 0).length, tone: 'warning', icon: FiClock },
    { label: t('daily.stats.early'), value: rows.filter((row) => row.earlyInMinutes > 0).length, tone: 'success', icon: FiSunrise },
    { label: t('daily.stats.checkedOut'), value: rows.filter((row) => row.checkOut).length, tone: 'info', icon: FiLogOut }
  ]

  return (
    <ReportTab
      title={t('daily.title')}
      subtitle={date}
      filename={`daily-attendance-${date}`}
      stats={stats}
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      emptyText={t('daily.empty')}
      toolbar={<Input label={t('filters.date')} type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full sm:w-56" />}
    />
  )
}

/* ------------------------------ Monthly tab ------------------------------ */

function MonthlyReportTab({ year, month, period }) {
  const { t } = useTranslation('reports')
  const { data, isLoading, isFetching, error } = useGetMonthlyReportQuery({ year, month })
  const rows = data?.items || []
  const workingDays = Math.max(0, daysInMonth(year, month) - (data?.weekendDays || 0) - (data?.holidayDays || 0))

  const metric = (key, header, countKey, minutesKey) => [
    {
      key,
      header: `${header} (${t('monthly.units.hint')})`,
      screenOnly: true,
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => <Metric count={row[countKey]} minutes={row[minutesKey]} />
    },
    { key: `${key}-count`, header: `${header} - ${t('monthly.units.countHeader')}`, excelOnly: true, excel: (row) => row[countKey] },
    { key: `${key}-min`, header: `${header} - ${t('monthly.units.minHeader')}`, excelOnly: true, excel: (row) => row[minutesKey] }
  ]

  const columns = [
    { key: 'code', header: t('shared.code'), excelOnly: true, excel: (row) => row.employeeCode },
    {
      key: 'employee',
      header: t('monthly.columns.employee'),
      headerClassName: 'min-w-[160px] whitespace-nowrap',
      cellClassName: 'min-w-[160px] whitespace-nowrap',
      render: (row) => <EmployeeCell name={row.employeeName} code={row.employeeCode} />,
      excel: (row) => row.employeeName
    },
    { key: 'present', header: t('monthly.columns.present'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (row) => <span className="font-bold text-success">{row.presentDays}</span>, excel: (row) => row.presentDays },
    { key: 'absent', header: t('monthly.columns.absent'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (row) => <span className={row.absentDays ? 'font-bold text-danger' : 'text-app-muted'}>{row.absentDays || '-'}</span>, excel: (row) => row.absentDays },
    {
      key: 'leave',
      header: t('monthly.columns.leave'),
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => (row.leaveDays ? <span className="font-bold text-secondary">{row.leaveDays}</span> : <span className="text-app-muted">-</span>),
      excel: (row) => row.leaveDays
    },
    { key: 'holiday', header: t('monthly.columns.holiday'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap font-medium', render: (row) => row.holidayDays || '-', excel: (row) => row.holidayDays },
    ...metric('late', t('monthly.columns.late'), 'lateCount', 'totalLateMinutes'),
    ...metric('earlyIn', t('monthly.columns.earlyIn'), 'earlyCount', 'totalEarlyMinutes'),
    ...metric('earlyOut', t('monthly.columns.earlyOut'), 'earlyCheckoutCount', 'totalEarlyCheckoutMinutes'),
    { key: 'worked', header: t('monthly.columns.worked'), headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap font-medium text-app-text', render: (row) => formatMinutes(row.workedMinutes), excel: (row) => formatMinutes(row.workedMinutes) },
    {
      key: 'attendance',
      header: t('monthly.columns.attendance'),
      headerClassName: 'whitespace-nowrap min-w-[140px]',
      cellClassName: 'whitespace-nowrap',
      render: (row) => {
        const percent = ratePercent(row)
        if (percent === null) return <span className="text-app-muted">-</span>
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-20 overflow-hidden rounded-full bg-primary/10 dark:bg-white/10 print:w-10">
              <div className="h-full rounded-full bg-success transition-all duration-300" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs font-bold text-app-text">{percent}%</span>
          </div>
        )
      },
      excel: (row) => {
        const percent = ratePercent(row)
        return percent === null ? '' : `${percent}%`
      }
    }
  ]

  const stats = [
    { label: t('monthly.stats.employees'), value: rows.length, tone: 'primary', icon: FiUsers },
    { label: t('monthly.stats.workingDays'), value: workingDays, tone: 'info', icon: FiCalendar, meta: `${t('monthly.meta.weekend')}: ${data?.weekendDays ?? 0} · ${t('monthly.meta.holiday')}: ${data?.holidayDays ?? 0}` },
    { label: t('monthly.stats.late'), value: rows.reduce((sum, row) => sum + row.lateCount, 0), tone: 'warning', icon: FiClock },
    { label: t('monthly.stats.early'), value: rows.reduce((sum, row) => sum + row.earlyCount, 0), tone: 'success', icon: FiSunrise }
  ]

  return (
    <ReportTab
      title={t('monthly.title')}
      subtitle={period}
      filename={`monthly-attendance-${periodKey(year, month)}`}
      meta={[
        { label: t('monthly.meta.weekend'), value: data?.weekendDays },
        { label: t('monthly.meta.holiday'), value: data?.holidayDays },
        { label: t('monthly.meta.working'), value: workingDays }
      ]}
      stats={stats}
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      emptyText={t('monthly.empty')}
    />
  )
}

/* ------------------------------- Late tab -------------------------------- */

function LateReportTab({ year, month, period }) {
  const { t } = useTranslation('reports')
  const { data, isLoading, isFetching, error } = useGetLateReportQuery({ year, month })
  const rows = data?.items || []
  const totalMinutes = rows.reduce((sum, row) => sum + row.lateMinutes, 0)

  const columns = [
    { key: 'date', header: t('late.columns.date'), render: (row) => row.date, excel: (row) => row.date },
    { key: 'code', header: t('shared.code'), excelOnly: true, excel: (row) => row.employeeCode },
    {
      key: 'employee',
      header: t('late.columns.employee'),
      headerClassName: 'min-w-[160px] whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => <EmployeeCell name={row.employeeName} code={row.employeeCode} />,
      excel: (row) => row.employeeName
    },
    { key: 'expected', header: t('late.columns.expectedIn'), render: (row) => formatShortTime(row.expectedLogin), excel: (row) => formatShortTime(row.expectedLogin) },
    { key: 'actual', header: t('late.columns.actualIn'), render: (row) => formatClock(row.checkIn), excel: (row) => formatClock(row.checkIn) },
    { key: 'late', header: t('late.columns.late'), render: (row) => <Pill tone="warning">{formatMinutes(row.lateMinutes)}</Pill>, excel: (row) => row.lateMinutes }
  ]

  const stats = [
    { label: t('late.stats.total'), value: rows.length, tone: 'warning', icon: FiClock },
    { label: t('late.stats.minutes'), value: formatMinutes(totalMinutes), tone: 'danger', icon: FiClock },
    { label: t('late.stats.average'), value: rows.length ? formatMinutes(totalMinutes / rows.length) : '-', tone: 'info', icon: FiClock },
    { label: t('late.stats.max'), value: rows.length ? formatMinutes(Math.max(...rows.map((row) => row.lateMinutes))) : '-', tone: 'secondary', icon: FiClock }
  ]

  return (
    <ReportTab
      title={t('late.title')}
      subtitle={period}
      filename={`late-report-${periodKey(year, month)}`}
      stats={stats}
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      emptyText={t('late.empty')}
    />
  )
}

/* ------------------------------- Early tab ------------------------------- */

function EarlyReportTab({ year, month, period }) {
  const { t } = useTranslation('reports')
  const { data, isLoading, isFetching, error } = useGetEarlyReportQuery({ year, month })
  const rows = data?.items || []
  const totalMinutes = rows.reduce((sum, row) => sum + row.earlyMinutes, 0)

  const columns = [
    { key: 'date', header: t('early.columns.date'), render: (row) => row.date, excel: (row) => row.date },
    { key: 'code', header: t('shared.code'), excelOnly: true, excel: (row) => row.employeeCode },
    {
      key: 'employee',
      header: t('early.columns.employee'),
      headerClassName: 'min-w-[160px] whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => <EmployeeCell name={row.employeeName} code={row.employeeCode} />,
      excel: (row) => row.employeeName
    },
    { key: 'expected', header: t('early.columns.expectedIn'), render: (row) => formatShortTime(row.expectedLogin), excel: (row) => formatShortTime(row.expectedLogin) },
    { key: 'actual', header: t('early.columns.actualIn'), render: (row) => formatClock(row.checkIn), excel: (row) => formatClock(row.checkIn) },
    { key: 'early', header: t('early.columns.early'), render: (row) => <Pill tone="success">{row.earlyDisplay || formatMinutes(row.earlyMinutes)}</Pill>, excel: (row) => row.earlyMinutes }
  ]

  const stats = [
    { label: t('early.stats.total'), value: rows.length, tone: 'success', icon: FiSunrise },
    { label: t('early.stats.minutes'), value: formatMinutes(totalMinutes), tone: 'teal', icon: FiClock },
    { label: t('early.stats.average'), value: rows.length ? formatMinutes(totalMinutes / rows.length) : '-', tone: 'info', icon: FiClock },
    { label: t('early.stats.best'), value: rows.length ? formatMinutes(Math.max(...rows.map((row) => row.earlyMinutes))) : '-', tone: 'secondary', icon: FiSunrise }
  ]

  return (
    <ReportTab
      title={t('early.title')}
      subtitle={period}
      filename={`early-report-${periodKey(year, month)}`}
      stats={stats}
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      emptyText={t('early.empty')}
    />
  )
}

/* ------------------------------- Leave tab -------------------------------- */

function LeaveReportTab({ year, month, period }) {
  const { t } = useTranslation('reports')
  const { data, isLoading, isFetching, error } = useGetLeaveReportQuery({ year, month })
  const rows = data?.items || []

  const columns = [
    { key: 'code', header: t('shared.code'), excelOnly: true, excel: (row) => row.employeeCode },
    {
      key: 'employee',
      header: t('leave.columns.employee'),
      headerClassName: 'min-w-[160px] whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => <EmployeeCell name={row.employeeName} code={row.employeeCode} />,
      excel: (row) => row.employeeName
    },
    { key: 'type', header: t('leave.columns.type'), render: (row) => row.leaveTypeName || '-', excel: (row) => row.leaveTypeName },
    {
      key: 'range',
      header: t('leave.columns.dates'),
      render: (row) => t('leave.datesRange', { start: row.startDate, end: row.endDate }),
      excel: (row) => `${row.startDate} to ${row.endDate}`
    },
    { key: 'days', header: t('leave.columns.days'), render: (row) => row.totalDays, excel: (row) => row.totalDays },
    { key: 'status', header: t('leave.columns.status'), render: (row) => <Badge status={statusLabel(row.status)} />, excel: (row) => statusLabel(row.status) },
    { key: 'reason', header: t('leave.columns.reason'), render: (row) => row.reason || '-', excel: (row) => row.reason }
  ]

  const stats = [
    { label: t('leave.stats.total'), value: rows.length, tone: 'secondary', icon: FiSun },
    { label: t('leave.stats.days'), value: rows.reduce((sum, row) => sum + row.totalDays, 0), tone: 'info', icon: FiCalendar }
  ]

  return (
    <ReportTab
      title={t('leave.title')}
      subtitle={period}
      filename={`leave-report-${periodKey(year, month)}`}
      stats={stats}
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      emptyText={t('leave.empty')}
    />
  )
}

/* --------------------------- Employee Report tab --------------------------- */
// Employee chuno -> uska poora month: summary + late + early + leave (+ kisi ek din ka detail).
// Monthly / Late / Early / Leave APIs employee_id support karte hain, wahi bhej rahe hain.

function EmployeeReportTab({ year, month, period }) {
  const { t } = useTranslation('reports')
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

  const { data: employeeResults, isFetching: employeesFetching } = useGetEmployeesQuery({ page: employeePage, search: debouncedSearch, limit: 20 })
  const { data: linkedEmployee } = useGetEmployeeQuery(employeeId, { skip: !employeeId })

  useEffect(() => {
    if (employeeId && linkedEmployee) setSelectedEmployee(linkedEmployee)
  }, [employeeId, linkedEmployee])

  const reportArgs = { year, month, employeeId: selectedEmployee?.id }
  const skip = !selectedEmployee
  const { data: monthlyData, isLoading: monthlyLoading } = useGetMonthlyReportQuery(reportArgs, { skip })
  const { data: lateData, isLoading: lateLoading } = useGetLateReportQuery(reportArgs, { skip })
  const { data: earlyData, isLoading: earlyLoading } = useGetEarlyReportQuery(reportArgs, { skip })
  const { data: leaveData, isLoading: leaveLoading } = useGetLeaveReportQuery(reportArgs, { skip })
  const { data: dailyData, isFetching: dailyFetching } = useGetDailyReportQuery({ date }, { skip: !selectedEmployee || !date })

  const sameEmployee = (row) => String(row.employeeId ?? '') === String(selectedEmployee?.id) || row.employeeCode === selectedEmployee?.code

  const summary = useMemo(() => {
    if (!selectedEmployee) return null
    return (monthlyData?.items || []).find(sameEmployee) || null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyData, selectedEmployee])

  const lateRows = useMemo(() => (selectedEmployee ? (lateData?.items || []).filter((row) => row.employeeCode === selectedEmployee.code) : []), [lateData, selectedEmployee])
  const earlyRows = useMemo(() => (selectedEmployee ? (earlyData?.items || []).filter((row) => row.employeeCode === selectedEmployee.code) : []), [earlyData, selectedEmployee])
  const leaveRows = useMemo(() => (selectedEmployee ? (leaveData?.items || []).filter((row) => row.employeeCode === selectedEmployee.code) : []), [leaveData, selectedEmployee])

  const dailyRow = useMemo(() => {
    if (!selectedEmployee || !date) return null
    const row = (dailyData?.items || []).find((item) => String(item.employeeId) === String(selectedEmployee.id))
    if (!row) return null
    return { ...row, earlyInMinutes: earlyRows.find((item) => item.date === date)?.earlyMinutes || 0 }
  }, [dailyData, selectedEmployee, date, earlyRows])

  const isBusy = monthlyLoading || lateLoading || earlyLoading || leaveLoading
  const lateTotal = lateRows.reduce((sum, row) => sum + row.lateMinutes, 0)
  const earlyTotal = earlyRows.reduce((sum, row) => sum + row.earlyMinutes, 0)

  function updateEmployeeParam(id) {
    setParams((current) => {
      const next = new window.URLSearchParams(current)
      if (id) next.set('employee', id)
      else next.delete('employee')
      return next
    })
  }

  function clearEmployee() {
    setSelectedEmployee(null)
    setSearch('')
    updateEmployeeParam(null)
  }

  function backToList() {
    setSelectedEmployee(null)
    setDate('')
    setSearch('')
    setDebouncedSearch('')
    setDropdownOpen(false)
    setEmployeePage(1)
    updateEmployeeParam(null)
  }

  function selectEmployee(employee) {
    setSelectedEmployee(employee)
    updateEmployeeParam(employee.id)
    setSearch(`${employee.name} (${employee.code})`)
    setDropdownOpen(false)
  }

  async function handleEmployeeExcel() {
    if (!selectedEmployee) return
    setExcelExporting(true)
    setExcelError('')
    try {
      const title = `${selectedEmployee.name} (${selectedEmployee.code})`
      const empty = t('shared.noData')
      const sheets = [
        {
          name: t('excel.sheets.summary'),
          title,
          subtitle: period,
          headers: [t('excel.metric'), t('excel.value')],
          rows: [
            [t('employee.stats.present'), summary?.presentDays ?? 0],
            [t('employee.stats.absent'), summary?.absentDays ?? 0],
            [t('employee.stats.leave'), summary?.leaveDays ?? 0],
            [t('employee.stats.late'), lateRows.length],
            [`${t('employee.stats.late')} (min)`, lateTotal],
            [t('employee.stats.early'), earlyRows.length],
            [`${t('employee.stats.early')} (min)`, earlyTotal],
            [t('employee.stats.worked'), formatMinutes(summary?.workedMinutes)]
          ]
        }
      ]

      if (date && dailyRow) {
        sheets.push({
          name: t('excel.sheets.daily'),
          title,
          subtitle: date,
          headers: [t('daily.columns.status'), t('daily.columns.checkIn'), t('daily.columns.checkOut'), t('daily.columns.late'), t('daily.columns.earlyIn'), t('daily.columns.earlyOut'), t('daily.columns.worked')],
          rows: [[statusLabel(dailyRow.status), formatClock(dailyRow.checkIn), formatClock(dailyRow.checkOut), dailyRow.lateMinutes, dailyRow.earlyInMinutes, dailyRow.earlyMinutes, dailyRow.workedMinutes === null ? '' : formatMinutes(dailyRow.workedMinutes)]]
        })
      }

      sheets.push(
        {
          name: t('excel.sheets.late'),
          title,
          subtitle: period,
          headers: [t('late.columns.date'), t('late.columns.expectedIn'), t('late.columns.actualIn'), `${t('late.columns.late')} (min)`],
          rows: lateRows.map((row) => [row.date, formatShortTime(row.expectedLogin), formatClock(row.checkIn), row.lateMinutes]),
          emptyText: empty
        },
        {
          name: t('excel.sheets.early'),
          title,
          subtitle: period,
          headers: [t('early.columns.date'), t('early.columns.expectedIn'), t('early.columns.actualIn'), `${t('early.columns.early')} (min)`],
          rows: earlyRows.map((row) => [row.date, formatShortTime(row.expectedLogin), formatClock(row.checkIn), row.earlyMinutes]),
          emptyText: empty
        },
        {
          name: t('excel.sheets.leave'),
          title,
          subtitle: period,
          headers: [t('leave.columns.type'), t('leave.columns.dates'), t('leave.columns.days'), t('leave.columns.status'), t('leave.columns.reason')],
          rows: leaveRows.map((row) => [row.leaveTypeName, `${row.startDate} to ${row.endDate}`, row.totalDays, statusLabel(row.status), row.reason]),
          emptyText: empty
        }
      )

      await downloadWorkbook({ filename: `${selectedEmployee.code}-report-${year}-${padMonth(month)}.xlsx`, sheets })
    } catch (err) {
      setExcelError(err?.message || t('errors.exportFailed'))
    } finally {
      setExcelExporting(false)
    }
  }

  const employeeColumns = [
    {
      key: 'employee',
      header: t('employee.list.employee'),
      render: (employee) => (
        <button type="button" className="flex items-center gap-3 text-left" onClick={() => selectEmployee(employee)}>
          <Avatar name={employee.name} />
          <span className="font-bold text-app-text">{employee.name}</span>
        </button>
      )
    },
    { key: 'code', header: t('employee.list.code'), render: (employee) => employee.code || '-' },
    { key: 'email', header: t('employee.list.email'), render: (employee) => employee.email || '-' },
    { key: 'phone', header: t('employee.list.phone'), render: (employee) => employee.phone || '-' },
    { key: 'status', header: t('employee.list.status'), render: (employee) => <Badge status={employee.status} /> },
    {
      key: 'actions',
      header: t('employee.list.actions'),
      headerClassName: 'text-left',
      cellClassName: 'text-left',
      render: (employee) => <Button variant="outline" icon={FiEye} aria-label={t('actions.view')} onClick={() => selectEmployee(employee)} />
    }
  ]

  return (
    <div className="space-y-4">
      <Card className="print:hidden">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <label className="mb-1.5 block text-sm font-semibold text-app-text">{t('filters.searchEmployee')}</label>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
              <input
                className="min-h-10 w-full rounded-lg border border-primary/15 bg-app-bg pl-9 pr-9 text-app-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={t('filters.searchPlaceholder')}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setSelectedEmployee(null)
                  updateEmployeeParam(null)
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
                {employeesFetching && <p className="p-3 text-sm text-app-muted">{t('employee.searching')}</p>}
                {!employeesFetching && !(employeeResults?.items || []).length && <p className="p-3 text-sm text-app-muted">{t('employee.noEmployee')}</p>}
                {(employeeResults?.items || []).map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-primary/10"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectEmployee(employee)}
                  >
                    <span className="font-semibold text-app-text">{employee.name}</span>
                    <span className="text-xs text-app-muted">{employee.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input label={t('filters.specificDate')} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </Card>

      {!selectedEmployee && (
        <Card className="space-y-4">
          <p className="text-sm text-app-muted">{t('employee.searchHint', { period })}</p>
          {employeesFetching ? <Loader /> : <Table rows={employeeResults?.items || []} columns={employeeColumns} />}
          {(employeeResults?.pagination?.total_pages || 1) > 1 && (
            <div className="flex items-center justify-between border-t border-primary/10 pt-4 text-sm text-app-muted">
              <span>
                {t('common:pagination.summary', {
                  page: employeeResults.pagination.page,
                  totalPages: employeeResults.pagination.total_pages,
                  shown: employeeResults.items.length,
                  total: employeeResults.pagination.total
                })}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={employeePage <= 1 || employeesFetching} onClick={() => setEmployeePage((page) => page - 1)}>
                  {t('common:actions.previous')}
                </Button>
                <Button variant="outline" disabled={employeePage >= employeeResults.pagination.total_pages || employeesFetching} onClick={() => setEmployeePage((page) => page + 1)}>
                  {t('common:actions.next')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {selectedEmployee && (
        <Card className="space-y-6">
          <ReportPrintHeader
            title={t('employee.title')}
            subtitle={`${selectedEmployee.name} (${selectedEmployee.code}) · ${period}`}
            meta={[
              { label: t('print.period'), value: period },
              { label: t('print.department'), value: selectedEmployee.department }
            ]}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" icon={FiArrowLeft} className="print:hidden" onClick={backToList}>
                {t('actions.back')}
              </Button>
              <Avatar name={selectedEmployee.name} />
              <div>
                <p className="text-lg font-black text-app-text">{selectedEmployee.name}</p>
                <p className="text-sm text-app-muted">{[selectedEmployee.code, selectedEmployee.department, selectedEmployee.role].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" icon={FiPrinter} onClick={() => printReport(`${selectedEmployee.name} (${selectedEmployee.code}) ${t('employee.title')} ${period}`)}>
                {t('actions.printSavePdf')}
              </Button>
              <Button icon={FiDownload} onClick={handleEmployeeExcel} disabled={excelExporting || isBusy}>
                {excelExporting ? t('actions.preparing') : t('actions.downloadExcel')}
              </Button>
            </div>
          </div>

          {excelError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger print:hidden">{excelError}</p>}

          {isBusy ? (
            <Loader />
          ) : (
            <>
              <div className="print-avoid-break grid gap-3 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
                <StatCard label={t('employee.stats.present')} value={summary?.presentDays ?? '-'} tone="success" icon={FiCheckCircle} />
                <StatCard label={t('employee.stats.absent')} value={summary?.absentDays ?? '-'} tone="danger" icon={FiX} />
                <StatCard label={t('employee.stats.leave')} value={summary?.leaveDays ?? '-'} tone="secondary" icon={FiSun} />
                <StatCard label={t('employee.stats.late')} value={lateRows.length} tone="warning" icon={FiClock} meta={t('employee.statMeta.minutesTotal', { value: formatMinutes(lateTotal) })} />
                <StatCard label={t('employee.stats.early')} value={earlyRows.length} tone="info" icon={FiSunrise} meta={t('employee.statMeta.minutesTotal', { value: formatMinutes(earlyTotal) })} />
                <StatCard label={t('employee.stats.worked')} value={summary ? formatMinutes(summary.workedMinutes) : '-'} tone="teal" icon={FiCalendar} />
              </div>

              {!summary && <p className="text-sm text-app-muted">{t('employee.noSummary')}</p>}

              {date && (
                <div className="print-avoid-break">
                  <h3 className="mb-2 font-bold text-app-text">{t('employee.attendanceOn', { date })}</h3>
                  {dailyFetching ? (
                    <Loader />
                  ) : dailyRow ? (
                    <Table
                      rows={[dailyRow]}
                      columns={[
                        { key: 'status', header: t('daily.columns.status'), render: (row) => <Badge status={statusLabel(row.status)} /> },
                        { key: 'checkIn', header: t('daily.columns.checkIn'), render: (row) => formatClock(row.checkIn) },
                        { key: 'checkOut', header: t('daily.columns.checkOut'), render: (row) => formatClock(row.checkOut) },
                        { key: 'late', header: t('daily.columns.late'), render: (row) => <MinutesPill minutes={row.lateMinutes} tone="warning" /> },
                        { key: 'earlyIn', header: t('daily.columns.earlyIn'), render: (row) => <MinutesPill minutes={row.earlyInMinutes} tone="success" /> },
                        { key: 'worked', header: t('daily.columns.worked'), render: (row) => (row.workedMinutes === null ? '-' : formatMinutes(row.workedMinutes)) }
                      ]}
                    />
                  ) : (
                    <p className="text-sm text-app-muted">{t('employee.noDateRecord')}</p>
                  )}
                </div>
              )}

              <div>
                <h3 className="mb-2 font-bold text-app-text">{t('employee.sections.late', { count: lateRows.length })}</h3>
                <Table
                  rows={lateRows}
                  columns={[
                    { key: 'date', header: t('late.columns.date'), render: (row) => row.date },
                    { key: 'expected', header: t('late.columns.expectedIn'), render: (row) => formatShortTime(row.expectedLogin) },
                    { key: 'actual', header: t('late.columns.actualIn'), render: (row) => formatClock(row.checkIn) },
                    { key: 'late', header: t('late.columns.late'), render: (row) => <Pill tone="warning">{formatMinutes(row.lateMinutes)}</Pill> }
                  ]}
                />
              </div>

              <div className="print-avoid-break">
                <h3 className="mb-2 font-bold text-app-text">{t('employee.sections.early', { count: earlyRows.length })}</h3>
                <Table
                  rows={earlyRows}
                  columns={[
                    { key: 'date', header: t('early.columns.date'), render: (row) => row.date },
                    { key: 'expected', header: t('early.columns.expectedIn'), render: (row) => formatShortTime(row.expectedLogin) },
                    { key: 'actual', header: t('early.columns.actualIn'), render: (row) => formatClock(row.checkIn) },
                    { key: 'early', header: t('early.columns.early'), render: (row) => <Pill tone="success">{row.earlyDisplay || formatMinutes(row.earlyMinutes)}</Pill> }
                  ]}
                />
              </div>

              <div>
                <h3 className="mb-2 font-bold text-app-text">{t('employee.sections.leave', { count: leaveRows.length })}</h3>
                <Table
                  rows={leaveRows}
                  columns={[
                    { key: 'type', header: t('leave.columns.type'), render: (row) => row.leaveTypeName || '-' },
                    { key: 'range', header: t('leave.columns.dates'), render: (row) => t('leave.datesRange', { start: row.startDate, end: row.endDate }) },
                    { key: 'days', header: t('leave.columns.days'), render: (row) => row.totalDays },
                    { key: 'status', header: t('leave.columns.status'), render: (row) => <Badge status={statusLabel(row.status)} /> },
                    { key: 'reason', header: t('leave.columns.reason'), render: (row) => row.reason || '-' }
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