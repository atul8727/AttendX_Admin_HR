import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_STORAGE_KEY, getLanguageMeta } from './languages.js'

// locales/<lang>/<namespace>.json ko automatically load karta hai.
// Naya namespace = naya JSON file, koi import likhne ki zaroorat nahi.
const modules = import.meta.glob('./locales/*/*.json', { eager: true, import: 'default' })

const resources = {}
for (const [path, content] of Object.entries(modules)) {
  const [, lang, file] = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/)
  resources[lang] ??= {}
  resources[lang][file] = content
}

const namespaces = Object.keys(resources[DEFAULT_LANGUAGE] || {})

function applyDocumentLanguage(code) {
  const meta = getLanguageMeta(code)
  document.documentElement.lang = meta.code
  document.documentElement.dir = meta.dir
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: namespaces,
    defaultNS: 'common',
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGES.map((lang) => lang.code),
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    returnNull: false,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage']
    },
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (langs, ns, key) => {
      if (import.meta.env.DEV && typeof globalThis.console !== 'undefined') {
        globalThis.console.warn(`[i18n] missing key "${ns}:${key}" (${langs.join(',')})`)
      }
    }
  })

applyDocumentLanguage(i18n.resolvedLanguage)
i18n.on('languageChanged', applyDocumentLanguage)

export default i18n