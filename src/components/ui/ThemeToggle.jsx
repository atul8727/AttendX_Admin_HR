import { useTranslation } from 'react-i18next'
import { FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from '../../hooks/useTheme.js'

export default function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const Icon = theme === 'dark' ? FiSun : FiMoon
  return (
    <button
      className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
      onClick={toggleTheme}
      aria-label={t('common:theme.toggle')}
      title={t('common:theme.toggle')}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}