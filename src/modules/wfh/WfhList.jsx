import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiEdit, FiEye, FiPlus, FiPower, FiSearch } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Select from '../../components/ui/Select.jsx'
import Table from '../../components/ui/Table.jsx'
import Button from '../../components/ui/Button.jsx'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useEmployeeList } from '../../hooks/useEmployees.js'
import { getApiErrorMessage } from '../../lib/apiError.js'
import { notify } from '../../lib/notify.js'
import { useGetWfhLocationQuery, useUpdateWfhLocationStatusMutation } from '../../store/api/wfhApi.js'
import WfhLocationModal from './components/WfhLocationModal.jsx'
import WfhLocationDetailsModal from './components/WfhLocationDetailsModal.jsx'

function employeeApiId(employee) {
  return employee.apiId || employee.id
}

function WfhRow({ employee }) {
  const { t } = useTranslation('wfh')
  const { data: location, isLoading, isError } = useGetWfhLocationQuery(employeeApiId(employee), { skip: !employeeApiId(employee) })
  if (isLoading) return <span className="text-app-muted">{t('common:actions.loading')}</span>
  if (isError) return <span className="text-danger">{t('list.loadFailed')}</span>
  if (!location) return <span className="text-app-muted">{t('list.notAssigned')}</span>
  return <span>{location.name || '-'}</span>
}

function CoordinateRow({ employee, field }) {
  const { t } = useTranslation()
  const { data: location, isLoading } = useGetWfhLocationQuery(employeeApiId(employee), { skip: !employeeApiId(employee) })
  if (isLoading) return <span className="text-app-muted">{t('common:actions.loading')}</span>
  const value = location?.[field]
  return <span>{value == null ? '-' : value}</span>
}

function StatusRow({ employee }) {
  const { t } = useTranslation('wfh')
  const { data: location, isLoading } = useGetWfhLocationQuery(employeeApiId(employee), { skip: !employeeApiId(employee) })
  if (isLoading) return <span className="text-app-muted">{t('common:actions.loading')}</span>
  return location ? <Badge status={location.status || '-'} /> : <span className="text-app-muted">{t('list.notAssigned')}</span>
}

function WfhActions({ employee, onView, onEdit }) {
  const { t } = useTranslation('wfh')
  const apiId = employeeApiId(employee)
  const { data: location, isLoading } = useGetWfhLocationQuery(apiId, { skip: !apiId })
  const [updateStatus, { isLoading: isUpdating }] = useUpdateWfhLocationStatusMutation()

  async function toggleStatus() {
    if (!location) return
    const status = location.status === 'Active' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateStatus({ employeeId: apiId, status }).unwrap()
      notify.success(status === 'ACTIVE' ? t('list.activated') : t('list.deactivated'))
    } catch (error) {
      notify.error(getApiErrorMessage(error, t('list.statusFailed')))
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" icon={FiEye} aria-label={t('list.viewAria', { name: employee.name })} disabled={isLoading} onClick={() => onView(employee, location)} className="px-3" />
      <Button
        variant="info"
        icon={location ? FiEdit : FiPlus}
        aria-label={location ? t('list.editAria', { name: employee.name }) : t('list.setAria', { name: employee.name })}
        disabled={isLoading || isUpdating}
        onClick={() => onEdit(employee, location)}
        className="px-3"
      />
      {location && (
        <Button variant={location.status === 'Active' ? 'danger' : 'success'} icon={FiPower} disabled={isUpdating} onClick={toggleStatus}>
          {location.status === 'Active' ? t('list.deactivate') : t('list.activate')}
        </Button>
      )}
    </div>
  )
}

export default function WfhList() {
  const { t } = useTranslation('wfh')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const debouncedSearch = useDebounce(search)
  const { data: employees, pagination, loading, fetching, isError, error, refetch } = useEmployeeList({ page, limit: 20, search: debouncedSearch, status })

  useEffect(() => setPage(1), [debouncedSearch, status])

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black sm:text-2xl">{t('list.title')}</h1>
        <p className="text-sm text-app-muted">{t('list.subtitle')}</p>
      </div>
      <Card>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px]">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
            <Input placeholder={t('list.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { label: t('list.allEmployees'), value: '' },
              { label: t('status:active'), value: 'ACTIVE' },
              { label: t('status:inactive'), value: 'INACTIVE' }
            ]}
          />
        </div>
        {isError ? (
          <div className="flex items-center justify-between rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">
            <span>{error}</span>
            <button type="button" onClick={refetch}>
              {t('list.retry')}
            </button>
          </div>
        ) : (
          <Table
            rows={employees}
            columns={[
              {
                key: 'name',
                header: t('list.columns.employee'),
                render: (row) => (
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={row.name} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{row.name || '-'}</p>
                      <p className="truncate text-xs text-app-muted">{row.email || '-'}</p>
                    </div>
                  </div>
                )
              },
              { key: 'location', header: t('list.columns.location'), render: (row) => <WfhRow employee={row} /> },
              { key: 'latitude', header: t('list.columns.latitude'), render: (row) => <CoordinateRow employee={row} field="latitude" /> },
              { key: 'longitude', header: t('list.columns.longitude'), render: (row) => <CoordinateRow employee={row} field="longitude" /> },
              { key: 'radius', header: t('list.columns.radius'), render: (row) => <CoordinateRow employee={row} field="radiusMeters" /> },
              { key: 'status', header: t('list.columns.status'), render: (row) => <StatusRow employee={row} /> },
              {
                key: 'actions',
                header: t('list.columns.actions'),
                render: (row) => (
                  <WfhActions
                    employee={row}
                    onView={(employee, location) => setViewing({ employee, location })}
                    onEdit={(employee, location) => setEditing({ employee, location })}
                  />
                )
              }
            ]}
          />
        )}
        <div className="mt-4 flex items-center justify-between text-sm text-app-muted">
          <span>{t('list.pageSummary', { page: pagination?.page || page, totalPages: pagination?.total_pages || 1 })}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1 || fetching} onClick={() => setPage((current) => current - 1)}>
              {t('common:actions.previous')}
            </button>
            <button type="button" disabled={page >= (pagination?.total_pages || 1) || fetching} onClick={() => setPage((current) => current + 1)}>
              {t('common:actions.next')}
            </button>
          </div>
        </div>
      </Card>
      {editing && <WfhLocationModal employee={editing.employee} location={editing.location} onClose={() => setEditing(null)} />}
      {viewing && (
        <WfhLocationDetailsModal
          employee={viewing.employee}
          location={viewing.location}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing)
            setViewing(null)
          }}
        />
      )}
    </div>
  )
}