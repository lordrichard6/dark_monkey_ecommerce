type Badge = {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
}

type Props = {
  badges: Badge[]
  earned: string[]
}

export function BadgesList({ badges, earned }: Props) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
      <h3 className="text-lg font-semibold text-zinc-50">Badges</h3>
      <div className="mt-4 flex flex-wrap gap-3">
        {badges.map((badge) => {
          const hasBadge = earned.includes(badge.id)
          return (
            <div
              key={badge.id}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
                hasBadge
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-zinc-800 bg-zinc-800/50 opacity-60'
              }`}
              title={badge.description ?? badge.name}
            >
              <span className="text-xl">{badge.icon ?? '🏅'}</span>
              <div>
                <p className={`text-sm font-medium ${hasBadge ? 'text-zinc-100' : 'text-zinc-500'}`}>
                  {badge.name}
                </p>
                {badge.description && (
                  <p className="text-xs text-zinc-500">{badge.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
