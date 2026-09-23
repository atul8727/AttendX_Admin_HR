import { useEffect, useState } from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'
import { useGetEmployeeQuery } from '../../store/api/employeesApi.js'
import {
  useApproveDeviceChangeRequestMutation,
  useGetDeviceChangeRequestsQuery,
  useGetEmployeeDevicesQuery,
  useRejectDeviceChangeRequestMutation
} from '../../store/api/devicesApi.js'

const TABS = ['Pending', 'Approved', 'Rejected']

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function EmployeeCell({ employeeId }) {
  const { data: employee, isFetching } = useGetEmployeeQuery(employeeId, { skip: !employeeId })
  return (
    <div className="flex items-center gap-3">
      <Avatar name={employee?.name || String(employeeId)} />
      <div>
        <p className="font-bold">{isFetching && !employee ? 'Loading...' : employee?.name || `Employee #${employeeId}`}</p>
        <p className="text-xs text-app-muted">{employee?.code || `ID: ${employeeId}`}</p>
      </div>
    </div>
  )
}

function DeviceCompareCell({ employeeId, oldEmployeeDeviceId, newDeviceId, newDeviceModel, newPlatform }) {
  const { data: devices } = useGetEmployeeDevicesQuery(employeeId, { skip: !employeeId })
  const oldDevice = devices?.find((device) => device.id === oldEmployeeDeviceId)

  return (
    <div className="grid min-w-80 grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
        <p className="text-xs font-bold uppercase text-app-muted">Current</p>
        <p className="font-bold">{oldDevice?.deviceModel || oldDevice?.deviceId || '-'}</p>
        <p className="text-xs text-app-muted">{oldDevice?.platform || ''}</p>
      </div>
      <span className="text-lg font-black text-primary">to</span>
      <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
        <p className="text-xs font-bold uppercase text-app-muted">Requested</p>
        <p className="font-bold">{newDeviceModel || newDeviceId || '-'}</p>
        <p className="text-xs text-app-muted">{newPlatform || ''}</p>
      </div>
    </div>
  )
}

export default function DeviceRequests() {
  const [tab, setTab] = useState('Pending')
  const [page, setPage] = useState(1)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const listParams = { page, limit: 20, status: tab.toUpperCase() }
  const { data: requestPage, isLoading, isFetching, isError, error } = useGetDeviceChangeRequestsQuery(listParams)
  const [approveDeviceChangeRequest, approveState] = useApproveDeviceChangeRequestMutation()
  const [rejectDeviceChangeRequest, rejectState] = useRejectDeviceChangeRequestMutation()

  const rows = requestPage?.items || []
  const pagination = requestPage?.pagination || { page: 1, limit: 20, total: rows.length, total_pages: 1 }
  const queryError = error?.data?.message || error?.error || ''
  const rejectError = rejectState.error?.data?.message || rejectState.error?.error || ''

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

  if (isLoading) return <Loader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Device Management</h1>
        <p className="text-sm text-app-muted">Review device change requests raised by employees - API synced.</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border border-primary/15 bg-app-bg p-1">
            {TABS.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`min-h-10 rounded-md px-4 text-sm font-bold transition ${
                  tab === item ? 'bg-primary text-white shadow-soft' : 'text-primary hover:bg-primary/10'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-app-muted">{pagination.total} request(s)</p>
        </div>

        {isError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{queryError}</p>}
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">Refreshing...</p>}

        <Table
          rows={rows}
          columns={[
            {
              key: 'employee',
              header: 'Employee',
              render: (row) => <EmployeeCell employeeId={row.employeeId} />
            },
            {
              key: 'devices',
              header: 'Current vs Requested',
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
              header: 'Requested At',
              render: (row) => formatDateTime(row.requestedAt)
            },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) =>
                row.status === 'Pending' ? (
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      icon={FiCheck}
                      disabled={approveState.isLoading}
                      onClick={() => handleApprove(row.id)}
                    >
                      Approve
                    </Button>
                    <Button variant="danger" icon={FiX} onClick={() => openRejectModal(row.id)}>
                      Reject
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-app-muted">
                    {row.status === 'Rejected' && row.rejectionReason ? row.rejectionReason : formatDateTime(row.reviewedAt)}
                  </p>
                )
            }
          ]}
        />

        <div className="mt-4 flex flex-col gap-3 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {pagination.page} of {pagination.total_pages} - Showing {rows.length} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </Button>
            <Button
              variant="ghost"
              disabled={page >= pagination.total_pages || isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={Boolean(rejectingId)} title="Reject Device Change Request" onClose={() => setRejectingId(null)}>
        <form className="space-y-4" onSubmit={handleRejectSubmit}>
          {rejectError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{rejectError}</p>}
          <label className="block text-sm font-semibold text-app-text">
            <span className="mb-1.5 block">Rejection Reason</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-primary/15 bg-app-bg px-3 py-2 text-app-text outline-none transition placeholder:text-app-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Could not verify the employee identity"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={rejectState.isLoading}>
              Reject Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}