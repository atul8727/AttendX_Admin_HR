export default function Card({ children, className = '' }) {
  return (
    <section
      className={`min-w-0 rounded-lg border border-primary/15 bg-app-surface p-4 shadow-soft ring-1 ring-white/40 print:rounded-none print:border-none print:bg-white print:p-0 print:shadow-none print:ring-0 sm:p-5 dark:ring-white/5 ${className}`}
    >
      {children}
    </section>
  )
}