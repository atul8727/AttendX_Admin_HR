import { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiEye, FiX } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'
import LeaveSubNav from './LeaveSubNav.jsx'
import { LEAVE_REQUEST_TABS } from '../../constants/leave.js'
import { useGetEmployeeQuery } from '../../store/api/employeesApi.js'
import { useApproveLeaveRequestMutation, useGetLeaveTypesQuery, useGetLeaveRequestsQuery, useRejectLeaveRequestMutation } from '../../store/api/leaveApi.js'

function getApiErrorMessage(error) {
  return error?.data?.message || error?.error || error?.message || ''
}

function formatDisplayDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
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

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value ?? '-'}</p>
    </div>
  )
}

export default function LeaveRequests() {
  const [tab, setTab] = useState('Pending')
  const [page, setPage] = useState(1)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [viewingRequest, setViewingRequest] = useState(null)
  const limit = 20

  const listParams = { page, limit, status: tab === 'All' ? '' : tab.toUpperCase() }
  const { data, isLoading, isFetching, isError, error, refetch } = useGetLeaveRequestsQuery(listParams)
  const { data: leaveTypes = [] } = useGetLeaveTypesQuery()
  const [approveLeaveRequest, approveState] = useApproveLeaveRequestMutation()
  const [rejectLeaveRequest, rejectState] = useRejectLeaveRequestMutation()

  useEffect(() => {
    setPage(1)
  }, [tab])

  const rows = useMemo(() => data?.items || [], [data])
  const pagination = data?.pagination || { page: 1, limit, total: rows.length, total_pages: 1 }
  const queryError = getApiErrorMessage(error)
  const rejectError = getApiErrorMessage(rejectState.error)
  const leaveTypeMap = useMemo(() => Object.fromEntries(leaveTypes.map((type) => [String(type.id), type])), [leaveTypes])

  function leaveTypeLabel(id) {
    const type = leaveTypeMap[String(id)]
    return type ? `${type.name} (${type.code})` : `Type #${id}`
  }

  async function handleApprove(id) {
    try {
      await approveLeaveRequest(id).unwrap()
      refetch()
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
      await rejectLeaveRequest({ id: rejectingId, reason: rejectReason }).unwrap()
      setRejectingId(null)
      refetch()
    } catch (err) {
      void err
    }
  }

  if (isLoading) return <Loader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black sm:text-2xl">Leave Requests</h1>
        <p className="text-sm text-app-muted">Review employee leave applications and approve or reject them.</p>
      </div>

      <LeaveSubNav />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="hide-scrollbar flex max-w-full overflow-x-auto rounded-lg border border-primary/15 bg-app-bg p-1">
            {LEAVE_REQUEST_TABS.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-bold transition ${
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
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">Refreshing requests...</p>}

        <Table
          rows={rows}
          onRowClick={setViewingRequest}
          columns={[
            { key: 'employee', header: 'Employee', render: (row) => <EmployeeCell employeeId={row.employeeId} /> },
            { key: 'leaveType', header: 'Leave Type', render: (row) => leaveTypeLabel(row.leaveTypeId) },
            {
              key: 'dates',
              header: 'From - To',
              render: (row) => (
                <span>
                  {formatDisplayDate(row.startDate)} - {formatDisplayDate(row.endDate)}
                </span>
              )
            },
            { key: 'totalDays', header: 'Days', render: (row) => `${row.totalDays} (${row.durationTypeLabel})` },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.statusLabel} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) =>
                row.status === 'PENDING' ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="success"
                      icon={FiCheck}
                      disabled={approveState.isLoading}
                      onClick={(event) => {
                        event.stopPropagation()
                        handleApprove(row.id)
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      icon={FiX}
                      onClick={(event) => {
                        event.stopPropagation()
                        openRejectModal(row.id)
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    icon={FiEye}
                    onClick={(event) => {
                      event.stopPropagation()
                      setViewingRequest(row)
                    }}
                  >
                    View
                  </Button>
                )
            }
          ]}
        />

        <div className="mt-4 flex flex-col gap-3 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {pagination.page} of {pagination.total_pages} - Showing {rows.length} of {pagination.total}
          </span>
          <div className="flex flex-wrap gap-2">
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

      <Modal open={Boolean(rejectingId)} title="Reject Leave Request" onClose={() => setRejectingId(null)}>
        <form className="space-y-4" onSubmit={handleRejectSubmit}>
          {rejectError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{rejectError}</p>}
          <label className="block text-sm font-semibold text-app-text">
            <span className="mb-1.5 block">Rejection Reason</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-primary/15 bg-app-bg px-3 py-2 text-app-text outline-none transition placeholder:text-app-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Insufficient staffing on requested dates"
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

      <Modal open={Boolean(viewingRequest)} title="Leave Request Details" onClose={() => setViewingRequest(null)} className="max-w-2xl">
        {viewingRequest && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-primary/5 p-4">
              <EmployeeCell employeeId={viewingRequest.employeeId} />
              <Badge status={viewingRequest.statusLabel} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Leave Type" value={leaveTypeLabel(viewingRequest.leaveTypeId)} />
              <DetailItem label="Duration Type" value={viewingRequest.durationTypeLabel} />
              <DetailItem label="Start Date" value={formatDisplayDate(viewingRequest.startDate)} />
              <DetailItem label="End Date" value={formatDisplayDate(viewingRequest.endDate)} />
              <DetailItem label="Total Days" value={viewingRequest.totalDays} />
              <DetailItem label="Reason" value={viewingRequest.reason} />
              <DetailItem label="Applied At" value={formatDateTime(viewingRequest.appliedAt)} />
              <DetailItem label="Reviewed At" value={formatDateTime(viewingRequest.reviewedAt)} />
              {viewingRequest.status === 'REJECTED' && (
                <DetailItem label="Rejection Reason" value={viewingRequest.rejectionReason} />
              )}
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={() => setViewingRequest(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}