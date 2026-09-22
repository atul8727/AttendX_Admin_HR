export default function StatCard({ label, value, icon: Icon, tone = 'primary', meta }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/15 text-warning',
    info: 'bg-info/10 text-info',
    teal: 'bg-teal/10 text-teal',
    secondary: 'bg-secondary/10 text-secondary'
  }
  return (
    <div className="rounded-lg bg-app-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-app-muted">{label}</p>
          <p className="mt-2 text-3xl font-black text-app-text">{value}</p>
          {meta && <p className="mt-1 text-xs font-semibold text-app-muted">{meta}</p>}
        </div>
        {Icon && <span className={`rounded-lg p-3 ${tones[tone]}`}><Icon className="h-5 w-5" /></span>}
      </div>
    </div>
  )
}
