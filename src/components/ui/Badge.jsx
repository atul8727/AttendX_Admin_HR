import { useTranslation } from 'react-i18next'
import { statusConfig } from '../../constants/statusConfig.js'

const colors = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-info/10 text-info',
  teal: 'bg-teal/10 text-teal',
  secondary: 'bg-secondary/10 text-secondary'
}

export default function Badge({ status }) {
  const { t } = useTranslation()
  const config = statusConfig[status] || { label: status, color: 'primary' }
  const Icon = config.icon
  const text = config.labelKey ? t(config.labelKey, { defaultValue: config.label }) : config.label
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${colors[config.color]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {text}
    </span>
  )
}