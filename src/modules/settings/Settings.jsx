import { useEffect, useState } from 'react'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Stepper from '../../components/ui/Stepper.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getSettings, updateSettings } from '../../services/settingsService.js'

export default function Settings() {
  const { data, loading, refetch } = useFetch(getSettings)
  const [settings, setSettings] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setSettings(data)
  }, [data])

  async function handleSave() {
    await updateSettings(settings)
    await refetch()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  if (loading || !settings) return <Loader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">System Configuration</h1>
        <p className="text-sm text-app-muted">Global business-rule values.</p>
      </div>
      <Card>
        <div className="divide-y divide-primary/10">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <p className="font-bold">Monthly Grace Occurrences</p>
              <p className="text-sm text-app-muted">Late arrivals forgiven per month without penalty.</p>
            </div>
            <Stepper
              value={settings.graceOccurrences}
              min={0}
              max={10}
              onChange={(value) => setSettings({ ...settings, graceOccurrences: value })}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="font-bold">Default Check-in Geofence Radius</p>
              <p className="text-sm text-app-muted">Default radius applied while creating a new office.</p>
            </div>
            <div className="flex items-center gap-3">
              <Stepper
                value={settings.defaultGeofenceRadius}
                min={50}
                max={1000}
                onChange={(value) => setSettings({ ...settings, defaultGeofenceRadius: value })}
              />
              <span className="text-sm font-bold text-app-muted">m</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="font-bold">Mock GPS Enforcement</p>
              <p className="text-sm text-app-muted">Currently logs suspicious GPS activity instead of blocking attendance.</p>
            </div>
            <Badge status={settings.mockGpsEnforcement} />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={handleSave}>Save Settings</Button>
          {saved && <span className="text-sm font-bold text-success">Saved to localStorage</span>}
        </div>
      </Card>
    </div>
  )
}
