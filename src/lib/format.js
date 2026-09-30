import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getLanguageMeta } from '../i18n/languages.js'

export function createFormatters(languageCode) {
  const locale = getLanguageMeta(languageCode).locale
  const toDate = (value) => (value instanceof Date ? value : new Date(value))
  return {
    locale,
    date: (value, options = { dateStyle: 'medium' }) => new Intl.DateTimeFormat(locale, options).format(toDate(value)),
    dateTime: (value) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(toDate(value)),
    time: (value) => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(toDate(value)),
    number: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    monthName: (index) => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, index, 1))
  }
}

export function useFormatters() {
  const { i18n } = useTranslation()
  return useMemo(() => createFormatters(i18n.resolvedLanguage), [i18n.resolvedLanguage])
}