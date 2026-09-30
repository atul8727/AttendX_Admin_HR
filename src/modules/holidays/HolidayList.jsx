import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
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
import { getApiErrorMessage } from '../../lib/apiError.js'
import { useFormatters } from '../../lib/format.js'
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

export default function HolidayList() {
  const { t } = useTranslation('holidays')
  const fmt = useFormatters()
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

  // Date-only value (YYYY-MM-DD) ko current language me dikhata hai, jaise "Thu, 24 Sept 2026".
  // T00:00:00 local time me parse hota hai, isliye timezone ki wajah se din nahi khisakta.
  function formatDisplayDate(value) {
    if (!value) return '-'
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return '-'
    return fmt.date(date, { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })
  }

  // Backend ka message ho to wahi dikhate hain. Message na ho aur status 409 ho to duplicate-date ka translated message.
  function getErrorMessage(err) {
    return getApiErrorMessage(err, err?.status === 409 ? t('errors.duplicateDate') : undefined)
  }

  useEffect(() => {
    setPage(1)
  }, [year])

  const holidays = useMemo(() => data?.items || [], [data])
  const pagination = data?.pagination || { page: 1, limit, total: holidays.length, total_pages: 1 }
  const queryError = isError ? getErrorMessage(error) : ''

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
  const formError = localError || (mutationError ? getErrorMessage(mutationError) : '')

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
      setLocalError(t('form.duplicate', { name: duplicate.name, date: formatDisplayDate(duplicate.date) }))
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
          <h1 className="text-xl font-black sm:text-2xl">{t('list.title')}</h1>
          <p className="text-sm text-app-muted">{t('list.subtitle', { year })}</p>
        </div>
        <Button icon={FiPlus} onClick={openCreateModal} className="w-full sm:w-auto">
          {t('list.add')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('list.stats.total')} value={stats.total} icon={FiCalendar} tone="primary" meta={t('list.stats.year', { year })} />
        <StatCard label={t('list.stats.fullDay')} value={stats.fullDay} icon={FiCalendar} tone="info" />
        <StatCard label={t('list.stats.halfDay')} value={stats.halfDay} icon={FiSun} tone="warning" />
      </div>

      <Card>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px]">
          <Input
            placeholder={t('list.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={year} onChange={(event) => setYear(event.target.value)} options={YEAR_OPTIONS} />
        </div>

        {isError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{queryError}</p>}
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">{t('list.refreshing')}</p>}

        <Table
          rows={rows}
          columns={[
            { key: 'date', header: t('list.columns.date'), render: (row) => <span className="font-semibold">{formatDisplayDate(row.date)}</span> },
            { key: 'name', header: t('list.columns.holiday') },
            { key: 'holidayType', header: t('list.columns.type'), render: (row) => <Badge status={row.holidayTypeLabel} /> },
            {
              key: 'halfDayPeriod',
              header: t('list.columns.halfDayPeriod'),
              render: (row) => (row.holidayType === 'HALF_DAY' ? <Badge status={row.halfDayPeriodLabel} /> : '-')
            },
            { key: 'status', header: t('list.columns.status'), render: (row) => <Badge status={row.status} /> },
            {
              key: 'actions',
              header: t('list.columns.actions'),
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="info"
                    icon={FiEdit}
                    className="px-3"
                    aria-label={t('list.editAria', { name: row.name })}
                    onClick={() => openEditModal(row)}
                  />
                  <Button
                    variant="danger"
                    icon={FiTrash2}
                    className="px-3"
                    aria-label={t('list.deleteAria', { name: row.name })}
                    onClick={() => setDeletingHoliday(row)}
                  />
                </div>
              )
            }
          ]}
        />

        <div className="mt-4 flex flex-col gap-3 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t('common:pagination.summary', { page: pagination.page, totalPages: pagination.total_pages, shown: rows.length, total: pagination.total })}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              {t('common:actions.previous')}
            </Button>
            <Button
              variant="ghost"
              disabled={page >= pagination.total_pages || isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('common:actions.next')}
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={modalOpen} title={editingId ? t('form.editTitle') : t('form.addTitle')} onClose={() => setModalOpen(false)} className="max-w-xl">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('form.date')}
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              required
            />
            <Select
              label={t('form.type')}
              value={form.holidayType}
              onChange={(event) => setForm({ ...form, holidayType: event.target.value })}
              options={[
                { label: t('status:fullDay'), value: 'FULL_DAY' },
                { label: t('status:halfDay'), value: 'HALF_DAY' }
              ]}
            />
          </div>
          <Input
            label={t('form.name')}
            placeholder={t('form.namePlaceholder')}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          {form.holidayType === 'HALF_DAY' && (
            <Select
              label={t('form.halfDayPeriod')}
              value={form.halfDayPeriod}
              onChange={(event) => setForm({ ...form, halfDayPeriod: event.target.value })}
              options={[
                { label: t('status:firstHalf'), value: 'FIRST_HALF' },
                { label: t('status:secondHalf'), value: 'SECOND_HALF' }
              ]}
            />
          )}
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={addState.isLoading || updateState.isLoading} className="w-full sm:w-auto">
              {editingId ? t('form.save') : t('form.create')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deletingHoliday)} title={t('delete.title')} onClose={() => setDeletingHoliday(null)} className="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-app-text">
            <Trans
              i18nKey="delete.confirm"
              ns="holidays"
              values={{ name: deletingHoliday?.name, date: formatDisplayDate(deletingHoliday?.date) }}
              components={{ b: <span className="font-bold" /> }}
            />
          </p>
          {deleteState.error && (
            <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getErrorMessage(deleteState.error)}</p>
          )}
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setDeletingHoliday(null)} className="w-full sm:w-auto">
              {t('common:actions.cancel')}
            </Button>
            <Button type="button" variant="danger" icon={FiTrash2} disabled={deleteState.isLoading} onClick={handleDelete} className="w-full sm:w-auto">
              {t('delete.submit')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}