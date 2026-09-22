import { useEffect, useRef, useState } from 'react'

export function useFetch(serviceCall, dependencies = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const serviceRef = useRef(serviceCall)

  useEffect(() => {
    serviceRef.current = serviceCall
  }, [serviceCall])

  async function run() {
    setLoading(true)
    setError(null)
    try {
      setData(await serviceRef.current())
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    run()
    // The caller controls refetch triggers with the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return { data, loading, error, refetch: run }
}
