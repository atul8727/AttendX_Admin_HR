const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  success: 'bg-success text-white hover:bg-success/90',
  danger: 'bg-danger text-white hover:bg-danger/90',
  warning: 'bg-warning text-white hover:bg-warning/90',
  info: 'bg-info text-white hover:bg-info/90',
  ghost: 'bg-transparent text-app-text hover:bg-primary/10',
  outline: 'border border-primary text-primary hover:bg-primary hover:text-white'
}

export default function Button({ children, variant = 'primary', className = '', icon: Icon, ...props }) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}
