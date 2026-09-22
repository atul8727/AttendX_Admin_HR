const palette = ['bg-primary', 'bg-secondary', 'bg-success', 'bg-info', 'bg-teal', 'bg-warning']

export default function Avatar({ name, size = 'md' }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const index = name.length % palette.length
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  return (
    <span className={`${sizeClass} inline-grid place-items-center rounded-full ${palette[index]} font-bold text-white`}>
      {initials}
    </span>
  )
}
