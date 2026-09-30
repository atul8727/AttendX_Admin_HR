import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiExternalLink, FiNavigation } from 'react-icons/fi'
import Button from '../../../components/ui/Button.jsx'
import Input from '../../../components/ui/Input.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Select from '../../../components/ui/Select.jsx'
import { useGeolocation } from '../../../hooks/useGeolocation.js'
import { getApiErrorMessage } from '../../../lib/apiError.js'
import OfficeMapPicker from './OfficeMapPicker.jsx'
import { DEFAULT_OFFICE_FORM, TIMEZONE_OPTIONS, getMapsUrl, getWeekdayOptions, toFormValues, validateOfficeForm } from '../officeUtils.js'

function Field({ error, hint, children }) {
  return (
    <div>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-semibold text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-app-muted">{hint}</p>
      )}
    </div>
  )
}

// office = null  -> naya office; office = {...} -> edit.
// Modal sirf open hone par mount hota hai, isliye har baar form fresh state se shuru hota hai.
export default function OfficeFormModal({ office = null, onClose, onSubmit }) {
  const { t } = useTranslation('offices')
  const isEdit = Boolean(office)
  const [values, setValues] = useState(() => (office ? toFormValues(office) : DEFAULT_OFFICE_FORM))
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  // Location fetch ka logic shared hook me hai (messages bhi wahin se translate hote hain).
  const handleLocated = useCallback(({ latitude, longitude }) => {
    setValues((current) => ({ ...current, latitude, longitude }))
    setErrors((current) => ({ ...current, latitude: undefined, longitude: undefined }))
  }, [])
  const { locate, locating, message: geoMessage } = useGeolocation(handleLocated)

  const weekdayOptions = useMemo(() => getWeekdayOptions(t), [t])
  const timezoneOptions = useMemo(
    () => (TIMEZONE_OPTIONS.some((option) => option.value === values.timezone) ? TIMEZONE_OPTIONS : [{ value: values.timezone, label: values.timezone }, ...TIMEZONE_OPTIONS]),
    [values.timezone]
  )

  const hasValidCoordinates = !errors.latitude && !errors.longitude && values.latitude !== '' && values.longitude !== '' && Number.isFinite(Number(values.latitude)) && Number.isFinite(Number(values.longitude))

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateOfficeForm(values, t)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setSubmitError('')
    try {
      await onSubmit(values)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, t('form.saveFailed')))
      setSaving(false)
    }
  }

  return (
    <Modal open title={isEdit ? t('form.editTitle') : t('form.addTitle')} onClose={saving ? () => {} : onClose} className="max-w-2xl">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {submitError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{submitError}</p>}

        <Field error={errors.name}>
          <Input label={t('form.name')} placeholder={t('form.namePlaceholder')} value={values.name} onChange={(event) => setField('name', event.target.value)} autoFocus />
        </Field>

        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-app-text">{t('form.location')}</p>
              <p className="text-xs text-app-muted">{t('form.locationHint')}</p>
            </div>
            <Button type="button" variant="ghost" icon={FiNavigation} onClick={locate} disabled={locating} className="w-full sm:w-auto">
              {locating ? t('form.locating') : t('form.useMyLocation')}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field error={errors.latitude}>
              <Input label={t('form.latitude')} type="number" step="any" placeholder="28.570800" value={values.latitude} onChange={(event) => setField('latitude', event.target.value)} />
            </Field>
            <Field error={errors.longitude}>
              <Input label={t('form.longitude')} type="number" step="any" placeholder="77.326000" value={values.longitude} onChange={(event) => setField('longitude', event.target.value)} />
            </Field>
          </div>
          {geoMessage && <p className="mt-2 text-xs font-semibold text-app-muted">{geoMessage}</p>}
          <div className="mt-3">
            <OfficeMapPicker
              latitude={values.latitude}
              longitude={values.longitude}
              radius={values.allowedRadius}
              onChange={(latitude, longitude) => {
                setValues((current) => ({ ...current, latitude, longitude }))
                setErrors((current) => ({ ...current, latitude: undefined, longitude: undefined }))
              }}
            />
          </div>
          {hasValidCoordinates && (
            <a
              href={getMapsUrl(values.latitude, values.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              {t('form.checkOnMaps')} <FiExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.allowedRadius} hint={t('form.allowedRadiusHint')}>
            <Input label={t('form.allowedRadius')} type="number" min="1" placeholder="100" value={values.allowedRadius} onChange={(event) => setField('allowedRadius', event.target.value)} />
          </Field>
          <Field error={errors.maxGpsAccuracy} hint={t('form.maxGpsAccuracyHint')}>
            <Input label={t('form.maxGpsAccuracy')} type="number" min="1" placeholder="50" value={values.maxGpsAccuracy} onChange={(event) => setField('maxGpsAccuracy', event.target.value)} />
          </Field>
          <Field error={errors.weeklyOff}>
            <Select label={t('form.weeklyOff')} value={values.weeklyOff} onChange={(event) => setField('weeklyOff', event.target.value)} options={weekdayOptions} />
          </Field>
          <Field error={errors.timezone}>
            <Select label={t('form.timezone')} value={values.timezone} onChange={(event) => setField('timezone', event.target.value)} options={timezoneOptions} />
          </Field>
        </div>

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? t('form.saving') : isEdit ? t('form.saveChanges') : t('form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}