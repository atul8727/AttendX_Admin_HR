import { useEffect, useMemo, useState } from 'react'
import { FiEdit, FiPlus } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import Select from '../../components/ui/Select.jsx'
import Table from '../../components/ui/Table.jsx'
import LeaveSubNav from './LeaveSubNav.jsx'
import { useGetEmployeeQuery, useGetEmployeesQuery } from '../../store/api/employeesApi.js'
import { useAddLeaveBalanceMutation, useGetLeaveBalancesQuery, useGetLeaveTypesQuery, useUpdateLeaveBalanceMutation } from '../../store/api/leaveApi.js'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((year) => ({ label: String(year), value: String(year) }))

const emptyForm = { employeeId: '', leaveTypeId: '', year: String(CURRENT_YEAR) }

function getApiErrorMessage(error) {
  return error?.data?.message || error?.error || error?.message || ''
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

export default function LeaveBalances() {
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: employeePage, isLoading: employeesLoading } = useGetEmployeesQuery({ page: 1, limit: 100 })
  const { data: leaveTypes = [], isLoading: leaveTypesLoading } = useGetLeaveTypesQuery()
  const {
    data: balancePage,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useGetLeaveBalancesQuery({ employeeId: employeeFilter, year, page, limit })
  const [addLeaveBalance, addState] = useAddLeaveBalanceMutation()
  const [updateLeaveBalance, updateState] = useUpdateLeaveBalanceMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBalance, setEditingBalance] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [allocatedDaysInput, setAllocatedDaysInput] = useState('')

  useEffect(() => {
    setPage(1)
  }, [year, employeeFilter])

  const rows = useMemo(() => balancePage?.items || [], [balancePage])
  const pagination = balancePage?.pagination || { page: 1, limit, total: rows.length, total_pages: 1 }
  const queryError = getApiErrorMessage(error)
  const mutationError = addState.error
  const formError = getApiErrorMessage(mutationError)

  const leaveTypeMap = useMemo(() => Object.fromEntries(leaveTypes.map((type) => [String(type.id), type])), [leaveTypes])

  const employeeOptions = [
    { value: '', label: employeesLoading ? 'Loading employees...' : 'All Employees' },
    ...(employeePage?.items || []).map((employee) => ({ value: employee.id, label: `${employee.name} (${employee.code})` }))
  ]

  const leaveTypeOptions = leaveTypes.map((type) => ({ value: type.id, label: `${type.name} (${type.code})` }))

  function openCreateModal() {
    setForm({ ...emptyForm, employeeId: employeeFilter, year })
    setModalOpen(true)
  }

  function openEditModal(balance) {
    setEditingBalance(balance)
    setAllocatedDaysInput(String(balance.allocatedDays))
  }

  async function handleCreateSubmit(event) {
    event.preventDefault()
    try {
      await addLeaveBalance(form).unwrap()
      setModalOpen(false)
      refetch()
    } catch (err) {
      void err
    }
  }

  async function handleUpdateSubmit(event) {
    event.preventDefault()
    try {
      await updateLeaveBalance({ id: editingBalance.id, allocatedDays: allocatedDaysInput }).unwrap()
      setEditingBalance(null)
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
          <h1 className="text-xl font-black sm:text-2xl">Leave Balances</h1>
          <p className="text-sm text-app-muted">Allocate and track how many leave days each employee has left.</p>
        </div>
        <Button icon={FiPlus} onClick={openCreateModal} className="w-full sm:w-auto">
          Allocate Balance
        </Button>
      </div>

      <LeaveSubNav />

      <Card>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_160px]">
          <Select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} options={employeeOptions} />
          <Select value={year} onChange={(event) => setYear(event.target.value)} options={YEAR_OPTIONS} />
        </div>

        {isError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{queryError}</p>}
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">Refreshing balances...</p>}

        <Table
          rows={rows}
          columns={[
            { key: 'employee', header: 'Employee', render: (row) => <EmployeeCell employeeId={row.employeeId} /> },
            {
              key: 'leaveType',
              header: 'Leave Type',
              render: (row) => {
                const type = leaveTypeMap[String(row.leaveTypeId)]
                return leaveTypesLoading && !type ? 'Loading...' : type ? `${type.name} (${type.code})` : `Type #${row.leaveTypeId}`
              }
            },
            { key: 'year', header: 'Year' },
            {
              key: 'balance',
              header: 'Balance',
              render: (row) => (
                <div className="min-w-[10rem] space-y-1">
                  <ProgressBar value={row.usedDays} max={row.allocatedDays || 1} tone="warning" />
                  <p className="text-xs font-semibold text-app-muted">
                    {row.remainingDays} of {row.allocatedDays} days remaining
                  </p>
                </div>
              )
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => <Button variant="info" icon={FiEdit} className="px-3" onClick={() => openEditModal(row)} />
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

      <Modal open={modalOpen} title="Allocate Leave Balance" onClose={() => setModalOpen(false)} className="max-w-lg">
        <form className="space-y-4" onSubmit={handleCreateSubmit}>
          {formError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{formError}</p>}
          <Select
            label="Employee"
            value={form.employeeId}
            onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
            options={[{ value: '', label: employeesLoading ? 'Loading employees...' : 'Select employee' }, ...employeeOptions.slice(1)]}
            required
          />
          <Select
            label="Leave Type"
            value={form.leaveTypeId}
            onChange={(event) => setForm({ ...form, leaveTypeId: event.target.value })}
            options={[{ value: '', label: leaveTypesLoading ? 'Loading leave types...' : 'Select leave type' }, ...leaveTypeOptions]}
            required
          />
          <Input
            label="Year"
            type="number"
            value={form.year}
            onChange={(event) => setForm({ ...form, year: event.target.value })}
            required
          />
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={addState.isLoading} className="w-full sm:w-auto">
              Allocate
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(editingBalance)} title="Update Allocated Days" onClose={() => setEditingBalance(null)} className="max-w-md">
        <form className="space-y-4" onSubmit={handleUpdateSubmit}>
          {updateState.error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(updateState.error)}</p>}
          <Input
            label="Allocated Days"
            type="number"
            min="0"
            step="0.5"
            value={allocatedDaysInput}
            onChange={(event) => setAllocatedDaysInput(event.target.value)}
            required
          />
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setEditingBalance(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={updateState.isLoading} className="w-full sm:w-auto">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}