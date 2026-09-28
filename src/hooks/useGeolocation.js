import { useCallback, useState } from 'react'

// Wraps the browser Geolocation API.
// locate() calls onSuccess({ latitude, longitude, accuracy }) with coordinates rounded to 6 decimals.
export function useGeolocation(onSuccess) {
  const [locating, setLocating] = useState(false)
  const [message, setMessage] = useState('')

  const locate = useCallback(() => {
    if (!window.navigator.geolocation) {
      setMessage('Location is not supported in this browser.')
      return
    }
    setLocating(true)
    setMessage('')
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        onSuccess({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          accuracy: Math.round(position.coords.accuracy)
        })
        setMessage(`Location found (accuracy ~${Math.round(position.coords.accuracy)} m).`)
        setLocating(false)
      },
      (error) => {
        setMessage(error.code === 1 ? 'Location permission was denied. Allow it in your browser settings.' : 'Could not get your location. Please try again.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [onSuccess])

  return { locate, locating, message }
}