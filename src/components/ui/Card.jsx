export default function Card({ children, className = '' }) {
  return (
    <section
      className={`min-w-0 rounded-lg border border-primary/15 bg-app-surface p-4 shadow-soft ring-1 ring-white/40 sm:p-5 dark:ring-white/5 ${className}`}
    >
      {children}
    </section>
  )
}
