import { FiCalendar, FiClock, FiCpu, FiUsers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import Table from '../../components/ui/Table.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getAttendance } from '../../services/attendanceService.js'
import { getEmployees } from '../../services/employeeService.js'
import { getLeaveRequests } from '../../services/leaveService.js'
import { useGetDeviceChangeRequestsQuery } from '../../store/api/devicesApi.js'
import { useGetEmployeeQuery } from '../../store/api/employeesApi.js'

function DevicePendingItem({ request }) {
  const { data: employee } = useGetEmployeeQuery(request.employeeId, { skip: !request.employeeId })
  return (
    <div className="rounded-lg bg-app-bg p-3">
      <div className="flex items-center gap-3">
        <Avatar name={employee?.name || String(request.employeeId)} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-bold">{employee?.name || `Employee #${request.employeeId}`}</p>
          <p className="truncate text-sm text-app-muted">{request.newDeviceModel || request.newDeviceId}</p>
        </div>
      </div>
      <Link to="/devices"><Button variant="success" className="mt-3 w-full">Review</Button></Link>
    </div>
  )
}

export default function Dashboard() {
  const { data: employees, loading: employeesLoading } = useFetch(getEmployees)
  const { data: attendance, loading: attendanceLoading } = useFetch(getAttendance)
  const { data: devicePage } = useGetDeviceChangeRequestsQuery({ status: 'PENDING', limit: 5 })
  const { data: leaves } = useFetch(getLeaveRequests)
  if (employeesLoading || attendanceLoading) return <Loader />

  const today = '2026-09-22'
  const pendingDevices = devicePage?.items || []
  const pendingDeviceCount = devicePage?.pagination?.total ?? pendingDevices.length
  const pendingLeaves = leaves?.filter((leave) => leave.status === 'Pending') || []
  const onLeaveToday =
    leaves?.filter((leave) => leave.status === 'Approved' && leave.from <= today && leave.to >= today).length || 0
  const stats = [
    { label: 'Total Employees', value: employees.filter((item) => item.status === 'Active').length, icon: FiUsers, tone: 'primary', to: '/employees' },
    { label: 'Present Today', value: attendance.filter((item) => item.status === 'Present').length, icon: FiCalendar, tone: 'success', to: '/attendance' },
    { label: 'Late Today', value: attendance.filter((item) => item.status === 'Late').length, icon: FiClock, tone: 'warning', to: '/attendance' },
    { label: 'On Leave', value: onLeaveToday, icon: FiCalendar, tone: 'secondary', to: '/leave/requests' },
    { label: 'Device Requests', value: pendingDeviceCount, icon: FiCpu, tone: 'danger', to: '/devices' },
    { label: 'Leave Requests', value: pendingLeaves.length, icon: FiCalendar, tone: 'info', to: '/leave/requests' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-app-text">Dashboard</h1>
        <p className="text-sm text-app-muted">Admin / Overview - read-only summary with pending actions.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="rounded-lg transition hover:-translate-y-0.5 hover:shadow-soft">
            <StatCard {...stat} />
          </Link>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Today&apos;s Attendance</h2>
          <Table
            rows={attendance}
            columns={[
              { key: 'employee', header: 'Employee' },
              { key: 'location', header: 'Location' },
              { key: 'checkIn', header: 'Check In' },
              { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> }
            ]}
          />
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-bold">Device Approvals</h2>
            <div className="space-y-3">
              {pendingDevices.map((item) => (
                <DevicePendingItem key={item.id} request={item} />
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-bold">Leave Queue</h2>
            <div className="space-y-3">
              {pendingLeaves.map((item) => (
                <div key={item.id} className="rounded-lg bg-app-bg p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={item.employee} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{item.employee}</p>
                      <p className="truncate text-sm text-app-muted">{item.type} - {item.days} day(s)</p>
                    </div>
                  </div>
                  <Link to="/leave/requests"><Button variant="primary" className="mt-3 w-full">Open</Button></Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}