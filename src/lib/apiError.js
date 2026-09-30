import i18n from '../i18n/index.js'

export function getApiErrorMessage(error, fallback = i18n.t('errors:generic')) {
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