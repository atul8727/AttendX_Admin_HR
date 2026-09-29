import { useMemo, useState } from 'react'
import { FiEdit, FiPlus, FiPower, FiUsers } from 'react-icons/fi'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import Table from '../../components/ui/Table.jsx'
import { notify } from '../../lib/notify.js'
import LeaveSubNav from './LeaveSubNav.jsx'
import AssignAllModal from './components/AssignAllModal.jsx'
import { useLeaveAssignment } from './useLeaveAssignment.js'
import {
  useAddLeaveTypeMutation,
  useGetLeaveTypesQuery,
  useUpdateLeaveTypeMutation,
  useUpdateLeaveTypeStatusMutation
} from '../../store/api/leaveApi.js'

const CURRENT_YEAR = new Date().getFullYear()
const emptyForm = { name: '', code: '', defaultAnnualDays: '', assignToAll: true }

function getApiErrorMessage(error) {
  return error?.data?.message || error?.error || error?.message || ''
}

export default function LeaveTypes() {
  const { data, isLoading, isFetching, isError, error, refetch } = useGetLeaveTypesQuery()
  const [addLeaveType, addState] = useAddLeaveTypeMutation()
  const [updateLeaveType, updateState] = useUpdateLeaveTypeMutation()
  const [updateStatus] = useUpdateLeaveTypeStatusMutation()
  const assignment = useLeaveAssignment()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [assignOpen, setAssignOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const rows = useMemo(() => data || [], [data])
  const activeTypes = useMemo(() => rows.filter((type) => type.status === 'Active'), [rows])
  const queryError = getApiErrorMessage(error)
  const formError = getApiErrorMessage(addState.error || updateState.error)

  function openCreateModal() {
    addState.reset?.()
    updateState.reset?.()
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditModal(leaveType) {
    addState.reset?.()
    updateState.reset?.()
    setEditingId(leaveType.id)
    setForm({ name: leaveType.name, code: leaveType.code, defaultAnnualDays: leaveType.defaultAnnualDays, assignToAll: false })
    setModalOpen(true)
  }

  // Assigns the given leave types to all employees in the background and shows a toast with the result.
  async function assignInBackground(typeIds, label) {
    try {
      const result = await assignment.assign({ leaveTypeIds: typeIds, year: CURRENT_YEAR })
      if (!result) return
      if (result.failed > 0) notify.error(`${label}: ${result.failed} assignment(s) failed. Use "Assign to All" to retry.`)
      else if (result.created === 0) notify.success(`${label} is already assigned to all ${result.employees} employees.`)
      else notify.success(`${label} assigned to ${result.employees} employees.`)
    } catch (err) {
      notify.error(err.message || 'Assignment failed.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      if (editingId) {
        await updateLeaveType({ id: editingId, ...form }).unwrap()
        setModalOpen(false)
        refetch()
        return
      }

      const created = await addLeaveType(form).unwrap()
      setModalOpen(false)
      const fresh = await refetch()
      const createdId = created?.id ?? (fresh.data || []).find((type) => type.code === form.code)?.id
      notify.success(`${form.name} created.`)
      if (form.assignToAll && createdId) await assignInBackground([createdId], form.name)
    } catch (err) {
      void err
    }
  }

  async function changeStatus(leaveType, nextActive) {
    setTogglingId(leaveType.id)
    try {
      await updateStatus({ id: leaveType.id, status: nextActive ? 'ACTIVE' : 'INACTIVE' }).unwrap()
      await refetch()
      if (nextActive) {
        notify.success(`${leaveType.name} activated. Employees can now see it.`)
        // Make sure every employee has a balance for this type so they can apply right away.
        await assignInBackground([leaveType.id], leaveType.name)
      } else {
        notify.success(`${leaveType.name} deactivated. It is now hidden from employees.`)
      }
    } catch (err) {
      notify.error(getApiErrorMessage(err) || 'Could not update the status.')
    } finally {
      setTogglingId(null)
      setDeactivating(null)
    }
  }

  function handleToggle(leaveType) {
    if (leaveType.status === 'Active') setDeactivating(leaveType)
    else changeStatus(leaveType, true)
  }

  if (isLoading) return <Loader />

  const showProgress = assignment.running && !assignOpen
  const progressPercent = assignment.state.total ? Math.round((assignment.state.done / assignment.state.total) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-xl font-black sm:text-2xl">Leave Types</h1>
          <p className="text-sm text-app-muted">Configure the leave categories employees can apply for. Only active types are visible to employees.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" icon={FiUsers} onClick={() => setAssignOpen(true)} disabled={activeTypes.length === 0} className="w-full sm:w-auto">
            Assign to All Employees
          </Button>
          <Button icon={FiPlus} onClick={openCreateModal} className="w-full sm:w-auto">
            Add Type
          </Button>
        </div>
      </div>

      <LeaveSubNav />

      <Card>
        {showProgress && (
          <div className="mb-4 space-y-2 rounded-lg border border-primary/15 bg-app-bg p-3">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>{assignment.state.phase === 'scanning' ? 'Checking employees...' : 'Assigning leave to employees...'}</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <ProgressBar value={assignment.state.done} max={assignment.state.total || 1} />
          </div>
        )}
        {isError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{queryError}</p>}
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">Refreshing leave types...</p>}

        <Table
          rows={rows}
          columns={[
            { key: 'name', header: 'Type' },
            { key: 'code', header: 'Code' },
            { key: 'defaultAnnualDays', header: 'Annual Quota', render: (row) => `${row.defaultAnnualDays} days` },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
            {
              key: 'visibility',
              header: 'Employee View',
              render: (row) => (
                <span className={`text-xs font-semibold ${row.status === 'Active' ? 'text-success' : 'text-app-muted'}`}>
                  {row.status === 'Active' ? 'Visible' : 'Hidden'}
                </span>
              )
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button variant="info" icon={FiEdit} className="px-3" onClick={() => openEditModal(row)} />
                  <Button
                    variant={row.status === 'Active' ? 'danger' : 'success'}
                    icon={FiPower}
                    disabled={togglingId === row.id}
                    onClick={() => handleToggle(row)}
                  >
                    {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Create / Edit */}
      <Modal open={modalOpen} title={editingId ? 'Edit Leave Type' : 'Add Leave Type'} onClose={() => setModalOpen(false)} className="max-w-lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{formError}</p>}
          <Input
            label="Leave Type Name"
            placeholder="Casual Leave"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Code"
              placeholder="CL"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
              disabled={Boolean(editingId)}
              required
            />
            <Input
              label="Default Annual Days"
              type="number"
              min="0"
              step="0.5"
              placeholder="12"
              value={form.defaultAnnualDays}
              onChange={(event) => setForm({ ...form, defaultAnnualDays: event.target.value })}
              required
            />
          </div>

          {!editingId && (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={form.assignToAll}
                onChange={(event) => setForm({ ...form, assignToAll: event.target.checked })}
              />
              <span className="text-sm">
                <span className="block font-bold text-app-text">Assign to all employees now</span>
                <span className="text-xs text-app-muted">All active employees will get this leave type for {CURRENT_YEAR}.</span>
              </span>
            </label>
          )}

          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={addState.isLoading || updateState.isLoading} className="w-full sm:w-auto">
              {editingId ? 'Save Changes' : 'Create Leave Type'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate confirmation */}
      <Modal open={Boolean(deactivating)} title="Deactivate Leave Type?" onClose={() => setDeactivating(null)} className="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-app-muted">
            <b className="text-app-text">{deactivating?.name}</b> will be hidden from employees and they will not be able to apply for it. Existing
            balances and history are kept, and everything reappears when you activate it again.
          </p>
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setDeactivating(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={togglingId === deactivating?.id}
              onClick={() => changeStatus(deactivating, false)}
              className="w-full sm:w-auto"
            >
              Yes, Deactivate
            </Button>
          </div>
        </div>
      </Modal>

      <AssignAllModal open={assignOpen} onClose={() => setAssignOpen(false)} activeTypes={activeTypes} assignment={assignment} defaultYear={CURRENT_YEAR} />
    </div>
  )
}