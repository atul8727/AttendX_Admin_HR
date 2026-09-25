const variants = {
  // Gradient (primary -> secondary) + soft glow shadow jo primary color se hi banta hai,
  // isliye light aur dark dono theme me automatically match ho jata hai.
  primary:
    'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_10px_25px_-8px_rgb(var(--color-primary)/0.65)] hover:shadow-[0_14px_32px_-6px_rgb(var(--color-primary)/0.75)] hover:brightness-110 active:brightness-95',
  success:
    'bg-gradient-to-r from-success to-success/80 text-white shadow-[0_10px_25px_-8px_rgb(var(--color-success)/0.6)] hover:shadow-[0_14px_32px_-6px_rgb(var(--color-success)/0.7)] hover:brightness-110 active:brightness-95',
  danger:
    'bg-gradient-to-r from-danger to-danger/80 text-white shadow-[0_10px_25px_-8px_rgb(var(--color-danger)/0.6)] hover:shadow-[0_14px_32px_-6px_rgb(var(--color-danger)/0.7)] hover:brightness-110 active:brightness-95',
  warning:
    'bg-gradient-to-r from-warning to-warning/80 text-white shadow-[0_10px_25px_-8px_rgb(var(--color-warning)/0.6)] hover:shadow-[0_14px_32px_-6px_rgb(var(--color-warning)/0.7)] hover:brightness-110 active:brightness-95',
  info:
    'bg-gradient-to-r from-info to-info/80 text-white shadow-[0_10px_25px_-8px_rgb(var(--color-info)/0.6)] hover:shadow-[0_14px_32px_-6px_rgb(var(--color-info)/0.7)] hover:brightness-110 active:brightness-95',
  ghost: 'bg-transparent text-app-text hover:bg-primary/10',
  outline: 'border border-primary text-primary hover:bg-primary hover:text-white'
}

export default function Button({ children, variant = 'primary', className = '', icon: Icon, ...props }) {
  return (
    <button
      className={`inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children && <span className="min-w-0 truncate">{children}</span>}
    </button>
  )
}