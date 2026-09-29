import { Link } from 'react-router-dom'
import Avatar from '../../../components/ui/Avatar.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Card from '../../../components/ui/Card.jsx'
import Loader from '../../../components/ui/Loader.jsx'
import Table from '../../../components/ui/Table.jsx'
import { useGetDailyReportQuery } from '../../../store/api/reportsApi.js'

const LOG_SIZE = 6

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 5) : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// "HALF_DAY" -> "Half Day" (matches the labels Badge already knows).
function toLabel(status) {
  if (!status) return '-'
  return status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase())
}

export default function TodayAttendanceLog({ date, refreshMs }) {
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
          <h2 className="text-lg font-bold">Attendance Log</h2>
          <p className="text-xs text-app-muted">
            {total > rows.length ? `Showing ${rows.length} of ${total} records today.` : 'Today\'s attendance records.'}
          </p>
        </div>
        <Link to="/attendance" className="text-sm font-bold text-primary hover:underline">
          View all
        </Link>
      </div>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">Could not load today's attendance log.</p>
      ) : (
        <Table
          rows={rows}
          columns={[
            {
              key: 'employee',
              header: 'Employee',
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
            { key: 'checkIn', header: 'Check In', render: (row) => formatTime(row.checkIn) },
            { key: 'checkOut', header: 'Check Out', render: (row) => formatTime(row.checkOut) },
            { key: 'status', header: 'Status', render: (row) => <Badge status={toLabel(row.status)} /> }
          ]}
        />
      )}
    </Card>
  )
}