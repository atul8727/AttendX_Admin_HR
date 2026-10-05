import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FiActivity, FiAlertCircle, FiCalendar, FiChevronRight, FiClock, FiCpu, FiGift, FiRefreshCw, FiUsers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Loader from '../../components/ui/Loader.jsx'
import { ATTENDANCE_STATUS_META, getAttendanceStatusMeta } from '../../constants/dashboard.js'
import { useFormatters } from '../../lib/format.js'
import { useGetDashboardQuery } from '../../store/api/dashboardApi.js'
import TodayAttendanceLog from './components/TodayAttendanceLog.jsx'

const REFRESH_INTERVAL_MS = 60_000

const TONES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info'
}

// Har attendance status ka apna alag route.
// NOTE: keys ko constants/dashboard.js ke ATTENDANCE_STATUS_META se match kar lena.
const STATUS_ROUTES = {
  HOLIDAY: '/holidays',
  HALF_DAY_HOLIDAY: '/holidays',
  CHECKED_IN: '/reports',
  CHECKED_OUT: '/reports',
  NOT_CHECKED_IN: '/reports',
  ABSENT: '/reports',
  ON_LEAVE: '/leave/requests',
  HALF_DAY_LEAVE: '/leave/requests'
}

const getSegmentRoute = (status) => STATUS_ROUTES[status] ?? '/reports'

function parseDate(value) {
  return value ? new Date(`${value}T00:00:00`) : null
}

function daysUntil(target, from) {
  const a = parseDate(target)
  const b = parseDate(from)
  if (!a || !b) return null
  return Math.round((a - b) / 86_400_000)
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
  const { t } = useTranslation('dashboard')
  const radius = 52
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="relative mx-auto h-44 w-44 shrink-0 sm:h-52 sm:w-52">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={t('attendance.chartLabel')}>
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
          <p className="mt-1 text-xs font-semibold text-app-muted">{t('attendance.totalToday')}</p>
        </div>
      </div>
    </div>
  )
}

function AttentionRow({ label, count, to, icon }) {
  const { t } = useTranslation('dashboard')
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
        <p className="text-xs font-semibold text-app-muted">{pending ? t('attention.waiting') : t('attention.nothing')}</p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-sm font-black ${pending ? TONES.warning : 'bg-app-muted/15 text-app-muted'}`}>{count}</span>
      <FiChevronRight className="h-4 w-4 shrink-0 text-app-muted transition group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function Dashboard() {
  const { t } = useTranslation('dashboard')
  const fmt = useFormatters()

  // Date helpers: component ke andar, taaki language badalne par update ho.
  const formatLongDate = (value) => {
    const date = parseDate(value)
    if (!date || Number.isNaN(date.getTime())) return ''
    return fmt.date(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  const formatShortDate = (value) => {
    const date = parseDate(value)
    if (!date || Number.isNaN(date.getTime())) return '-'
    return fmt.date(date, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  }
  const countdownLabel = (days) => {
    if (days === null) return ''
    if (days <= 0) return t('countdown.today')
    if (days === 1) return t('countdown.tomorrow')
    return t('countdown.inDays', { count: days })
  }

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
          <h2 className="text-lg font-bold">{t('loadError.title')}</h2>
          <p className="text-sm text-app-muted">{t('loadError.body')}</p>
          <Button icon={FiRefreshCw} onClick={refetch}>
            {t('tryAgain')}
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
          <h1 className="text-xl font-black text-app-text sm:text-2xl">{t('title')}</h1>
          <p className="text-sm text-app-muted">{formatLongDate(data.date) || t('todayOverview')}</p>
        </div>
        <Button variant="outline" icon={FiRefreshCw} onClick={refetch} disabled={isFetching} className="w-full sm:w-auto">
          {isFetching ? t('refreshing') : t('refresh')}
        </Button>
      </div>

      {isError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{t('loadError.refreshFailed')}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('kpi.activeEmployees')} value={data.totalActiveEmployees} hint={t('kpi.activeEmployeesHint')} icon={FiUsers} tone="primary" to="/employees" />
        <KpiCard label={t('kpi.checkedIn')} value={checkedIn} hint={t('kpi.checkedInHint')} icon={FiActivity} tone="success" to="/reports" />
        <KpiCard label={t('kpi.lateToday')} value={data.lateToday} hint={t('kpi.lateTodayHint')} icon={FiClock} tone="warning" to="/reports" />
        <KpiCard
          label={t('kpi.pendingRequests')}
          value={pendingTotal}
          hint={t('kpi.pendingHint', { leave: data.pendingLeaveRequests, device: data.pendingDeviceChangeRequests })}
          icon={FiCalendar}
          tone={pendingTotal > 0 ? 'danger' : 'info'}
          to={data.pendingLeaveRequests > 0 || data.pendingDeviceChangeRequests === 0 ? '/leave/requests' : '/devices'}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{t('attendance.title')}</h2>
              <p className="text-xs text-app-muted">{t('attendance.subtitle')}</p>
            </div>
            <Link to="/reports" className="text-sm font-bold text-primary hover:underline">
              {t('attendance.viewAll')}
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
                      to={getSegmentRoute(segment.status)}
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
                        <p className="truncate text-xs font-semibold text-app-muted">{segment.labelKey ? t(segment.labelKey) : segment.label}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyState title={t('attendance.emptyTitle')} description={t('attendance.emptyDescription')} />
          )}
        </Card>

        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-bold">{t('attention.title')}</h2>
            <div className="space-y-3">
              <AttentionRow label={t('attention.leaveRequests')} count={data.pendingLeaveRequests} to="/leave/requests" icon={FiCalendar} />
              <AttentionRow label={t('attention.deviceRequests')} count={data.pendingDeviceChangeRequests} to="/devices" icon={FiCpu} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-bold">{t('holiday.title')}</h2>
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
                    <span className={`rounded-full px-2.5 py-1 ${holiday.holidayType === 'HALF_DAY' ? TONES.warning : TONES.info}`}>{holiday.holidayType === 'HALF_DAY' ? t('status:halfDay') : t('status:fullDay')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-app-muted">{t('holiday.none')}</p>
            )}
            <Link to="/holidays" className="mt-4 inline-block text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              {t('holiday.manage')}
            </Link>
          </Card>
        </div>
      </div>

      <TodayAttendanceLog date={data.date} refreshMs={REFRESH_INTERVAL_MS} />
    </div>
  )
}