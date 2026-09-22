export default function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-lg border border-primary/15 bg-app-surface p-5 shadow-soft ring-1 ring-white/40 dark:ring-white/5 ${className}`}
    >
      {children}
    </section>
  )
}
