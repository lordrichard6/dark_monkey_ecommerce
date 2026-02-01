'use client'

type Props = { name: string }

export function ProductName({ name }: Props) {
  if (name.startsWith('Premium ')) {
    return (
      <h3 className="font-medium text-zinc-50 group-hover:text-white">
        <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
          Premium
        </span>
        {name.slice(7)}
      </h3>
    )
  }
  return (
    <h3 className="font-medium text-zinc-50 group-hover:text-white">{name}</h3>
  )
}
