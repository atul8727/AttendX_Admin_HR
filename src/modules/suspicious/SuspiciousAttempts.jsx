import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiMapPin, FiSmartphone } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Table from '../../components/ui/Table.jsx'
import { getApiErrorMessage } from '../../lib/apiError.js'
import { useFormatters } from '../../lib/format.js'
import { useGetSuspiciousAttemptsQuery } from '../../store/api/suspiciousAttemptsApi.js'

const PAGE_SIZE = 30

export default function SuspiciousAttempts() {
  const { t } = useTranslation('suspicious')
  const fmt = useFormatters()
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, isError, error } = useGetSuspiciousAttemptsQuery({ page, limit: PAGE_SIZE })

  const rows = data?.items || []
  const pagination = data?.pagination || { page: 1, limit: PAGE_SIZE, total: rows.length, total_pages: 1 }
  const blockedCount = rows.filter((row) => row.isBlocked).length

  const dateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : fmt.dateTime(date)
  }
  const dateOnly = (value) => {
    if (!value) return '-'
    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime()) ? value : fmt.date(date)
  }

  const columns = [
    {
      key: 'employee',
      header: t('columns.employee'),
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.employeeName || String(row.employeeId)} />
          <div>
            <p className="font-bold">{row.employeeName || t('employeeFallback', { id: row.employeeId })}</p>
            <p className="text-xs text-app-muted">{row.employeeCode || t('idLabel', { id: row.employeeId })}</p>
          </div>
        </div>
      )
    },
    {
      key: 'action',
      header: t('columns.action'),
      // Enum (CHECK_IN) ka label locales se aata hai; naya enum aaye to raw value dikhegi.
      render: (row) => t(`actions.${row.action}`, { defaultValue: row.action || '-' })
    },
    {
      key: 'type',
      header: t('columns.type'),
      render: (row) => (
        <span className="font-semibold text-danger">{t(`types.${row.type}`, { defaultValue: row.type || '-' })}</span>
      )
    },
    {
      key: 'blocked',
      header: t('columns.result'),
      render: (row) => <Badge status={row.isBlocked ? 'Blocked' : 'Allowed'} />
    },
    {
      key: 'location',
      header: t('columns.location'),
      render: (row) => (
        <div className="flex items-start gap-2">
          <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">
              {row.latitude !== null && row.longitude !== null
                ? `${row.latitude.toFixed(5)}, ${row.longitude.toFixed(5)}`
                : '-'}
            </p>
            {row.accuracy !== null && (
              <p className="text-xs text-app-muted">{t('accuracy', { value: fmt.number(row.accuracy) })}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'device',
      header: t('columns.device'),
      render: (row) => (
        <span className="inline-flex items-center gap-2 break-all text-sm">
          <FiSmartphone className="h-4 w-4 shrink-0 text-primary" />
          {row.deviceId || '-'}
        </span>
      )
    },
    { key: 'attendanceDate', header: t('columns.attendanceDate'), render: (row) => dateOnly(row.attendanceDate) },
    { key: 'attemptedAt', header: t('columns.attemptedAt'), render: (row) => dateTime(row.locationTimestamp || row.createdAt) }
  ]

  if (isLoading) return <Loader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black sm:text-2xl">{t('title')}</h1>
        <p className="text-sm text-app-muted">{t('subtitle')}</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-app-muted">{t('summary.total', { count: pagination.total })}</p>
          <p className="text-sm font-semibold text-danger">{t('summary.blocked', { count: blockedCount })}</p>
        </div>

        {isError && (
          <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">
            {getApiErrorMessage(error, t('loadFailed'))}
          </p>
        )}
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">{t('common:actions.refreshing')}</p>}

        <Table rows={rows} columns={columns} />

        <div className="mt-4 flex flex-col gap-3 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t('common:pagination.summary', {
              page: pagination.page,
              totalPages: pagination.total_pages,
              shown: rows.length,
              total: pagination.total
            })}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              {t('common:actions.previous')}
            </Button>
            <Button variant="ghost" disabled={page >= pagination.total_pages || isFetching} onClick={() => setPage((current) => current + 1)}>
              {t('common:actions.next')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}