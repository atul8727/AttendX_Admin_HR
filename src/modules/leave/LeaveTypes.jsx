import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FiEdit, FiPlus, FiPower, FiUsers } from 'react-icons/fi'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import Table from '../../components/ui/Table.jsx'
import { getApiErrorMessage } from '../../lib/apiError.js'
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

export default function LeaveTypes() {
  const { t } = useTranslation('leave')
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
  const queryError = isError ? getApiErrorMessage(error) : ''
  const mutationError = addState.error || updateState.error
  const formError = mutationError ? getApiErrorMessage(mutationError) : ''

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
      if (result.failed > 0) notify.error(t('types.notice.assignFailed', { label, count: result.failed }))
      else if (result.created === 0) notify.success(t('types.notice.alreadyAssigned', { label, count: result.employees }))
      else notify.success(t('types.notice.assigned', { label, count: result.employees }))
    } catch (err) {
      notify.error(err.message || t('types.notice.assignError'))
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
      notify.success(t('types.notice.created', { name: form.name }))
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
        notify.success(t('types.notice.activated', { name: leaveType.name }))
        // Make sure every employee has a balance for this type so they can apply right away.
        await assignInBackground([leaveType.id], leaveType.name)
      } else {
        notify.success(t('types.notice.deactivated', { name: leaveType.name }))
      }
    } catch (err) {
      notify.error(getApiErrorMessage(err, t('types.notice.statusFailed')))
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
          <h1 className="text-xl font-black sm:text-2xl">{t('types.title')}</h1>
          <p className="text-sm text-app-muted">{t('types.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" icon={FiUsers} onClick={() => setAssignOpen(true)} disabled={activeTypes.length === 0} className="w-full sm:w-auto">
            {t('types.assignAll')}
          </Button>
          <Button icon={FiPlus} onClick={openCreateModal} className="w-full sm:w-auto">
            {t('types.add')}
          </Button>
        </div>
      </div>

      <LeaveSubNav />

      <Card>
        {showProgress && (
          <div className="mb-4 space-y-2 rounded-lg border border-primary/15 bg-app-bg p-3">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>{assignment.state.phase === 'scanning' ? t('types.progress.scanning') : t('types.progress.assigning')}</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <ProgressBar value={assignment.state.done} max={assignment.state.total || 1} />
          </div>
        )}
        {isError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{queryError}</p>}
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">{t('types.refreshing')}</p>}

        <Table
          rows={rows}
          columns={[
            { key: 'name', header: t('types.columns.type') },
            { key: 'code', header: t('types.columns.code') },
            { key: 'defaultAnnualDays', header: t('types.columns.annualQuota'), render: (row) => t('common.days', { count: row.defaultAnnualDays }) },
            { key: 'status', header: t('types.columns.status'), render: (row) => <Badge status={row.status} /> },
            {
              key: 'visibility',
              header: t('types.columns.employeeView'),
              render: (row) => (
                <span className={`text-xs font-semibold ${row.status === 'Active' ? 'text-success' : 'text-app-muted'}`}>
                  {row.status === 'Active' ? t('types.visible') : t('types.hidden')}
                </span>
              )
            },
            {
              key: 'actions',
              header: t('types.columns.actions'),
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="info"
                    icon={FiEdit}
                    className="px-3"
                    aria-label={t('types.editAria', { name: row.name })}
                    onClick={() => openEditModal(row)}
                  />
                  <Button
                    variant={row.status === 'Active' ? 'danger' : 'success'}
                    icon={FiPower}
                    disabled={togglingId === row.id}
                    onClick={() => handleToggle(row)}
                  >
                    {row.status === 'Active' ? t('types.deactivate') : t('types.activate')}
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Create / Edit */}
      <Modal open={modalOpen} title={editingId ? t('types.form.editTitle') : t('types.form.addTitle')} onClose={() => setModalOpen(false)} className="max-w-lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{formError}</p>}
          <Input
            label={t('types.form.name')}
            placeholder={t('types.form.namePlaceholder')}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('types.form.code')}
              placeholder={t('types.form.codePlaceholder')}
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
              disabled={Boolean(editingId)}
              required
            />
            <Input
              label={t('types.form.defaultAnnualDays')}
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
                <span className="block font-bold text-app-text">{t('types.form.assignToAll')}</span>
                <span className="text-xs text-app-muted">{t('types.form.assignToAllHint', { year: CURRENT_YEAR })}</span>
              </span>
            </label>
          )}

          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={addState.isLoading || updateState.isLoading} className="w-full sm:w-auto">
              {editingId ? t('common.saveChanges') : t('types.form.create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate confirmation */}
      <Modal open={Boolean(deactivating)} title={t('types.deactivateModal.title')} onClose={() => setDeactivating(null)} className="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-app-muted">
            <Trans
              i18nKey="types.deactivateModal.body"
              ns="leave"
              values={{ name: deactivating?.name }}
              components={{ b: <b className="text-app-text" /> }}
            />
          </p>
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setDeactivating(null)} className="w-full sm:w-auto">
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={togglingId === deactivating?.id}
              onClick={() => changeStatus(deactivating, false)}
              className="w-full sm:w-auto"
            >
              {t('types.deactivateModal.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      <AssignAllModal open={assignOpen} onClose={() => setAssignOpen(false)} activeTypes={activeTypes} assignment={assignment} defaultYear={CURRENT_YEAR} />
    </div>
  )
}