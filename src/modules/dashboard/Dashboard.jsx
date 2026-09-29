import { useMemo } from 'react'
import { FiActivity, FiAlertCircle, FiCalendar, FiChevronRight, FiClock, FiCpu, FiGift, FiRefreshCw, FiUsers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Loader from '../../components/ui/Loader.jsx'
import { ATTENDANCE_STATUS_META, getAttendanceStatusMeta } from '../../constants/dashboard.js'
import { useGetDashboardQuery } from '../../store/api/dashboardApi.js'

const REFRESH_INTERVAL_MS = 60_000

const TONES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info'
}

function parseDate(value) {
  return value ? new Date(`${value}T00:00:00`) : null
}

function formatLongDate(value) {
  const date = parseDate(value)
  if (!date || Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function formatShortDate(value) {
  const date = parseDate(value)
  if (!date || Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function daysUntil(target, from) {
  const a = parseDate(target)
  const b = parseDate(from)
  if (!a || !b) return null
  return Math.round((a - b) / 86_400_000)
}

function countdownLabel(days) {
  if (days === null) return ''
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

function KpiCard({ label, value, hint, icon, tone, to }) {
  const Icon = icon
  return (
    <Link
      to={to}
      className="group flex items-start justify-between gap-3 rounded-lg border border-primary/10 bg-app-surface p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-5"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-app-muted">{label}</p>
        <p className="mt-2 text-3xl font-black leading-none text-app-text">{value}</p>
        <p className="mt-2 truncate text-xs font-semibold text-app-muted">{hint}</p>
      </div>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${TONES[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
    </Link>
  )
}

function AttendanceDonut({ segments, total }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="relative mx-auto h-44 w-44 shrink-0 sm:h-52 sm:w-52">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="Today's attendance breakdown">
        <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="16" className="stroke-primary/10" />
        {total > 0 &&
          segments
            .filter((segment) => segment.count > 0)
            .map((segment) => {
              const length = (segment.count / total) * circumference
              const circle = (
                <circle
                  key={segment.status}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  strokeWidth="16"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  style={{ stroke: `rgb(var(--color-${segment.color}))` }}
                />
              )
              offset += length
              return circle
            })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-4xl font-black leading-none text-app-text">{total}</p>
          <p className="mt-1 text-xs font-semibold text-app-muted">Total today</p>
        </div>
      </div>
    </div>
  )
}

function AttentionRow({ label, count, to, icon }) {
  const Icon = icon
  const pending = count > 0
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border border-primary/10 bg-app-bg p-3 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${pending ? TONES.warning : TONES.success}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-app-text">{label}</p>
        <p className="text-xs font-semibold text-app-muted">{pending ? 'Waiting for your review' : 'Nothing pending'}</p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-sm font-black ${pending ? TONES.warning : 'bg-app-muted/15 text-app-muted'}`}>{count}</span>
      <FiChevronRight className="h-4 w-4 shrink-0 text-app-muted transition group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function Dashboard() {
  const { data, isLoading, isFetching, isError, refetch } = useGetDashboardQuery(undefined, {
    pollingInterval: REFRESH_INTERVAL_MS,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: true
  })

  const segments = useMemo(() => {
    const entries = Object.entries(data?.attendanceToday || {})
    const known = Object.keys(ATTENDANCE_STATUS_META).filter((status) => status in (data?.attendanceToday || {}))
    const extra = entries.map(([status]) => status).filter((status) => !(status in ATTENDANCE_STATUS_META))
    return [...known, ...extra].map((status) => ({ status, count: data.attendanceToday[status], ...getAttendanceStatusMeta(status) }))
  }, [data])

  if (isLoading) return <Loader />

  if (isError && !data) {
    return (
      <Card className="grid min-h-64 place-items-center text-center">
        <div className="space-y-3">
          <FiAlertCircle className="mx-auto h-9 w-9 text-danger" />
          <h2 className="text-lg font-bold">Could not load the dashboard</h2>
          <p className="text-sm text-app-muted">Check your connection and try again.</p>
          <Button icon={FiRefreshCw} onClick={refetch}>
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  const attendanceTotal = segments.reduce((sum, segment) => sum + segment.count, 0)
  const holiday = data.nextHoliday
  const holidayDays = holiday ? daysUntil(holiday.date, data.date) : null
  const pendingTotal = data.pendingLeaveRequests + data.pendingDeviceChangeRequests
  const checkedIn = data.attendanceToday.CHECKED_IN ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-black text-app-text sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-app-muted">{formatLongDate(data.date) || "Today's overview"}</p>
        </div>
        <Button variant="outline" icon={FiRefreshCw} onClick={refetch} disabled={isFetching} className="w-full sm:w-auto">
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {isError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">Could not refresh. Showing the last loaded data.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Employees" value={data.totalActiveEmployees} hint="Currently on the team" icon={FiUsers} tone="primary" to="/employees" />
        <KpiCard label="Checked In" value={checkedIn} hint="Working right now" icon={FiActivity} tone="success" to="/attendance" />
        <KpiCard label="Late Today" value={data.lateToday} hint="Arrived after grace time" icon={FiClock} tone="warning" to="/attendance" />
        <KpiCard
          label="Pending Requests"
          value={pendingTotal}
          hint={`${data.pendingLeaveRequests} leave, ${data.pendingDeviceChangeRequests} device`}
          icon={FiCalendar}
          tone={pendingTotal > 0 ? 'danger' : 'info'}
          to={data.pendingLeaveRequests > 0 || data.pendingDeviceChangeRequests === 0 ? '/leave/requests' : '/devices'}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Today's Attendance</h2>
              <p className="text-xs text-app-muted">Breakdown of every attendance status for today.</p>
            </div>
            <Link to="/attendance" className="text-sm font-bold text-primary hover:underline">
              View all
            </Link>
          </div>

          {segments.length > 0 ? (
            <div className="flex flex-col items-center gap-6 lg:flex-row">
              <AttendanceDonut segments={segments} total={attendanceTotal} />
              <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                {segments.map((segment) => {
                  const Icon = segment.icon
                  const percent = attendanceTotal ? Math.round((segment.count / attendanceTotal) * 100) : 0
                  return (
                    <Link
                      key={segment.status}
                      to="/attendance"
                      className="flex items-center gap-3 rounded-lg border border-primary/10 bg-app-bg p-3 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${segment.tone}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black leading-none text-app-text">{segment.count}</span>
                          <span className="text-xs font-semibold text-app-muted">{percent}%</span>
                        </p>
                        <p className="truncate text-xs font-semibold text-app-muted">{segment.label}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyState title="No attendance recorded yet" description="Attendance totals will appear here once the day begins." />
          )}
        </Card>

        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-bold">Needs Your Attention</h2>
            <div className="space-y-3">
              <AttentionRow label="Leave Requests" count={data.pendingLeaveRequests} to="/leave/requests" icon={FiCalendar} />
              <AttentionRow label="Device Change Requests" count={data.pendingDeviceChangeRequests} to="/devices" icon={FiCpu} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-bold">Next Holiday</h2>
            {holiday ? (
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-white">
                  <FiGift className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-app-text">{holiday.name}</p>
                  <p className="text-sm font-semibold text-app-muted">{formatShortDate(holiday.date)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                    {holidayDays !== null && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{countdownLabel(holidayDays)}</span>}
                    <span className={`rounded-full px-2.5 py-1 ${holiday.holidayType === 'HALF_DAY' ? TONES.warning : TONES.info}`}>{holiday.holidayTypeLabel}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-app-muted">No upcoming holiday is scheduled.</p>
            )}
            <Link to="/holidays" className="mt-4 inline-block text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              Manage holidays
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
