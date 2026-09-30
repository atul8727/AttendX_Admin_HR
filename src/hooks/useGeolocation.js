import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Wraps the browser Geolocation API.
// locate() calls onSuccess({ latitude, longitude, accuracy }) with coordinates rounded to 6 decimals.
// message ek translated string hai (common:geolocation.*). State me key rakhte hain, text nahi,
// taaki message dikhne ke baad language badle to message bhi nayi language me badal jaye.
export function useGeolocation(onSuccess) {
  const { t } = useTranslation()
  const [locating, setLocating] = useState(false)
  const [status, setStatus] = useState(null)

  const locate = useCallback(() => {
    if (!window.navigator.geolocation) {
      setStatus({ key: 'geolocation.unsupported' })
      return
    }
    setLocating(true)
    setStatus(null)
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = Math.round(position.coords.accuracy)
        onSuccess({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          accuracy
        })
        setStatus({ key: 'geolocation.found', accuracy })
        setLocating(false)
      },
      (error) => {
        setStatus({ key: error.code === 1 ? 'geolocation.denied' : 'geolocation.failed' })
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [onSuccess])

  const message = status ? t(status.key, { accuracy: status.accuracy }) : ''

  return { locate, locating, message }
}