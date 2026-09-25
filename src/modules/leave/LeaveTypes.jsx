import { useState } from 'react'
import { FiEdit, FiPlus, FiPower } from 'react-icons/fi'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'
import LeaveSubNav from './LeaveSubNav.jsx'
import {
  useAddLeaveTypeMutation,
  useGetLeaveTypesQuery,
  useUpdateLeaveTypeMutation,
  useUpdateLeaveTypeStatusMutation
} from '../../store/api/leaveApi.js'

const emptyForm = { name: '', code: '', defaultAnnualDays: '' }

function getApiErrorMessage(error) {
  return error?.data?.message || error?.error || error?.message || ''
}

export default function LeaveTypes() {
  const { data, isLoading, isFetching, isError, error, refetch } = useGetLeaveTypesQuery()
  const [addLeaveType, addState] = useAddLeaveTypeMutation()
  const [updateLeaveType, updateState] = useUpdateLeaveTypeMutation()
  const [updateStatus, statusState] = useUpdateLeaveTypeStatusMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const rows = data || []
  const queryError = getApiErrorMessage(error)
  const mutationError = addState.error || updateState.error
  const formError = getApiErrorMessage(mutationError)

  function openCreateModal() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditModal(leaveType) {
    setEditingId(leaveType.id)
    setForm({ name: leaveType.name, code: leaveType.code, defaultAnnualDays: leaveType.defaultAnnualDays })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      if (editingId) await updateLeaveType({ id: editingId, ...form }).unwrap()
      else await addLeaveType(form).unwrap()
      setModalOpen(false)
      refetch()
    } catch (err) {
      void err
    }
  }

  async function handleToggleStatus(leaveType) {
    try {
      await updateStatus({ id: leaveType.id, status: leaveType.status === 'Active' ? 'INACTIVE' : 'ACTIVE' }).unwrap()
      refetch()
    } catch (err) {
      void err
    }
  }

  if (isLoading) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-black sm:text-2xl">Leave Types</h1>
          <p className="text-sm text-app-muted">Configure the leave categories employees can apply for.</p>
        </div>
        <Button icon={FiPlus} onClick={openCreateModal} className="w-full sm:w-auto">
          Add Type
        </Button>
      </div>

      <LeaveSubNav />

      <Card>
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
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button variant="info" icon={FiEdit} className="px-3" onClick={() => openEditModal(row)} />
                  <Button
                    variant={row.status === 'Active' ? 'danger' : 'success'}
                    icon={FiPower}
                    disabled={statusState.isLoading}
                    onClick={() => handleToggleStatus(row)}
                  >
                    {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Card>

      <Modal open={modalOpen} title={editingId ? 'Edit Leave Type' : 'Add Leave Type'} onClose={() => setModalOpen(false)} className="max-w-lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{formError}</p>}
          <Input
            label="Leave Type Name"
            placeholder="Sick Leave"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Input
            label="Code"
            placeholder="SL"
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
            placeholder="10"
            value={form.defaultAnnualDays}
            onChange={(event) => setForm({ ...form, defaultAnnualDays: event.target.value })}
            required
          />
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
    </div>
  )
}