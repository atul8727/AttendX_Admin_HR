import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet's default marker icon breaks with bundlers like Vite, so we use our own SVG pin.
const pinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 24 32">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#4f46e5" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4.5" fill="#fff"/>
  </svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 44]
})

const DEFAULT_CENTER = [22.9734, 78.6569] // Center of India, used until coordinates are available
const DEFAULT_ZOOM = 5
const POINT_ZOOM = 16

function toPoint(latitude, longitude) {
  if (latitude === '' || longitude === '' || latitude === null || longitude === null) return null
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return [lat, lng]
}

// Moves the map when the coordinates change from outside (typing, "Use my location").
function Recenter({ point }) {
  const map = useMap()
  const lat = point?.[0]
  const lng = point?.[1]

  useEffect(() => {
    if (lat === undefined || lng === undefined) return
    const zoom = map.getZoom() < 14 ? POINT_ZOOM : map.getZoom()
    map.setView([lat, lng], zoom, { animate: true })
  }, [lat, lng, map])

  return null
}

function ClickToPick({ onChange }) {
  useMapEvents({
    click: (event) => onChange(event.latlng.lat, event.latlng.lng)
  })
  return null
}

/**
 * Location map.
 * - editable (default): click the map or drag the pin to set the location; the radius circle updates live.
 * - readOnly: display only (details views).
 * latitude, longitude and radius can be strings or numbers.
 */
export default function OfficeMapPicker({ latitude, longitude, radius, onChange, readOnly = false, height = 280 }) {
  const point = useMemo(() => toPoint(latitude, longitude), [latitude, longitude])
  const radiusMeters = Number(radius)
  const showCircle = point && Number.isFinite(radiusMeters) && radiusMeters > 0

  function handlePick(lat, lng) {
    if (readOnly || !onChange) return
    onChange(lat.toFixed(6), lng.toFixed(6))
  }

  return (
    <div className="space-y-2">
      <div className="relative z-0 overflow-hidden rounded-xl border border-primary/15" style={{ height }}>
        <MapContainer
          center={point || DEFAULT_CENTER}
          zoom={point ? POINT_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom={!readOnly}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          <Recenter point={point} />
          {!readOnly && <ClickToPick onChange={handlePick} />}
          {point && (
            <Marker
              position={point}
              icon={pinIcon}
              draggable={!readOnly}
              eventHandlers={{
                dragend: (event) => {
                  const { lat, lng } = event.target.getLatLng()
                  handlePick(lat, lng)
                }
              }}
            />
          )}
          {showCircle && <Circle center={point} radius={radiusMeters} pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.15, weight: 2 }} />}
        </MapContainer>
      </div>
      {!readOnly && (
        <p className="text-xs text-app-muted">
          {point ? 'Drag the pin or click the map to change the location. The blue circle shows the allowed radius.' : 'Click the map to choose a location.'}
        </p>
      )}
    </div>
  )
}