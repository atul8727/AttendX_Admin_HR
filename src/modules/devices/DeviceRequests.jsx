import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCheck, FiClock, FiEye, FiSmartphone, FiX } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'
import { getApiErrorMessage } from '../../lib/apiError.js'
import { useFormatters } from '../../lib/format.js'
import { useGetEmployeeQuery, useGetEmployeesQuery } from '../../store/api/employeesApi.js'
import {
  useApproveDeviceChangeRequestMutation,
  useGetDeviceChangeRequestsQuery,
  useGetEmployeeDevicesQuery,
  useRejectDeviceChangeRequestMutation
} from '../../store/api/devicesApi.js'

// Tab values stable hain (API status = tab.toUpperCase()). Label devices:tabs.<lowercase> se aata hai.
const TABS = ['Pending', 'Approved', 'Rejected', 'History']

// Date/time ko current language me format karta hai. Khaali ya kharab date par '-' (Intl kharab date par crash karta hai).
function useDateTime() {
  const fmt = useFormatters()
  return (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : fmt.dateTime(date)
  }
}

function EmployeeCell({ employeeId }) {
  const { t } = useTranslation('devices')
  const { data: employee, isFetching } = useGetEmployeeQuery(employeeId, { skip: !employeeId })
  return (
    <div className="flex items-center gap-3">
      <Avatar name={employee?.name || String(employeeId)} />
      <div>
        <p className="font-bold">{isFetching && !employee ? t('common:actions.loading') : employee?.name || t('employeeFallback', { id: employeeId })}</p>
        <p className="text-xs text-app-muted">{employee?.code || t('idLabel', { id: employeeId })}</p>
      </div>
    </div>
  )
}

function DeviceCompareCell({ employeeId, oldEmployeeDeviceId, newDeviceId, newDeviceModel, newPlatform }) {
  const { t } = useTranslation('devices')
  const { data: devices } = useGetEmployeeDevicesQuery(employeeId, { skip: !employeeId })
  const oldDevice = devices?.find((device) => device.id === oldEmployeeDeviceId)

  return (
    <div className="grid min-w-[20rem] grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
        <p className="text-xs font-bold uppercase text-app-muted">{t('compare.current')}</p>
        <p className="font-bold">{oldDevice?.deviceModel || oldDevice?.deviceId || '-'}</p>
        <p className="text-xs text-app-muted">{oldDevice?.platform || ''}</p>
      </div>
      <span className="text-lg font-black text-primary">{t('compare.to')}</span>
      <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
        <p className="text-xs font-bold uppercase text-app-muted">{t('compare.requested')}</p>
        <p className="font-bold">{newDeviceModel || newDeviceId || '-'}</p>
        <p className="text-xs text-app-muted">{newPlatform || ''}</p>
      </div>
    </div>
  )
}

function sortDevicesByActivity(devices = []) {
  return [...devices].sort((a, b) => {
    const left = new Date(a.lastLoginAt || a.registeredAt || 0).getTime()
    const right = new Date(b.lastLoginAt || b.registeredAt || 0).getTime()
    return right - left
  })
}

function DeviceHistorySummaryCell({ employeeId }) {
  const { t } = useTranslation('devices')
  const { data: devices = [], isFetching } = useGetEmployeeDevicesQuery(employeeId, { skip: !employeeId })
  const activeCount = devices.filter((device) => device.status === 'Active').length
  const latestDevice = sortDevicesByActivity(devices)[0]

  if (isFetching && !devices.length) return <p className="text-sm font-semibold text-app-muted">{t('summaryCell.loading')}</p>

  return (
    <div className="min-w-0 space-y-1">
      <p className="font-bold text-app-text">{t('summaryCell.devices', { count: devices.length })}</p>
      <p className="text-xs font-semibold text-app-muted">{t('summaryCell.active', { count: activeCount })}</p>
      {latestDevice && (
        <p className="max-w-[14rem] truncate text-xs text-app-muted">
          {t('summaryCell.latest', { name: latestDevice.deviceModel || latestDevice.deviceName || latestDevice.deviceId })}
        </p>
      )}
    </div>
  )
}

function DeviceDetailCard({ device }) {
  const { t } = useTranslation('devices')
  const formatDateTime = useDateTime()
  const title = device.deviceModel || device.deviceName || device.deviceId || t('card.unknown')

  return (
    <div className="rounded-lg border border-primary/10 bg-app-bg p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <FiSmartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="break-words text-base font-black text-app-text">{title}</p>
            <p className="mt-1 text-xs font-semibold text-app-muted">{device.platform || '-'}</p>
          </div>
        </div>
        <Badge status={device.status} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-app-surface p-3">
          {/* <p className="text-xs font-bold uppercase text-app-muted">Employee Device ID</p> */}
          <p className="mt-1 break-words text-sm font-semibold text-app-text">{device.id ?? '-'}</p>
        </div>
        <div className="rounded-lg bg-app-surface p-3">
          <p className="text-xs font-bold uppercase text-app-muted">{t('card.deviceId')}</p>
          <p className="mt-1 break-words text-sm font-semibold text-app-text">{device.deviceId || '-'}</p>
        </div>
        {/* <div className="rounded-lg bg-app-surface p-3">
          <p className="text-xs font-bold uppercase text-app-muted">Device Name</p>
          <p className="mt-1 break-words text-sm font-semibold text-app-text">{device.deviceName || '-'}</p>
        </div> */}
        <div className="rounded-lg bg-app-surface p-3">
          <p className="text-xs font-bold uppercase text-app-muted">{t('card.deviceModel')}</p>
          <p className="mt-1 break-words text-sm font-semibold text-app-text">{device.deviceModel || '-'}</p>
        </div>
        <div className="rounded-lg bg-app-surface p-3">
          <p className="text-xs font-bold uppercase text-app-muted">{t('card.registeredAt')}</p>
          <p className="mt-1 text-sm font-semibold text-app-text">{formatDateTime(device.registeredAt)}</p>
        </div>
        <div className="rounded-lg bg-app-surface p-3">
          <p className="text-xs font-bold uppercase text-app-muted">{t('card.lastLoginAt')}</p>
          <p className="mt-1 text-sm font-semibold text-app-text">{formatDateTime(device.lastLoginAt)}</p>
        </div>
      </div>
    </div>
  )
}

function EmployeeDeviceHistoryModal({ employee, onClose }) {
  const { t } = useTranslation('devices')
  const {
    data: devices = [],
    isLoading,
    isFetching,
    isError,
    error
  } = useGetEmployeeDevicesQuery(employee?.id, { skip: !employee?.id })
  const sortedDevices = sortDevicesByActivity(devices)
  const errorMessage = getApiErrorMessage(error, t('history.loadError'))

  return (
    <Modal open={Boolean(employee)} title={t('history.title')} onClose={onClose} className="max-w-4xl">
      {employee && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-primary/5 p-4">
          <Avatar name={employee.name} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-black text-app-text sm:text-xl">{employee.name}</h3>
            <p className="text-sm font-semibold text-app-muted">
              {employee.code} - {employee.email || t('history.noEmail')}
            </p>
          </div>
          <Badge status={employee.status} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-app-text">{t('history.found', { count: devices.length })}</p>
          <p className="text-xs font-semibold text-app-muted">{t('history.hint')}</p>
        </div>
        {isFetching && !isLoading && <span className="text-xs font-bold text-app-muted">{t('common:actions.refreshing')}</span>}
      </div>

      {isError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{errorMessage}</p>}

      {isLoading ? (
        <Loader />
      ) : sortedDevices.length ? (
        <div className="space-y-3">
          {sortedDevices.map((device) => (
            <DeviceDetailCard key={device.id || device.deviceId} device={device} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-primary/20 bg-app-bg p-8 text-center">
          <FiSmartphone className="mx-auto mb-3 h-8 w-8 text-primary" />
          <p className="text-sm font-bold text-app-text">{t('history.emptyTitle')}</p>
          <p className="mt-1 text-sm text-app-muted">{t('history.emptyBody')}</p>
        </div>
      )}
    </Modal>
  )
}

export default function DeviceRequests() {
  const { t } = useTranslation('devices')
  const formatDateTime = useDateTime()
  const [tab, setTab] = useState('Pending')
  const [page, setPage] = useState(1)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [historyEmployee, setHistoryEmployee] = useState(null)

  const isHistoryTab = tab === 'History'
  const listParams = { page, limit: 20, status: tab.toUpperCase() }
  const { data: requestPage, isLoading, isFetching, isError, error } = useGetDeviceChangeRequestsQuery(listParams, {
    skip: isHistoryTab
  })
  const {
    data: employeePage,
    isLoading: employeesLoading,
    isFetching: employeesFetching,
    isError: employeesIsError,
    error: employeesError
  } = useGetEmployeesQuery({ page, limit: 20 }, { skip: !isHistoryTab })
  const [approveDeviceChangeRequest, approveState] = useApproveDeviceChangeRequestMutation()
  const [rejectDeviceChangeRequest, rejectState] = useRejectDeviceChangeRequestMutation()

  const requestRows = requestPage?.items || []
  const employeeRows = employeePage?.items || []
  const rows = isHistoryTab ? employeeRows : requestRows
  const pagination =
    (isHistoryTab ? employeePage?.pagination : requestPage?.pagination) || { page: 1, limit: 20, total: rows.length, total_pages: 1 }
  const loading = isHistoryTab ? employeesLoading : isLoading
  const fetching = isHistoryTab ? employeesFetching : isFetching
  const hasError = isHistoryTab ? employeesIsError : isError
  const queryError = error ? getApiErrorMessage(error, t('loadFailed')) : ''
  const employeesQueryError = employeesError ? getApiErrorMessage(employeesError, t('loadFailed')) : ''
  const rejectError = rejectState.error ? getApiErrorMessage(rejectState.error) : ''

  useEffect(() => {
    setPage(1)
  }, [tab])

  async function handleApprove(id) {
    try {
      await approveDeviceChangeRequest(id).unwrap()
    } catch (err) {
      void err
    }
  }

  function openRejectModal(id) {
    setRejectingId(id)
    setRejectReason('')
  }

  async function handleRejectSubmit(event) {
    event.preventDefault()
    try {
      await rejectDeviceChangeRequest({ id: rejectingId, reason: rejectReason }).unwrap()
      setRejectingId(null)
    } catch (err) {
      void err
    }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black sm:text-2xl">{t('title')}</h1>
        <p className="text-sm text-app-muted">{isHistoryTab ? t('subtitle.history') : t('subtitle.requests')}</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="hide-scrollbar flex max-w-full overflow-x-auto rounded-lg border border-primary/15 bg-app-bg p-1">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-bold transition ${
                  tab === item ? 'bg-primary text-white shadow-soft' : 'text-primary hover:bg-primary/10'
                }`}
              >
                {t(`tabs.${item.toLowerCase()}`)}
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-app-muted">
            {isHistoryTab ? t('summary.employees', { count: pagination.total }) : t('summary.requests', { count: pagination.total })}
          </p>
        </div>

        {hasError && (
          <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">
            {isHistoryTab ? employeesQueryError : queryError}
          </p>
        )}
        {fetching && !loading && <p className="mb-3 text-sm font-semibold text-app-muted">{t('common:actions.refreshing')}</p>}

        <Table
          rows={rows}
          columns={
            isHistoryTab
              ? [
                  {
                    key: 'employee',
                    header: t('columns.employee'),
                    render: (row) => (
                      <div className="flex items-center gap-3">
                        <Avatar name={row.name} />
                        <div>
                          <p className="font-bold">{row.name}</p>
                          <p className="text-xs text-app-muted">{row.email}</p>
                        </div>
                      </div>
                    )
                  },
                  { key: 'code', header: t('columns.code') },
                  {
                    key: 'devices',
                    header: t('columns.deviceSummary'),
                    render: (row) => <DeviceHistorySummaryCell employeeId={row.id} />
                  },
                  { key: 'status', header: t('columns.employeeStatus'), render: (row) => <Badge status={row.status} /> },
                  {
                    key: 'actions',
                    header: t('columns.actions'),
                    render: (row) => (
                      <Button variant="outline" icon={FiEye} onClick={() => setHistoryEmployee(row)}>
                        {t('viewHistory')}
                      </Button>
                    )
                  }
                ]
              : [
                  {
                    key: 'employee',
                    header: t('columns.employee'),
                    render: (row) => <EmployeeCell employeeId={row.employeeId} />
                  },
                  {
                    key: 'devices',
                    header: t('columns.currentVsRequested'),
                    render: (row) => (
                      <DeviceCompareCell
                        employeeId={row.employeeId}
                        oldEmployeeDeviceId={row.oldEmployeeDeviceId}
                        newDeviceId={row.newDeviceId}
                        newDeviceModel={row.newDeviceModel}
                        newPlatform={row.newPlatform}
                      />
                    )
                  },
                  {
                    key: 'requestedAt',
                    header: t('columns.requestedAt'),
                    render: (row) => formatDateTime(row.requestedAt)
                  },
                  { key: 'status', header: t('columns.status'), render: (row) => <Badge status={row.status} /> },
                  {
                    key: 'actions',
                    header: t('columns.actions'),
                    render: (row) =>
                      row.status === 'Pending' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="success"
                            icon={FiCheck}
                            disabled={approveState.isLoading}
                            onClick={() => handleApprove(row.id)}
                          >
                            {t('common:actions.approve')}
                          </Button>
                          <Button variant="danger" icon={FiX} onClick={() => openRejectModal(row.id)}>
                            {t('common:actions.reject')}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-app-muted">
                          {row.status === 'Rejected' && row.rejectionReason ? row.rejectionReason : formatDateTime(row.reviewedAt)}
                        </p>
                      )
                  }
                ]
          }
        />

        <div className="mt-4 flex flex-col gap-3 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t('common:pagination.summary', { page: pagination.page, totalPages: pagination.total_pages, shown: rows.length, total: pagination.total })}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page <= 1 || fetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              {t('common:actions.previous')}
            </Button>
            <Button
              variant="ghost"
              disabled={page >= pagination.total_pages || fetching}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('common:actions.next')}
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={Boolean(rejectingId)} title={t('reject.title')} onClose={() => setRejectingId(null)}>
        <form className="space-y-4" onSubmit={handleRejectSubmit}>
          {rejectError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{rejectError}</p>}
          <label className="block text-sm font-semibold text-app-text">
            <span className="mb-1.5 block">{t('reject.reasonLabel')}</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-primary/15 bg-app-bg px-3 py-2 text-app-text outline-none transition placeholder:text-app-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder={t('reject.reasonPlaceholder')}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRejectingId(null)}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="danger" disabled={rejectState.isLoading}>
              {t('reject.submit')}
            </Button>
          </div>
        </form>
      </Modal>

      <EmployeeDeviceHistoryModal employee={historyEmployee} onClose={() => setHistoryEmployee(null)} />
    </div>
  )
}