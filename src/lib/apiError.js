export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.data
  return (
    data?.message ||
    data?.error?.message ||
    (typeof data?.error === 'string' ? data.error : '') ||
    data?.error?.code ||
    error?.error ||
    error?.message ||
    fallback
  )
}
