import { FiArrowLeft, FiClock, FiEdit, FiPower, FiSmartphone } from 'react-icons/fi'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Button from '../../components/ui/Button.jsx'
import { getApiErrorMessage } from '../../lib/apiError.js'
import { notify } from '../../lib/notify.js'
import { useEmployee } from '../../hooks/useEmployees.js'
import { useGetEmployeeDevicesQuery } from '../../store/api/devicesApi.js'
import { useGetEmployeeOfficeQuery } from '../../store/api/employeesApi.js'
import { useGetWfhLocationQuery, useUpdateWfhLocationStatusMutation } from '../../store/api/wfhApi.js'
import WfhLocationModal from '../wfh/components/WfhLocationModal.jsx'

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'office', label: 'Office Assignment' },
  { key: 'wfh', label: 'WFH Location' },
  { key: 'devices', label: 'Device History' }
]

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value ?? '-'}</p>
    </div>
  )
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
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = TABS.some((tab) => tab.key === searchParams.get('tab')) ? searchParams.get('tab') : 'profile'

  const { data: employee, loading: employeeLoading, error: employeeError } = useEmployee(id, { skip: !id })
  const { data: office, isFetching: officeLoading } = useGetEmployeeOfficeQuery(id, { skip: !id })
  const wfhEmployeeId = employee?.apiId || id
  const { data: wfhLocation, isFetching: wfhLoading, isError: wfhError } = useGetWfhLocationQuery(wfhEmployeeId, { skip: !wfhEmployeeId })
  const [updateWfhStatus, { isLoading: isUpdatingWfhStatus }] = useUpdateWfhLocationStatusMutation()
  const [wfhEditorOpen, setWfhEditorOpen] = useState(false)
  const {
    data: devices = [],
    isLoading: devicesLoading,
    isFetching: devicesFetching,
    isError: devicesError,
    error: devicesApiError
  } = useGetEmployeeDevicesQuery(id, { skip: !id })
  const devicesErrorMessage = devicesApiError?.data?.message || devicesApiError?.error || 'Could not load the device history.'

  if (employeeLoading) return <Loader />

  if (!employee) {
    return (
      <Card className="space-y-3">
        <p className="text-sm font-semibold text-danger">{employeeError || 'Employee not found.'}</p>
        <Link to="/employees" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          <FiArrowLeft className="h-4 w-4" /> Back to employees
        </Link>
      </Card>
    )
  }

  const branchName = officeLoading ? '...' : office?.officeName || 'Not assigned'

  async function toggleWfhStatus() {
    if (!wfhLocation) return
    const status = wfhLocation.status === 'Active' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateWfhStatus({ employeeId: wfhEmployeeId, status }).unwrap()
      notify.success(`WFH location ${status === 'ACTIVE' ? 'activated' : 'deactivated'}.`)
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'Could not update the WFH location status.'))
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/employees" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <FiArrowLeft className="h-4 w-4" /> Back to employees
      </Link>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={employee.name} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black sm:text-2xl">{employee.name}</h1>
            <p className="text-app-muted">
              {[employee.role, employee.department].filter(Boolean).join(' - ') || '-'}
            </p>
            <p className="mt-1 text-sm font-semibold text-app-muted">Branch: {branchName}</p>
          </div>
          <Badge status={employee.status} />
        </div>
      </Card>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setSearchParams({ tab: tab.key }, { replace: true })}
            className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold shadow-soft transition ${
              activeTab === tab.key ? 'bg-primary text-white' : 'bg-app-surface text-app-text hover:bg-primary/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">Profile</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label="Employee ID" value={employee.id} />
            <DetailItem label="Employee Code" value={employee.code} />
            <DetailItem label="Email" value={employee.email} />
            <DetailItem label="Phone" value={employee.phone} />
            <DetailItem label="Expected Login Time" value={employee.expectedLogin} />
            <DetailItem label="Expected Logout Time" value={employee.expectedLogout} />
            <DetailItem label="Late Grace Minutes" value={employee.lateGraceMinutes} />
            <DetailItem label="Status" value={employee.status} />
            <DetailItem label="Created At" value={formatDateTime(employee.createdAt)} />
            <DetailItem label="Updated At" value={formatDateTime(employee.updatedAt)} />
          </div>
        </Card>
      )}

      {activeTab === 'office' && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">Office Assignment</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label="Branch" value={branchName} />
            <DetailItem label="Office ID" value={office?.officeSettingId || '-'} />
          </div>
          <p className="mt-3 text-sm text-app-muted">To change the branch, edit the employee from the employees list.</p>
        </Card>
      )}
      {activeTab === 'wfh' && (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">WFH Location</h2><div className="flex gap-2"><Button variant={wfhLocation ? 'info' : 'primary'} icon={FiEdit} onClick={() => setWfhEditorOpen(true)}>{wfhLocation ? 'Edit' : 'Set'}</Button>{wfhLocation && <Button variant="ghost" icon={FiPower} aria-label="Toggle WFH location status" disabled={isUpdatingWfhStatus} onClick={toggleWfhStatus} />}</div></div>
          {wfhLoading ? (
            <Loader />
          ) : wfhError ? (
            <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">Could not load the WFH location.</p>
          ) : wfhLocation ? (
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Name" value={wfhLocation.name || '-'} />
              <DetailItem label="Status" value={wfhLocation.status || '-'} />
              <DetailItem label="Latitude" value={wfhLocation.latitude ?? '-'} />
              <DetailItem label="Longitude" value={wfhLocation.longitude ?? '-'} />
              <DetailItem label="Radius" value={wfhLocation.radiusMeters == null ? '-' : `${wfhLocation.radiusMeters} m`} />
              <DetailItem label="Updated At" value={formatDateTime(wfhLocation.updatedAt)} />
            </div>
          ) : (
            <p className="text-sm text-app-muted">No WFH location is assigned.</p>
          )}
        </Card>
      )}
      {wfhEditorOpen && <WfhLocationModal employee={employee} location={wfhLocation} onClose={() => setWfhEditorOpen(false)} />}

      {activeTab === 'devices' && (
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
              <p className="mt-1 text-sm text-app-muted">This employee has no registered devices yet.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
