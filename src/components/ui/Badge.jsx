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
  const config = statusConfig[status] || { label: status, color: 'primary' }
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${colors[config.color]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  )
}
