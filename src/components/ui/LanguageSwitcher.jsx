import { useTranslation } from 'react-i18next'
import { IoIosArrowDropdown  } from 'react-icons/io'
import { LANGUAGES } from '../../i18n/languages.js'

export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation()
  return (
    <label
      className={`relative flex h-10 items-center rounded-lg bg-primary/10 text-primary ${className}`}
      title={t('language.label')}
    >
      <IoIosArrowDropdown  className="pointer-events-none absolute left-2.5 h-4 w-4 " />
      <select
        className="h-full cursor-pointer appearance-none rounded-lg bg-transparent pl-8 pr-3 text-sm font-bold outline-none"
        value={i18n.resolvedLanguage}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        aria-label={t('language.label')}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-black">
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  )
}