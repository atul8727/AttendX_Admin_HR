import { useEffect, useState } from 'react'
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
  const { data: location, isLoading, isError } = useGetWfhLocationQuery(employeeApiId(employee), { skip: !employeeApiId(employee) })
  if (isLoading) return <span className="text-app-muted">Loading...</span>
  if (isError) return <span className="text-danger">Failed to load</span>
  if (!location) return <span className="text-app-muted">Not assigned</span>
  return <span>{location.name || '-'}</span>
}

function CoordinateRow({ employee, field }) {
  const { data: location, isLoading } = useGetWfhLocationQuery(employeeApiId(employee), { skip: !employeeApiId(employee) })
  if (isLoading) return <span className="text-app-muted">Loading...</span>
  const value = location?.[field]
  return <span>{value == null ? '-' : value}</span>
}

function StatusRow({ employee }) {
  const { data: location, isLoading } = useGetWfhLocationQuery(employeeApiId(employee), { skip: !employeeApiId(employee) })
  if (isLoading) return <span className="text-app-muted">Loading...</span>
  return location ? <Badge status={location.status || '-'} /> : <span className="text-app-muted">Not assigned</span>
}

function WfhActions({ employee, onView, onEdit }) {
  const apiId = employeeApiId(employee)
  const { data: location, isLoading } = useGetWfhLocationQuery(apiId, { skip: !apiId })
  const [updateStatus, { isLoading: isUpdating }] = useUpdateWfhLocationStatusMutation()

  async function toggleStatus() {
    if (!location) return
    const status = location.status === 'Active' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateStatus({ employeeId: apiId, status }).unwrap()
      notify.success(`WFH location ${status === 'ACTIVE' ? 'activated' : 'deactivated'}.`)
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'Could not update the WFH location status.'))
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" icon={FiEye} aria-label={`View WFH location for ${employee.name}`} disabled={isLoading} onClick={() => onView(employee, location)} className="px-3" />
      <Button variant="info" icon={location ? FiEdit : FiPlus} aria-label={`${location ? 'Edit' : 'Set'} WFH location for ${employee.name}`} disabled={isLoading || isUpdating} onClick={() => onEdit(employee, location)} className="px-3" />
      {location && <Button variant={location.status === 'Active' ? 'danger' : 'success'} icon={FiPower} disabled={isUpdating} onClick={toggleStatus}>{location.status === 'Active' ? 'Deactivate' : 'Activate'}</Button>}
    </div>
  )
}

export default function WfhList() {
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
        <h1 className="text-xl font-black sm:text-2xl">Work From Home</h1>
        <p className="text-sm text-app-muted">Employee WFH locations from the attendance service.</p>
      </div>
      <Card>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px]">
          <div className="relative"><FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" /><Input placeholder="Search by name, code, email or phone..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} options={[{ label: 'All Employees', value: '' }, { label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} />
        </div>
        {isError ? <div className="flex items-center justify-between rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger"><span>{error}</span><button type="button" onClick={refetch}>Retry</button></div> : <Table rows={employees} columns={[
          { key: 'name', header: 'Employee', render: (row) => <div className="flex min-w-0 items-center gap-3"><Avatar name={row.name} /><div className="min-w-0"><p className="truncate font-bold">{row.name || '-'}</p><p className="truncate text-xs text-app-muted">{row.email || '-'}</p></div></div> },
          { key: 'location', header: 'WFH Location', render: (row) => <WfhRow employee={row} /> },
          { key: 'latitude', header: 'Latitude', render: (row) => <CoordinateRow employee={row} field="latitude" /> },
          { key: 'longitude', header: 'Longitude', render: (row) => <CoordinateRow employee={row} field="longitude" /> },
          { key: 'radius', header: 'Radius', render: (row) => <CoordinateRow employee={row} field="radiusMeters" /> },
          { key: 'status', header: 'WFH Status', render: (row) => <StatusRow employee={row} /> },
          { key: 'actions', header: 'Actions', render: (row) => <WfhActions employee={row} onView={(employee, location) => setViewing({ employee, location })} onEdit={(employee, location) => setEditing({ employee, location })} /> }
        ]} />}
        <div className="mt-4 flex items-center justify-between text-sm text-app-muted"><span>Page {pagination?.page || page} of {pagination?.total_pages || 1}</span><div className="flex gap-2"><button type="button" disabled={page <= 1 || fetching} onClick={() => setPage((current) => current - 1)}>Previous</button><button type="button" disabled={page >= (pagination?.total_pages || 1) || fetching} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>
      </Card>
      {editing && <WfhLocationModal employee={editing.employee} location={editing.location} onClose={() => setEditing(null)} />}
      {viewing && <WfhLocationDetailsModal employee={viewing.employee} location={viewing.location} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null) }} />}
    </div>
  )
}
