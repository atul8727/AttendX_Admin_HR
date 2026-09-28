import { useMemo, useState } from 'react'
import { FiExternalLink, FiNavigation } from 'react-icons/fi'
import Button from '../../../components/ui/Button.jsx'
import Input from '../../../components/ui/Input.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Select from '../../../components/ui/Select.jsx'
import OfficeMapPicker from './OfficeMapPicker.jsx'
import {
  DEFAULT_OFFICE_FORM,
  TIMEZONE_OPTIONS,
  WEEKDAY_OPTIONS,
  getApiErrorMessage,
  getMapsUrl,
  toFormValues,
  validateOfficeForm
} from '../officeUtils.js'

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
  const isEdit = Boolean(office)
  const [values, setValues] = useState(() => (office ? toFormValues(office) : DEFAULT_OFFICE_FORM))
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoMessage, setGeoMessage] = useState('')

  const timezoneOptions = useMemo(
    () => (TIMEZONE_OPTIONS.some((option) => option.value === values.timezone) ? TIMEZONE_OPTIONS : [{ value: values.timezone, label: values.timezone }, ...TIMEZONE_OPTIONS]),
    [values.timezone]
  )

  const hasValidCoordinates = !errors.latitude && !errors.longitude && values.latitude !== '' && values.longitude !== '' && Number.isFinite(Number(values.latitude)) && Number.isFinite(Number(values.longitude))

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }

  function useMyLocation() {
    if (!window.navigator.geolocation) {
      setGeoMessage('Is browser mein location support nahi hai.')
      return
    }
    setLocating(true)
    setGeoMessage('')
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        setValues((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }))
        setErrors((current) => ({ ...current, latitude: undefined, longitude: undefined }))
        setGeoMessage(`Location mil gayi (accuracy ~${Math.round(position.coords.accuracy)} m).`)
        setLocating(false)
      },
      (error) => {
        setGeoMessage(error.code === 1 ? 'Location permission deny hui. Browser settings mein allow karo.' : 'Location nahi mil paayi. Dobara try karo.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateOfficeForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setSubmitError('')
    try {
      await onSubmit(values)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error) || 'Office save nahi ho paya. Dobara try karo.')
      setSaving(false)
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit Office' : 'Add Office'} onClose={saving ? () => {} : onClose} className="max-w-2xl">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {submitError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{submitError}</p>}

        <Field error={errors.name}>
          <Input label="Office Name" placeholder="e.g. Noida Branch" value={values.name} onChange={(event) => setField('name', event.target.value)} autoFocus />
        </Field>

        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-app-text">Location</p>
              <p className="text-xs text-app-muted">Attendance isi point ke around geofence se verify hogi.</p>
            </div>
            <Button type="button" variant="ghost" icon={FiNavigation} onClick={useMyLocation} disabled={locating} className="w-full sm:w-auto">
              {locating ? 'Locating...' : 'Use my location'}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field error={errors.latitude}>
              <Input label="Latitude" type="number" step="any" placeholder="28.570800" value={values.latitude} onChange={(event) => setField('latitude', event.target.value)} />
            </Field>
            <Field error={errors.longitude}>
              <Input label="Longitude" type="number" step="any" placeholder="77.326000" value={values.longitude} onChange={(event) => setField('longitude', event.target.value)} />
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
              Google Maps par check karo <FiExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.allowedRadius} hint="Office se kitni door tak check-in allowed hai.">
            <Input label="Allowed Radius (meters)" type="number" min="1" placeholder="100" value={values.allowedRadius} onChange={(event) => setField('allowedRadius', event.target.value)} />
          </Field>
          <Field error={errors.maxGpsAccuracy} hint="Isse kharab GPS accuracy wali check-in reject hogi.">
            <Input label="Max GPS Accuracy (meters)" type="number" min="1" placeholder="50" value={values.maxGpsAccuracy} onChange={(event) => setField('maxGpsAccuracy', event.target.value)} />
          </Field>
          <Field error={errors.weeklyOff}>
            <Select label="Weekly Off" value={values.weeklyOff} onChange={(event) => setField('weeklyOff', event.target.value)} options={WEEKDAY_OPTIONS} />
          </Field>
          <Field error={errors.timezone}>
            <Select label="Timezone" value={values.timezone} onChange={(event) => setField('timezone', event.target.value)} options={timezoneOptions} />
          </Field>
        </div>

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Office'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}