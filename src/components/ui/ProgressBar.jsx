export default function ProgressBar({ value, max, tone = 'primary' }) {
  const width = Math.min(100, Math.round((value / max) * 100))
  const tones = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', info: 'bg-info', teal: 'bg-teal' }
  return (
    <div className="h-2.5 rounded-full bg-primary/10">
      <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${width}%` }} />
    </div>
  )
}
