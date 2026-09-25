import { useParams } from 'react-router-dom'
import { FiClock, FiSmartphone } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import { useEmployee } from '../../hooks/useEmployees.js'
import { useGetEmployeeDevicesQuery } from '../../store/api/devicesApi.js'

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function DeviceHistoryItem({ device }) {
  const title = device.deviceModel || device.deviceName || device.deviceId || 'Unknown device'

  return (
    <div className="grid gap-3 rounded-lg border border-primary/10 bg-app-bg p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <FiSmartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-app-text">{title}</p>
          <p className="mt-1 text-xs font-semibold text-app-muted">
            {device.deviceId || '-'} {device.platform ? `- ${device.platform}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-app-muted">
            <span className="inline-flex items-center gap-1">
              <FiClock className="h-3.5 w-3.5" />
              Registered: {formatDateTime(device.registeredAt)}
            </span>
            <span>Last login: {formatDateTime(device.lastLoginAt)}</span>
          </div>
        </div>
      </div>
      <Badge status={device.status} />
    </div>
  )
}

export default function EmployeeDetail() {
  const { id = 'EMP-001' } = useParams()
  const { data: employee } = useEmployee(id)
  const {
    data: devices = [],
    isLoading: devicesLoading,
    isFetching: devicesFetching,
    isError: devicesError,
    error: devicesApiError
  } = useGetEmployeeDevicesQuery(id, { skip: !id })
  const devicesErrorMessage = devicesApiError?.data?.message || devicesApiError?.error || 'Device history load nahi ho payi.'

  if (!employee) return null
  const tabs = ['Profile', 'Office Assignment', 'WFH Location', 'Leave Balance', 'Device History']
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={employee.name} />
          <div>
            <h1 className="text-xl font-black sm:text-2xl">{employee.name}</h1>
            <p className="text-app-muted">{employee.role} - {employee.department}</p>
          </div>
          <Badge status={employee.status} />
        </div>
      </Card>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto">
        {tabs.map((tab) => <button key={tab} className="shrink-0 whitespace-nowrap rounded-lg bg-app-surface px-4 py-2 text-sm font-bold text-app-text shadow-soft">{tab}</button>)}
      </div>
      <Card>
        <h2 className="mb-4 text-lg font-bold">Leave Balance</h2>
        <div className="space-y-4">
          {Object.entries(employee.leaveBalance).map(([key, value]) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm font-semibold capitalize"><span>{key}</span><span>{value}/18</span></div>
              <ProgressBar value={value} max={18} tone={key === 'sick' ? 'info' : 'teal'} />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Device History</h2>
            <p className="text-sm text-app-muted">{devices.length} device(s) linked with this employee.</p>
          </div>
          {devicesFetching && !devicesLoading && <span className="text-xs font-bold text-app-muted">Refreshing...</span>}
        </div>

        {devicesError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{devicesErrorMessage}</p>}

        {devicesLoading ? (
          <Loader />
        ) : devices.length ? (
          <div className="space-y-3">
            {devices.map((device) => (
              <DeviceHistoryItem key={device.id || device.deviceId} device={device} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-primary/20 bg-app-bg p-6 text-center">
            <p className="text-sm font-bold text-app-text">No device history found</p>
            <p className="mt-1 text-sm text-app-muted">Employee ke liye abhi koi registered device nahi hai.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
