import { useMemo, useState } from 'react'
import { FiEdit, FiPlus, FiPower } from 'react-icons/fi'
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
import { useFetch } from '../../hooks/useFetch.js'
import { createEmployee, getEmployees, toggleEmployeeStatus, updateEmployee } from '../../services/employeeService.js'
import { getOffices } from '../../services/officeService.js'

const emptyForm = {
  code: '',
  name: '',
  email: '',
  phone: '',
  role: '',
  department: '',
  office: 'Noida HQ',
  expectedLogin: '09:30',
  expectedLogout: '18:30',
  wfh: 'Enabled',
  status: 'Active',
  wfhLocation: { latitude: '', longitude: '', radius: 150 }
}

export default function EmployeeList() {
  const { data, loading, error, refetch } = useFetch(getEmployees)
  const { data: offices } = useFetch(getOffices)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [office, setOffice] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const debounced = useDebounce(search)

  const rows = useMemo(() => {
    if (!data) return []
    return data.filter((employee) => {
      const matchesSearch = `${employee.name} ${employee.code} ${employee.email}`.toLowerCase().includes(debounced.toLowerCase())
      const matchesStatus = status === 'All' || employee.status === status
      const matchesOffice = office === 'All' || employee.office === office
      return matchesSearch && matchesStatus && matchesOffice
    })
  }, [data, debounced, status, office])

  const officeOptions = [
    { label: 'All Offices', value: 'All' },
    ...(offices || []).map((item) => ({ label: item.name, value: item.name }))
  ]

  function openCreateModal() {
    setEditingId(null)
    setForm({ ...emptyForm, code: `EMP${String((data?.length || 0) + 1).padStart(3, '0')}` })
    setFormError('')
    setModalOpen(true)
  }

  function openEditModal(employee) {
    setEditingId(employee.id)
    setForm({ ...emptyForm, ...employee, wfhLocation: employee.wfhLocation || emptyForm.wfhLocation })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    try {
      if (editingId) await updateEmployee(editingId, form)
      else await createEmployee(form)
      setModalOpen(false)
      await refetch()
    } catch (err) {
      setFormError(err.message)
    }
  }

  async function handleToggle(employee) {
    await toggleEmployeeStatus(employee.id)
    await refetch()
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-black">Employee Management</h1>
          <p className="text-sm text-app-muted">
            {data.length} employees - Office assignment, WFH and timing configuration.
          </p>
        </div>
        <Button icon={FiPlus} onClick={openCreateModal}>
          Add Employee
        </Button>
      </div>

      <Card>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_220px]">
          <Input placeholder="Search by name or code..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { label: 'All Status', value: 'All' },
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' }
            ]}
          />
          <Select value={office} onChange={(event) => setOffice(event.target.value)} options={officeOptions} />
        </div>
        {error && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
        <Table
          rows={rows}
          columns={[
            {
              key: 'name',
              header: 'Employee',
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
            { key: 'code', header: 'Code' },
            { key: 'office', header: 'Office' },
            { key: 'expectedLogin', header: 'Expected Login' },
            { key: 'wfh', header: 'WFH', render: (row) => <Badge status={row.wfh} /> },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex gap-2">
                  <Button variant="info" icon={FiEdit} onClick={() => openEditModal(row)}>
                    Edit
                  </Button>
                  <Button
                    variant={row.status === 'Active' ? 'danger' : 'success'}
                    icon={FiPower}
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

      <Modal open={modalOpen} title={editingId ? 'Edit Employee' : 'Add Employee'} onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{formError}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Employee Code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
            <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            <Input label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
            <Input label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
            <Input label="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
            <Select
              label="Assigned Office"
              value={form.office}
              onChange={(event) => setForm({ ...form, office: event.target.value })}
              options={(offices || []).map((item) => ({ label: item.name, value: item.name }))}
            />
            <Select
              label="WFH"
              value={form.wfh}
              onChange={(event) => setForm({ ...form, wfh: event.target.value })}
              options={[
                { label: 'Enabled', value: 'Enabled' },
                { label: 'Disabled', value: 'Disabled' }
              ]}
            />
            <Input
              label="Expected Login"
              type="time"
              value={form.expectedLogin}
              onChange={(event) => setForm({ ...form, expectedLogin: event.target.value })}
            />
            <Input
              label="Expected Logout"
              type="time"
              value={form.expectedLogout}
              onChange={(event) => setForm({ ...form, expectedLogout: event.target.value })}
            />
            <Input
              label="WFH Latitude"
              value={form.wfhLocation.latitude}
              onChange={(event) =>
                setForm({ ...form, wfhLocation: { ...form.wfhLocation, latitude: event.target.value } })
              }
            />
            <Input
              label="WFH Longitude"
              value={form.wfhLocation.longitude}
              onChange={(event) =>
                setForm({ ...form, wfhLocation: { ...form.wfhLocation, longitude: event.target.value } })
              }
            />
            <Input
              label="WFH Radius"
              type="number"
              value={form.wfhLocation.radius}
              onChange={(event) =>
                setForm({ ...form, wfhLocation: { ...form.wfhLocation, radius: Number(event.target.value) } })
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingId ? 'Save Changes' : 'Create Employee'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
