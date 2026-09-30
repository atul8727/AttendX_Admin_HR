import { FiArrowLeft, FiClock, FiEdit, FiPower, FiSmartphone } from 'react-icons/fi'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Button from '../../components/ui/Button.jsx'
import { getApiErrorMessage } from '../../lib/apiError.js'
import { useFormatters } from '../../lib/format.js'
import { notify } from '../../lib/notify.js'
import { useEmployee } from '../../hooks/useEmployees.js'
import { useGetEmployeeDevicesQuery } from '../../store/api/devicesApi.js'
import { useGetEmployeeOfficeQuery } from '../../store/api/employeesApi.js'
import { useGetWfhLocationQuery, useUpdateWfhLocationStatusMutation } from '../../store/api/wfhApi.js'
import WfhLocationModal from '../wfh/components/WfhLocationModal.jsx'

// Tab keys stable hain (URL ?tab= isi se match hota hai). Text detail.tabs.<key> se aata hai.
const TABS = ['profile', 'office', 'wfh', 'devices']

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value ?? '-'}</p>
    </div>
  )
}

function DeviceHistoryItem({ device }) {
  const { t } = useTranslation('employees')
  const fmt = useFormatters()
  const formatDateTime = (value) => (value ? fmt.dateTime(value) : '-')
  const title = device.deviceModel || device.deviceName || device.deviceId || t('detail.devices.unknown')

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
              {t('detail.devices.registered', { date: formatDateTime(device.registeredAt) })}
            </span>
            <span>{t('detail.devices.lastLogin', { date: formatDateTime(device.lastLoginAt) })}</span>
          </div>
        </div>
      </div>
      <Badge status={device.status} />
    </div>
  )
}

export default function EmployeeDetail() {
  const { t } = useTranslation('employees')
  const fmt = useFormatters()
  const formatDateTime = (value) => (value ? fmt.dateTime(value) : '-')
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'profile'

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
  const devicesErrorMessage = getApiErrorMessage(devicesApiError, t('detail.devices.loadError'))

  if (employeeLoading) return <Loader />

  if (!employee) {
    return (
      <Card className="space-y-3">
        <p className="text-sm font-semibold text-danger">{employeeError || t('detail.notFound')}</p>
        <Link to="/employees" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          <FiArrowLeft className="h-4 w-4" /> {t('detail.back')}
        </Link>
      </Card>
    )
  }

  const branchName = officeLoading ? '...' : office?.officeName || t('list.notAssigned')

  async function toggleWfhStatus() {
    if (!wfhLocation) return
    const status = wfhLocation.status === 'Active' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateWfhStatus({ employeeId: wfhEmployeeId, status }).unwrap()
      notify.success(status === 'ACTIVE' ? t('detail.wfh.activated') : t('detail.wfh.deactivated'))
    } catch (error) {
      notify.error(getApiErrorMessage(error, t('detail.wfh.statusFailed')))
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/employees" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <FiArrowLeft className="h-4 w-4" /> {t('detail.back')}
      </Link>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={employee.name} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black sm:text-2xl">{employee.name}</h1>
            <p className="text-app-muted">
              {[employee.role, employee.department].filter(Boolean).join(' - ') || '-'}
            </p>
            <p className="mt-1 text-sm font-semibold text-app-muted">{t('detail.branchLine', { name: branchName })}</p>
          </div>
          <Badge status={employee.status} />
        </div>
      </Card>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setSearchParams({ tab }, { replace: true })}
            className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold shadow-soft transition ${
              activeTab === tab ? 'bg-primary text-white' : 'bg-app-surface text-app-text hover:bg-primary/10'
            }`}
          >
            {t(`detail.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">{t('detail.profileTitle')}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label={t('fields.id')} value={employee.id} />
            <DetailItem label={t('fields.code')} value={employee.code} />
            <DetailItem label={t('fields.email')} value={employee.email} />
            <DetailItem label={t('fields.phone')} value={employee.phone} />
            <DetailItem label={t('fields.expectedLoginTime')} value={employee.expectedLogin} />
            <DetailItem label={t('fields.expectedLogoutTime')} value={employee.expectedLogout} />
            {/* Late Grace Minutes is temporarily hidden. */}
            {/* <DetailItem label={t('fields.lateGrace')} value={employee.lateGraceMinutes} /> */}
            <DetailItem label={t('fields.status')} value={<Badge status={employee.status} />} />
            <DetailItem label={t('fields.createdAt')} value={formatDateTime(employee.createdAt)} />
            <DetailItem label={t('fields.updatedAt')} value={formatDateTime(employee.updatedAt)} />
          </div>
        </Card>
      )}

      {activeTab === 'office' && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">{t('detail.office.title')}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label={t('fields.branch')} value={branchName} />
            <DetailItem label={t('detail.office.officeId')} value={office?.officeSettingId || '-'} />
          </div>
          <p className="mt-3 text-sm text-app-muted">{t('detail.office.hint')}</p>
        </Card>
      )}
      {activeTab === 'wfh' && (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{t('detail.wfh.title')}</h2><div className="flex gap-2"><Button variant={wfhLocation ? 'info' : 'primary'} icon={FiEdit} onClick={() => setWfhEditorOpen(true)}>{wfhLocation ? t('actions.edit') : t('detail.wfh.set')}</Button>{wfhLocation && <Button variant="ghost" icon={FiPower} aria-label={t('detail.wfh.toggleAria')} disabled={isUpdatingWfhStatus} onClick={toggleWfhStatus} />}</div></div>
          {wfhLoading ? (
            <Loader />
          ) : wfhError ? (
            <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{t('detail.wfh.loadError')}</p>
          ) : wfhLocation ? (
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label={t('detail.wfh.name')} value={wfhLocation.name || '-'} />
              <DetailItem label={t('detail.wfh.status')} value={wfhLocation.status ? <Badge status={wfhLocation.status} /> : '-'} />
              <DetailItem label={t('detail.wfh.latitude')} value={wfhLocation.latitude ?? '-'} />
              <DetailItem label={t('detail.wfh.longitude')} value={wfhLocation.longitude ?? '-'} />
              <DetailItem label={t('detail.wfh.radius')} value={wfhLocation.radiusMeters == null ? '-' : t('detail.wfh.meters', { value: wfhLocation.radiusMeters })} />
              <DetailItem label={t('detail.wfh.updatedAt')} value={formatDateTime(wfhLocation.updatedAt)} />
            </div>
          ) : (
            <p className="text-sm text-app-muted">{t('detail.wfh.none')}</p>
          )}
        </Card>
      )}
      {wfhEditorOpen && <WfhLocationModal employee={employee} location={wfhLocation} onClose={() => setWfhEditorOpen(false)} />}

      {activeTab === 'devices' && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{t('detail.devices.title')}</h2>
              <p className="text-sm text-app-muted">{t('detail.devices.count', { count: devices.length })}</p>
            </div>
            {devicesFetching && !devicesLoading && <span className="text-xs font-bold text-app-muted">{t('detail.devices.refreshing')}</span>}
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
              <p className="text-sm font-bold text-app-text">{t('detail.devices.emptyTitle')}</p>
              <p className="mt-1 text-sm text-app-muted">{t('detail.devices.emptyBody')}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
