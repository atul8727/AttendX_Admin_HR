export const LANGUAGES = [
  { code: 'en', label: 'EN', locale: 'en-IN', dir: 'ltr' },
  { code: 'hi', label: 'HI', locale: 'hi-IN', dir: 'ltr' }
  // { code: 'mr', label: 'मराठी', locale: 'mr-IN', dir: 'ltr' },
]

export const DEFAULT_LANGUAGE = 'en'
export const LANGUAGE_STORAGE_KEY = 'attendx-lang'

export function getLanguageMeta(code) {
  const base = String(code || '').split('-')[0]
  return LANGUAGES.find((lang) => lang.code === base) || LANGUAGES.find((lang) => lang.code === DEFAULT_LANGUAGE)
}