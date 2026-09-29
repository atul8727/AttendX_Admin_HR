import { useEffect, useMemo, useState } from 'react'
import { FiCalendar, FiEdit, FiPlus, FiSun, FiTrash2 } from 'react-icons/fi'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Select from '../../components/ui/Select.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import Table from '../../components/ui/Table.jsx'
import {
  useAddHolidayMutation,
  useDeleteHolidayMutation,
  useGetHolidaysQuery,
  useUpdateHolidayMutation
} from '../../store/api/holidaysApi.js'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2].map((year) => ({
  label: String(year),
  value: String(year)
}))

const emptyForm = {
  date: '',
  name: '',
  holidayType: 'FULL_DAY',
  halfDayPeriod: 'FIRST_HALF'
}

function formatDisplayDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'short'
  }).format(new Date(`${value}T00:00:00`))
}

function getApiErrorMessage(error) {
  const message = error?.data?.message || error?.error || error?.message || ''
  if (message) return message
  if (error?.status === 409) {
    return 'A holiday already exists on this date. Please choose a different date or edit the existing holiday.'
  }
  return ''
}

export default function HolidayList() {
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const { data, isLoading, isFetching, isError, error, refetch } = useGetHolidaysQuery({ year, page, limit })
  const [addHoliday, addState] = useAddHolidayMutation()
  const [updateHoliday, updateState] = useUpdateHolidayMutation()
  const [deleteHoliday, deleteState] = useDeleteHolidayMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deletingHoliday, setDeletingHoliday] = useState(null)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    setPage(1)
  }, [year])

  const holidays = useMemo(() => data?.items || [], [data])
  const pagination = data?.pagination || { page: 1, limit, total: holidays.length, total_pages: 1 }
  const queryError = getApiErrorMessage(error)

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return holidays
    return holidays.filter((holiday) => holiday.name.toLowerCase().includes(query))
  }, [holidays, search])

  const stats = useMemo(() => {
    const fullDay = holidays.filter((holiday) => holiday.holidayType === 'FULL_DAY').length
    const halfDay = holidays.filter((holiday) => holiday.holidayType === 'HALF_DAY').length
    return { total: holidays.length, fullDay, halfDay }
  }, [holidays])

  const mutationError = addState.error || updateState.error
  const formError = localError || getApiErrorMessage(mutationError)

  function openCreateModal() {
    setLocalError('')
    addState.reset()
    updateState.reset()
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditModal(holiday) {
    setLocalError('')
    addState.reset()
    updateState.reset()
    setEditingId(holiday.id)
    setForm({
      date: holiday.date,
      name: holiday.name,
      holidayType: holiday.holidayType,
      halfDayPeriod: holiday.halfDayPeriod || 'FIRST_HALF'
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLocalError('')

    const duplicate = holidays.find((holiday) => holiday.date === form.date && holiday.id !== editingId)
    if (duplicate) {
      setLocalError(`"${duplicate.name}" is already added on ${formatDisplayDate(duplicate.date)}. Choose another date or edit that holiday.`)
      return
    }

    try {
      if (editingId) await updateHoliday({ id: editingId, ...form }).unwrap()
      else await addHoliday(form).unwrap()
      setModalOpen(false)
      refetch()
    } catch (err) {
      void err
    }
  }

  async function handleDelete() {
    if (!deletingHoliday) return
    try {
      await deleteHoliday(deletingHoliday.id).unwrap()
      setDeletingHoliday(null)
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
          <h1 className="text-xl font-black sm:text-2xl">Holiday Management</h1>
          <p className="text-sm text-app-muted">Plan and manage company-wide holidays for {year}.</p>
        </div>
        <Button icon={FiPlus} onClick={openCreateModal} className="w-full sm:w-auto">
          Add Holiday
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Holidays" value={stats.total} icon={FiCalendar} tone="primary" meta={`Year ${year}`} />
        <StatCard label="Full Day" value={stats.fullDay} icon={FiCalendar} tone="info" />
        <StatCard label="Half Day" value={stats.halfDay} icon={FiSun} tone="warning" />
      </div>

      <Card>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px]">
          <Input
            placeholder="Search holiday by name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={year} onChange={(event) => setYear(event.target.value)} options={YEAR_OPTIONS} />
        </div>

        {isError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{queryError}</p>}
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">Refreshing holidays...</p>}

        <Table
          rows={rows}
          columns={[
            { key: 'date', header: 'Date', render: (row) => <span className="font-semibold">{formatDisplayDate(row.date)}</span> },
            { key: 'name', header: 'Holiday' },
            { key: 'holidayType', header: 'Type', render: (row) => <Badge status={row.holidayTypeLabel} /> },
            {
              key: 'halfDayPeriod',
              header: 'Half Day Period',
              render: (row) => (row.holidayType === 'HALF_DAY' ? <Badge status={row.halfDayPeriodLabel} /> : '-')
            },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button variant="info" icon={FiEdit} className="px-3" onClick={() => openEditModal(row)} />
                  <Button
                    variant="danger"
                    icon={FiTrash2}
                    className="px-3"
                    onClick={() => setDeletingHoliday(row)}
                  />
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

      <Modal open={modalOpen} title={editingId ? 'Edit Holiday' : 'Add Holiday'} onClose={() => setModalOpen(false)} className="max-w-xl">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Holiday Date"
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              required
            />
            <Select
              label="Holiday Type"
              value={form.holidayType}
              onChange={(event) => setForm({ ...form, holidayType: event.target.value })}
              options={[
                { label: 'Full Day', value: 'FULL_DAY' },
                { label: 'Half Day', value: 'HALF_DAY' }
              ]}
            />
          </div>
          <Input
            label="Holiday Name"
            placeholder="Gandhi Jayanti"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          {form.holidayType === 'HALF_DAY' && (
            <Select
              label="Half Day Period"
              value={form.halfDayPeriod}
              onChange={(event) => setForm({ ...form, halfDayPeriod: event.target.value })}
              options={[
                { label: 'First Half', value: 'FIRST_HALF' },
                { label: 'Second Half', value: 'SECOND_HALF' }
              ]}
            />
          )}
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={addState.isLoading || updateState.isLoading} className="w-full sm:w-auto">
              {editingId ? 'Save Changes' : 'Create Holiday'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deletingHoliday)} title="Delete Holiday" onClose={() => setDeletingHoliday(null)} className="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-app-text">
            Are you sure you want to delete <span className="font-bold">{deletingHoliday?.name}</span> on{' '}
            <span className="font-bold">{formatDisplayDate(deletingHoliday?.date)}</span>? This action cannot be undone.
          </p>
          {deleteState.error && (
            <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(deleteState.error)}</p>
          )}
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setDeletingHoliday(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="button" variant="danger" icon={FiTrash2} disabled={deleteState.isLoading} onClick={handleDelete} className="w-full sm:w-auto">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}