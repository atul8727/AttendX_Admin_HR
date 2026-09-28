import { useEffect, useState } from 'react'
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

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Location name is required.'
  if (!Number.isFinite(Number(values.latitude)) || Number(values.latitude) < -90 || Number(values.latitude) > 90) errors.latitude = 'Enter a latitude between -90 and 90.'
  if (!Number.isFinite(Number(values.longitude)) || Number(values.longitude) < -180 || Number(values.longitude) > 180) errors.longitude = 'Enter a longitude between -180 and 180.'
  if (!Number.isFinite(Number(values.radiusMeters)) || Number(values.radiusMeters) <= 0) errors.radiusMeters = 'Enter a radius greater than 0 meters.'
  return errors
}

export default function WfhLocationModal({ employee, location, onClose }) {
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
    const nextErrors = validate(values)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    try {
      await saveWfhLocation({ employeeId: employee.apiId || employee.id, ...values }).unwrap()
      notify.success(location ? 'WFH location updated.' : 'WFH location saved.')
      onClose()
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'Could not save the WFH location.'))
    }
  }

  return (
    <Modal open title={location ? 'Edit WFH Location' : 'Set WFH Location'} onClose={isLoading ? () => {} : onClose} className="max-w-lg">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <p className="text-sm text-app-muted">{employee.name || 'Employee'}'s approved work-from-home check-in location.</p>
        <Field error={errors.name}><Input label="Location Name" value={values.name} onChange={(event) => update('name', event.target.value)} required autoFocus /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.latitude}><Input label="Latitude" type="number" step="any" value={values.latitude} onChange={(event) => update('latitude', event.target.value)} required /></Field>
          <Field error={errors.longitude}><Input label="Longitude" type="number" step="any" value={values.longitude} onChange={(event) => update('longitude', event.target.value)} required /></Field>
        </div>
        <Field error={errors.radiusMeters}><Input label="Radius (meters)" type="number" min="1" step="1" value={values.radiusMeters} onChange={(event) => update('radiusMeters', event.target.value)} required /></Field>
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Location'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ children, error }) {
  return <div>{children}{error && <p className="mt-1 text-xs font-semibold text-danger">{error}</p>}</div>
}
