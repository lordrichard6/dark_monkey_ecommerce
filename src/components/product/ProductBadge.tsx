type BadgeProps = {
  type: 'new' | 'featured' | 'sale' | 'bestseller'
  label: string
  className?: string
}

export function ProductBadge({ type, label, className = '' }: BadgeProps) {
  if (type === 'sale') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg shadow-rose-500/30 ${className}`}
      >
        {label}
      </span>
    )
  }

  if (type === 'new') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gradient-to-r from-sky-400 to-blue-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 ${className}`}
      >
        {label}
      </span>
    )
  }

  if (type === 'bestseller') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950 shadow-lg shadow-amber-500/30 ${className}`}
      >
        {label}
      </span>
    )
  }

  // featured
  return (
    <span
      className={`inline-flex items-center rounded-full border border-zinc-600 bg-zinc-800/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200 backdrop-blur-sm ${className}`}
    >
      {label}
    </span>
  )
}
