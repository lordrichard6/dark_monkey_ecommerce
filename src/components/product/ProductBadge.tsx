type BadgeProps = {
  type: 'new' | 'featured' | 'sale' | 'bestseller'
  className?: string
}

export function ProductBadge({ type, className = '' }: BadgeProps) {
  const badges = {
    new: {
      label: 'New',
      classes: 'bg-blue-500/90 text-white',
    },
    featured: {
      label: 'Featured',
      classes: 'bg-amber-500/90 text-black',
    },
    sale: {
      label: 'Sale',
      classes: 'bg-red-500/90 text-white',
    },
    bestseller: {
      label: 'Bestseller',
      classes: 'bg-amber-600/90 text-white',
    },
  }

  const badge = badges[type]

  return (
    <span
      className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${badge.classes} ${className}`}
    >
      {badge.label}
    </span>
  )
}
