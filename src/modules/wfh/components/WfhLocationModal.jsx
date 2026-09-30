import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../../../components/ui/Button.jsx'
import Input from '../../../components/ui/Input.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { getApiErrorMessage } from '../../../lib/apiError.js'
import { notify } from '../../../lib/notify.js'
import { useSaveWfhLocationMutation } from '../../../store/api/wfhApi.js'

function getInitialValues(location) {
  return {
    name: location?.name || '',
    latitude: location?.latitude == null ? '' : String(location.latitude),
    longitude: location?.longitude == null ? '' : String(location.longitude),
    radiusMeters: location?.radiusMeters == null ? '' : String(location.radiusMeters)
  }
}

function validate(values, t) {
  const errors = {}
  if (!values.name.trim()) errors.name = t('modal.errors.name')
  if (!Number.isFinite(Number(values.latitude)) || Number(values.latitude) < -90 || Number(values.latitude) > 90) errors.latitude = t('modal.errors.latitude')
  if (!Number.isFinite(Number(values.longitude)) || Number(values.longitude) < -180 || Number(values.longitude) > 180) errors.longitude = t('modal.errors.longitude')
  if (!Number.isFinite(Number(values.radiusMeters)) || Number(values.radiusMeters) <= 0) errors.radiusMeters = t('modal.errors.radius')
  return errors
}

export default function WfhLocationModal({ employee, location, onClose }) {
  const { t } = useTranslation('wfh')
  const [values, setValues] = useState(() => getInitialValues(location))
  const [errors, setErrors] = useState({})
  const [saveWfhLocation, { isLoading }] = useSaveWfhLocationMutation()

  useEffect(() => {
    setValues(getInitialValues(location))
    setErrors({})
  }, [location, employee.id])

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values, t)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    try {
      await saveWfhLocation({ employeeId: employee.apiId || employee.id, ...values }).unwrap()
      notify.success(location ? t('modal.updated') : t('modal.saved'))
      onClose()
    } catch (error) {
      notify.error(getApiErrorMessage(error, t('modal.saveFailed')))
    }
  }

  return (
    <Modal open title={location ? t('modal.editTitle') : t('modal.setTitle')} onClose={isLoading ? () => {} : onClose} className="max-w-lg">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <p className="text-sm text-app-muted">{t('modal.subtitle', { name: employee.name || t('modal.employeeFallback') })}</p>
        <Field error={errors.name}>
          <Input label={t('modal.locationName')} value={values.name} onChange={(event) => update('name', event.target.value)} required autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.latitude}>
            <Input label={t('modal.latitude')} type="number" step="any" value={values.latitude} onChange={(event) => update('latitude', event.target.value)} required />
          </Field>
          <Field error={errors.longitude}>
            <Input label={t('modal.longitude')} type="number" step="any" value={values.longitude} onChange={(event) => update('longitude', event.target.value)} required />
          </Field>
        </div>
        <Field error={errors.radiusMeters}>
          <Input label={t('modal.radius')} type="number" min="1" step="1" value={values.radiusMeters} onChange={(event) => update('radiusMeters', event.target.value)} required />
        </Field>
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('modal.saving') : t('modal.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ children, error }) {
  return (
    <div>
      {children}
      {error && <p className="mt-1 text-xs font-semibold text-danger">{error}</p>}
    </div>
  )
}