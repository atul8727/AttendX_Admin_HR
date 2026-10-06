import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Avatar from '../../../components/ui/Avatar.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Card from '../../../components/ui/Card.jsx'
import Loader from '../../../components/ui/Loader.jsx'
import Table from '../../../components/ui/Table.jsx'
import { useFormatters } from '../../../lib/format.js'
import { useGetDailyReportQuery } from '../../../store/api/reportsApi.js'

const LOG_SIZE = 6

// "HALF_DAY" -> "Half Day" (matches the labels Badge already knows).
function toLabel(status) {
  if (!status) return '-'
  return status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase())
}

export default function TodayAttendanceLog({ date, refreshMs }) {
  const { t } = useTranslation('dashboard')
  const fmt = useFormatters()
  const formatTime = (value) => {
    if (!value) return '-'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 5) : fmt.time(parsed)
  }
  const { data, isLoading, isError } = useGetDailyReportQuery(
    { date, page: 1, limit: LOG_SIZE },
    { skip: !date, pollingInterval: refreshMs, skipPollingIfUnfocused: true }
  )
  const rows = data?.items || []
  const total = data?.pagination?.total ?? rows.length

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{t('log.title')}</h2>
          <p className="text-xs text-app-muted">
            {total > rows.length ? t('log.showing', { shown: rows.length, total }) : t('log.todayRecords')}
          </p>
        </div>
        <Link to="/reports" className="text-sm font-bold text-primary hover:underline">
          {t('attendance.viewAll')}
        </Link>
      </div>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{t('log.loadError')}</p>
      ) : (
        <Table
          rows={rows}
          columns={[
            {
              key: 'employee',
              header: t('log.columns.employee'),
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar name={row.employeeName || row.employeeCode || '?'} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{row.employeeName || '-'}</p>
                    <p className="text-xs text-app-muted">{row.employeeCode || '-'}</p>
                  </div>
                </div>
              )
            },
            { key: 'checkIn', header: t('log.columns.checkIn'), render: (row) => formatTime(row.checkIn) },
            { key: 'checkOut', header: t('log.columns.checkOut'), render: (row) => formatTime(row.checkOut) },
            { key: 'status', header: t('log.columns.status'), render: (row) => <Badge status={toLabel(row.status)} /> }
          ]}
        />
      )}
    </Card>
  )
}