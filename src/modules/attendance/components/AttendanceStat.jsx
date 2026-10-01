const TONES = {
  primary: 'bg-primary/10 text-primary',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/15 text-warning',
  success: 'bg-success/10 text-success'
}

export default function AttendanceStat({ icon, label, value, tone = 'primary' }) {
  const Icon = icon
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-app-surface p-4 shadow-soft ring-1 ring-white/40 dark:ring-white/5">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${TONES[tone] || TONES.primary}`}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black leading-tight text-app-text">{value}</p>
        <p className="truncate text-xs font-semibold text-app-muted">{label}</p>
      </div>
    </div>
  )
}