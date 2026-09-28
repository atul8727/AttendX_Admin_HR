import { FiCalendar, FiClock, FiCpu, FiUsers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import Table from '../../components/ui/Table.jsx'
import { toLocalDateString } from '../../lib/date.js'
import { useGetDeviceChangeRequestsQuery } from '../../store/api/devicesApi.js'
import { useGetEmployeeQuery, useGetEmployeesQuery } from '../../store/api/employeesApi.js'
import { useGetLeaveRequestsQuery } from '../../store/api/leaveApi.js'
import { useGetDailyReportQuery } from '../../store/api/reportsApi.js'

function EmployeeName({ employeeId }) {
  const { data: employee } = useGetEmployeeQuery(employeeId, { skip: !employeeId })
  const name = employee?.name || `Employee #${employeeId}`
  return <>{name}</>
}

function PendingDevice({ request }) {
  return (
    <div className="rounded-lg bg-app-bg p-3">
      <div className="flex items-center gap-3">
        <Avatar name={String(request.employeeId)} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-bold"><EmployeeName employeeId={request.employeeId} /></p>
          <p className="truncate text-sm text-app-muted">{request.newDeviceModel || request.newDeviceId || '-'}</p>
        </div>
      </div>
      <Link to="/devices"><Button variant="success" className="mt-3 w-full">Review</Button></Link>
    </div>
  )
}

export default function Dashboard() {
  const today = toLocalDateString()
  const employeesQuery = useGetEmployeesQuery({ page: 1, limit: 20 })
  const attendanceQuery = useGetDailyReportQuery({ date: today, page: 1, limit: 20 })
  const devicesQuery = useGetDeviceChangeRequestsQuery({ status: 'PENDING', limit: 5 })
  const leavesQuery = useGetLeaveRequestsQuery({ status: 'PENDING', limit: 5 })

  if (employeesQuery.isLoading || attendanceQuery.isLoading) return <Loader />

  const attendance = attendanceQuery.data?.items || []
  const pendingDevices = devicesQuery.data?.items || []
  const pendingLeaves = leavesQuery.data?.items || []
  const pendingDeviceCount = devicesQuery.data?.pagination?.total ?? pendingDevices.length
  const pendingLeaveCount = leavesQuery.data?.pagination?.total ?? pendingLeaves.length
  const stats = [
    { label: 'Total Employees', value: employeesQuery.data?.pagination?.total ?? 0, icon: FiUsers, tone: 'primary', to: '/employees' },
    { label: 'Present Today', value: attendance.filter((row) => row.status === 'PRESENT').length, icon: FiCalendar, tone: 'success', to: '/attendance' },
    { label: 'Late Today', value: attendance.filter((row) => row.status === 'LATE').length, icon: FiClock, tone: 'warning', to: '/attendance' },
    { label: 'Device Requests', value: pendingDeviceCount, icon: FiCpu, tone: 'danger', to: '/devices' },
    { label: 'Leave Requests', value: pendingLeaveCount, icon: FiCalendar, tone: 'info', to: '/leave/requests' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-app-text sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-app-muted">Admin / Overview - read-only summary with pending actions.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => <Link key={stat.label} to={stat.to} className="rounded-lg transition hover:-translate-y-0.5 hover:shadow-soft"><StatCard {...stat} /></Link>)}
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Today's Attendance</h2>
          {attendanceQuery.isError ? <p className="text-sm font-semibold text-danger">Could not load today's attendance.</p> : <Table rows={attendance} columns={[
            { key: 'employee', header: 'Employee', render: (row) => row.employeeName || row.employeeCode || '-' },
            { key: 'checkIn', header: 'Check In', render: (row) => row.checkIn || '-' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status || '-'} /> }
          ]} />}
        </Card>
        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-bold">Device Approvals</h2>
            <div className="space-y-3">{pendingDevices.map((item) => <PendingDevice key={item.id} request={item} />)}</div>
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-bold">Leave Queue</h2>
            <div className="space-y-3">{pendingLeaves.map((item) => <div key={item.id} className="rounded-lg bg-app-bg p-3"><p className="font-bold"><EmployeeName employeeId={item.employeeId} /></p><p className="text-sm text-app-muted">{item.totalDays} day(s)</p><Link to="/leave/requests"><Button variant="primary" className="mt-3 w-full">Open</Button></Link></div>)}</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
