import { useEffect, useMemo, useState } from 'react'
import { FiEdit, FiEye, FiPlus, FiPower } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Select from '../../components/ui/Select.jsx'
import Table from '../../components/ui/Table.jsx'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useEmployee, useEmployeeList, useEmployeeMutations } from '../../hooks/useEmployees.js'
import { useAssignEmployeeOfficeMutation, useGetEmployeeOfficeQuery } from '../../store/api/employeesApi.js'
import { useGetOfficesQuery } from '../../store/api/officesApi.js'

const emptyForm = {
  code: '',
  name: '',
  email: '',
  password: 'gk@123',
  phone: '',
  role: '',
  department: '',
  officeSettingId: '',
  expectedLogin: '09:30',
  expectedLogout: '18:30',
  lateGraceMinutes: 15,
  status: 'Active'
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value ?? '-'}</p>
    </div>
  )
}

// List row mein branch dikhata hai. Agar list API office info nahi bhejti to us employee ka office alag se fetch karta hai
// (RTK Query cache karta hai, isliye same employee ke liye dobara request nahi jati).
function BranchCell({ employee, branchNameById }) {
  const knownName = employee.officeName || branchNameById[employee.officeSettingId]
  const { data: office, isFetching } = useGetEmployeeOfficeQuery(employee.id, { skip: Boolean(knownName) })

  if (knownName) return knownName
  if (isFetching) return <span className="text-app-muted">...</span>
  return office?.officeName || branchNameById[office?.officeSettingId] || <span className="text-app-muted">Not assigned</span>
}

export default function EmployeeList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(search)
  const listParams = {
    page,
    limit: 20,
    search: debounced,
    status: status === 'All' ? '' : status.toUpperCase()
  }
  const {
    data,
    pagination: employeePagination,
    loading: isLoading,
    fetching: isFetching,
    isError,
    error,
    refetch: refetchEmployees
  } = useEmployeeList(listParams)
  const { addEmployee, updateEmployee, updateEmployeeStatus, addState, updateState } = useEmployeeMutations()
  // NOTE: ye hook mutationError se PEHLE hona zaroori hai, warna assignState undefined-before-init crash deta hai
  const [assignOffice, assignState] = useAssignEmployeeOfficeMutation()
  const [modalOpen, setModalOpen] = useState(false)
  const [viewingId, setViewingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const { data: viewingEmployee, fetching: viewingLoading } = useEmployee(viewingId, { skip: !viewingId })
  const mutationError = addState.error || updateState.error || assignState.error
  const formError =
    mutationError?.data?.message || mutationError?.data?.error?.message || mutationError?.error || mutationError?.message || ''
  const queryError = error || ''
  const pagination = employeePagination || { page: 1, limit: 20, total: data.length, total_pages: 1 }

  useEffect(() => {
    setPage(1)
  }, [debounced, status])

  const rows = useMemo(() => data || [], [data])

  // Branches (offices) + employee ka current office
  const { data: branches = [], isLoading: branchesLoading, isError: branchesError } = useGetOfficesQuery()
  const branchNameById = useMemo(() => Object.fromEntries(branches.map((branch) => [branch.id, branch.name])), [branches])
  const { data: editingOffice, isFetching: editingOfficeLoading } = useGetEmployeeOfficeQuery(editingId, { skip: !editingId })
  const { data: viewingOffice } = useGetEmployeeOfficeQuery(viewingId, { skip: !viewingId })

  // Form mein user ne kuch choose nahi kiya to edit mode mein employee ka current office dikhao
  const selectedOfficeId = form.officeSettingId || editingOffice?.officeSettingId || ''
  const branchOptions = useMemo(
    () => [
      { label: branchesLoading ? 'Loading branches...' : 'Select Branch', value: '' },
      ...branches.map((branch) => ({ label: branch.name, value: branch.id }))
    ],
    [branches, branchesLoading]
  )
  const saving = addState.isLoading || updateState.isLoading || assignState.isLoading

  function openCreateModal() {
    setEditingId(null)
    setForm({ ...emptyForm, code: `EMP${String((pagination.total || data.length) + 1).padStart(3, '0')}` })
    setModalOpen(true)
  }

  function openEditModal(employee) {
    setEditingId(employee.id)
    setForm({ ...emptyForm, ...employee, officeSettingId: employee.officeSettingId || '' })
    setModalOpen(true)
  }

  function openViewModal(employee) {
    setViewingId(employee.id)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      if (editingId) {
        await updateEmployee(editingId, form)
        // Office alag endpoint se assign hota hai, sirf tab jab badla ho
        if (selectedOfficeId && selectedOfficeId !== editingOffice?.officeSettingId) {
          await assignOffice({ id: editingId, officeSettingId: selectedOfficeId }).unwrap()
        }
      } else {
        await addEmployee({ ...form, officeSettingId: selectedOfficeId })
      }
      await refetchEmployees()
      setModalOpen(false)
    } catch (err) {
      void err
    }
  }

  async function handleToggle(employee) {
    try {
      await updateEmployeeStatus(employee.id, employee.status === 'Active' ? 'Inactive' : 'Active')
      await refetchEmployees()
    } catch (err) {
      void err
    }
  }

  if (isLoading) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-black sm:text-2xl">Employee Management</h1>
          <p className="text-sm text-app-muted">
            {pagination.total} employees - manage profiles, roles and attendance timing in one place.
          </p>
        </div>
        <Button icon={FiPlus} onClick={openCreateModal} className="w-full sm:w-auto">
          Add Employee
        </Button>
      </div>

      <Card>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px]">
          <Input
            placeholder="Search by name, code, email, or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { label: 'All Status', value: 'All' },
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' }
            ]}
          />
        </div>
        {isError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{queryError}</p>}
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">Refreshing employees...</p>}
        <Table
          rows={rows}
          onRowClick={openViewModal}
          columns={[
            {
              key: 'name',
              header: 'Employee',
              render: (row) => (
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={row.name} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{row.name}</p>
                    <p className="truncate text-xs text-app-muted">{row.email}</p>
                  </div>
                </div>
              )
            },
            { key: 'code', header: 'Code' },
            { key: 'branch', header: 'Branch', render: (row) => <BranchCell employee={row} branchNameById={branchNameById} /> },
            { key: 'phone', header: 'Phone' },
            { key: 'expectedLogin', header: 'Expected Login' },
            { key: 'expectedLogout', header: 'Expected Logout' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    icon={FiEye}
                    aria-label={`View ${row.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      openViewModal(row)
                    }}
                  />
                  <Button
                    variant="info"
                    icon={FiEdit}
                    aria-label={`Edit ${row.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      openEditModal(row)
                    }}
                  />
                  <Button
                    variant={row.status === 'Active' ? 'danger' : 'success'}
                    icon={FiPower}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleToggle(row)
                    }}
                  >
                    {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
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

      <Modal open={modalOpen} title={editingId ? 'Edit Employee' : 'Add Employee'} onClose={() => setModalOpen(false)} className="max-w-3xl">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{formError}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Employee Code"
              placeholder="EMP002"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              disabled={Boolean(editingId)}
              required
            />
            <Input
              label="Name"
              placeholder="Gulshan Kumar"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="gulshandev524@gmail.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              disabled={Boolean(editingId)}
              required
            />
            {!editingId && (
              <Input
                label="Password"
                type="password"
                placeholder="gk@123"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            )}
            <Input
              label="Phone"
              placeholder="73939391450"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              required
            />
            <Input
              label="Expected Login"
              type="time"
              placeholder="10:00"
              value={form.expectedLogin}
              onChange={(event) => setForm({ ...form, expectedLogin: event.target.value })}
            />
            <Input
              label="Expected Logout"
              type="time"
              placeholder="19:00"
              value={form.expectedLogout}
              onChange={(event) => setForm({ ...form, expectedLogout: event.target.value })}
            />
            <Input
              label="Late Grace Minutes"
              type="number"
              min="0"
              placeholder="15"
              value={form.lateGraceMinutes}
              onChange={(event) => setForm({ ...form, lateGraceMinutes: Number(event.target.value) })}
            />
            <div>
              <Select
                label="Branch"
                value={selectedOfficeId}
                onChange={(event) => setForm({ ...form, officeSettingId: event.target.value })}
                options={branchOptions}
                disabled={branchesLoading || Boolean(editingId && editingOfficeLoading)}
                required={!editingId}
              />
              {branchesError && <p className="mt-1 text-xs font-semibold text-danger">Branch list load nahi hui. Offices module/API check karo.</p>}
            </div>
          </div>
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(viewingId)} title="Employee Details" onClose={() => setViewingId(null)} className="max-w-3xl">
        {viewingLoading || !viewingEmployee ? (
          <Loader />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-primary/5 p-4">
              <Avatar name={viewingEmployee.name} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xl font-black text-app-text">{viewingEmployee.name}</h3>
                <p className="text-sm font-semibold text-app-muted">{viewingEmployee.code}</p>
              </div>
              <Badge status={viewingEmployee.status} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Employee ID" value={viewingEmployee.id} />
              <DetailItem label="Employee Code" value={viewingEmployee.code} />
              <DetailItem label="Email" value={viewingEmployee.email} />
              <DetailItem label="Phone" value={viewingEmployee.phone} />
              <DetailItem
                label="Branch"
                value={
                  viewingOffice === undefined
                    ? 'Loading...'
                    : viewingOffice?.officeName || branchNameById[viewingOffice?.officeSettingId] || 'Not assigned'
                }
              />
              <DetailItem label="Expected Login Time" value={viewingEmployee.expectedLogin} />
              <DetailItem label="Expected Logout Time" value={viewingEmployee.expectedLogout} />
              <DetailItem label="Late Grace Minutes" value={viewingEmployee.lateGraceMinutes} />
              <DetailItem label="Status" value={viewingEmployee.status} />
              <DetailItem label="Created At" value={formatDateTime(viewingEmployee.createdAt)} />
              <DetailItem label="Updated At" value={formatDateTime(viewingEmployee.updatedAt)} />
            </div>
            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setViewingId(null)} className="w-full sm:w-auto">
                Close
              </Button>
              <Button
                type="button"
                variant="info"
                icon={FiEdit}
                className="w-full sm:w-auto"
                onClick={() => {
                  openEditModal(viewingEmployee)
                  setViewingId(null)
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}