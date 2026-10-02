import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from '../../../components/ui/Avatar.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Input from '../../../components/ui/Input.jsx'
import Select from '../../../components/ui/Select.jsx'
import { OVERRIDE_STATUS_OPTIONS, toBadgeLabel } from '../../../constants/attendanceOverride.js'
import { getApiErrorMessage } from '../../../lib/apiError.js'
import { notify } from '../../../lib/notify.js'
import { useCreateAttendanceOverrideMutation } from '../../../store/api/attendanceOverridesApi.js'
import { useGetEmployeeQuery, useGetEmployeesQuery } from '../../../store/api/employeesApi.js'

const REASON_MAX_LENGTH = 255

/**
 * Override form (OverridePickerModal ke andar step 2 me dikhta hai).
 * `initial`: { employeeId, attendanceDate, status, originalStatus } - employee aur date lock rehte hain.
 */
function LockedEmployee({ employeeId }) {
  const { t } = useTranslation('attendance')
  const { data: employee } = useGetEmployeeQuery(employeeId, { skip: !employeeId })
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-app-text">{t('modal.employee')}</span>
      <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-app-bg/60 p-3">
        <Avatar name={employee?.name || String(employeeId)} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-app-text">{employee?.name || t('list.employeeFallback', { id: employeeId })}</p>
          <p className="truncate text-xs text-app-muted">{employee?.code || t('list.idLabel', { id: employeeId })}</p>
        </div>
      </div>
    </div>
  )
}

export function OverrideForm({ initial, locked, onClose, onBack }) {
  const { t } = useTranslation('attendance')
  const [form, setForm] = useState({
    employeeId: initial.employeeId ? String(initial.employeeId) : '',
    attendanceDate: initial.attendanceDate || '',
    status: initial.status || 'ABSENT',
    reason: initial.reason || ''
  })
  const [error, setError] = useState('')
  const [createOverride, { isLoading: isSaving }] = useCreateAttendanceOverrideMutation()
  const { data: employeePage, isLoading: employeesLoading } = useGetEmployeesQuery({ page: 1, limit: 100 }, { skip: locked })

  const employeeOptions = [
    { value: '', label: employeesLoading ? t('correction.loadingEmployees') : t('correction.selectEmployee') },
    ...(employeePage?.items || []).map((employee) => ({ value: employee.id, label: `${employee.name} (${employee.code})` }))
  ]
  const statusOptions = OVERRIDE_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey, { defaultValue: option.label })
  }))

  const reasonTrimmed = form.reason.trim()
  const canSubmit = Boolean(form.employeeId && form.attendanceDate && form.status && reasonTrimmed) && !isSaving

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return
    setError('')
    try {
      await createOverride({ ...form, reason: reasonTrimmed }).unwrap()
      notify.success(t('modal.saved'))
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, t('modal.saveFailed')))
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}

      {locked ? (
        <LockedEmployee employeeId={form.employeeId} />
      ) : (
        <Select label={t('modal.employee')} value={form.employeeId} onChange={(event) => update('employeeId', event.target.value)} options={employeeOptions} required />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('modal.date')}
          type="date"
          value={form.attendanceDate}
          onChange={(event) => update('attendanceDate', event.target.value)}
          disabled={locked}
          required
        />
        {initial.originalStatus ? (
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-app-text">{t('modal.reportStatus')}</span>
            <div className="flex min-h-10 items-center">
              <Badge status={toBadgeLabel(initial.originalStatus)} />
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>

      <Select label={t('modal.newStatus')} value={form.status} onChange={(event) => update('status', event.target.value)} options={statusOptions} required />

      <div>
        <label className="block text-sm font-semibold text-app-text">
          <span className="mb-1.5 block">{t('modal.reason')}</span>
          <textarea
            rows={3}
            maxLength={REASON_MAX_LENGTH}
            value={form.reason}
            onChange={(event) => update('reason', event.target.value)}
            placeholder={t('modal.reasonPlaceholder')}
            required
            className="w-full resize-none rounded-lg border border-primary/15 bg-app-bg px-3 py-2 text-app-text outline-none transition placeholder:text-app-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <p className="mt-1 text-end text-xs text-app-muted">
          {form.reason.length}/{REASON_MAX_LENGTH}
        </p>
      </div>

      <p className="rounded-lg bg-primary/5 p-3 text-xs text-app-muted">{t('modal.note')}</p>

      <div className="flex justify-end gap-2">
        {onBack && (
          <Button type="button" variant="ghost" className="me-auto" onClick={onBack}>
            {t('picker.back')}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onClose}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" variant="warning" disabled={!canSubmit}>
          {isSaving ? t('modal.saving') : t('modal.save')}
        </Button>
      </div>
    </form>
  )
}