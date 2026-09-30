import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import { OVERRIDE_STATUS_OPTIONS } from '../../constants/attendanceOverride.js'
import { getApiErrorMessage } from '../../lib/apiError.js'
import { useCreateAttendanceOverrideMutation } from '../../store/api/attendanceOverridesApi.js'
import { useGetEmployeesQuery } from '../../store/api/employeesApi.js'

const EMPTY_FORM = { employeeId: '', attendanceDate: '', status: 'ABSENT', reason: '' }

export default function AttendanceCorrection() {
  const { t } = useTranslation('attendance')
  const [form, setForm] = useState(EMPTY_FORM)
  const [feedback, setFeedback] = useState(null)
  const { data: employeePage, isLoading: employeesLoading } = useGetEmployeesQuery({ page: 1, limit: 100 })
  const [createOverride, { isLoading: isSaving }] = useCreateAttendanceOverrideMutation()

  const employeeOptions = [
    { value: '', label: employeesLoading ? t('correction.loadingEmployees') : t('correction.selectEmployee') },
    ...(employeePage?.items || []).map((employee) => ({ value: employee.id, label: `${employee.name} (${employee.code})` }))
  ]

  const statusOptions = OVERRIDE_STATUS_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey, { defaultValue: option.label }) }))

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)
    try {
      await createOverride(form).unwrap()
      setFeedback({ type: 'success', message: t('correction.saved') })
      setForm(EMPTY_FORM)
    } catch (err) {
      setFeedback({ type: 'error', message: getApiErrorMessage(err, t('correction.saveFailed')) })
    }
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black sm:text-2xl">{t('correction.title')}</h1>
        <Link to="/attendance" className="text-sm font-semibold text-primary hover:underline">
          {t('correction.viewAll')}
        </Link>
      </div>

      {feedback && (
        <p
          className={`mb-4 rounded-lg p-3 text-sm font-semibold ${
            feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}
        >
          {feedback.message}
        </p>
      )}

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Select
          label={t('correction.employee')}
          value={form.employeeId}
          onChange={(event) => update('employeeId', event.target.value)}
          options={employeeOptions}
          required
        />
        <Input
          label={t('correction.date')}
          type="date"
          value={form.attendanceDate}
          onChange={(event) => update('attendanceDate', event.target.value)}
          required
        />
        <Select
          label={t('correction.status')}
          value={form.status}
          onChange={(event) => update('status', event.target.value)}
          options={statusOptions}
        />
        <div className="md:col-span-2">
          <Input
            label={t('correction.reason')}
            value={form.reason}
            onChange={(event) => update('reason', event.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="warning" className="md:col-span-2" disabled={isSaving}>
          {isSaving ? t('correction.saving') : t('correction.submit')}
        </Button>
      </form>
    </Card>
  )
}