export default function Input({ label, className = '', ...props }) {
  return (
    <label className="block text-sm font-semibold text-app-text">
      {label && <span className="mb-1.5 block">{label}</span>}
      <input
        className={`min-h-10 w-full rounded-lg border border-primary/15 bg-app-bg px-3 text-app-text outline-none transition placeholder:text-app-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
    </label>
  )
}
