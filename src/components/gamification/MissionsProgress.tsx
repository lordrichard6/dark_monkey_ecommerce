type Props = {
  orderCount: number
  hasDisplayName: boolean
  earnedBadges: string[]
}

const MISSIONS = [
  { id: 'first_purchase', label: 'Complete your first order', done: (p: Props) => p.orderCount >= 1 },
  { id: 'profile_complete', label: 'Complete your profile (add display name)', done: (p: Props) => p.hasDisplayName },
  { id: 'five_orders', label: 'Place 5 orders', done: (p: Props) => p.orderCount >= 5 },
  { id: 'ten_orders', label: 'Place 10 orders', done: (p: Props) => p.orderCount >= 10 },
]

export function MissionsProgress({ orderCount, hasDisplayName, earnedBadges }: Props) {
  const props = { orderCount, hasDisplayName, earnedBadges }
  const completed = MISSIONS.filter((m) => m.done(props)).length

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-50">Missions</h3>
        <span className="text-sm text-zinc-400">
          {completed} / {MISSIONS.length} completed
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {MISSIONS.map((m) => {
          const done = m.done(props)
          return (
            <li key={m.id} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${
                  done ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {done ? '✓' : '·'}
              </span>
              <span className={done ? 'text-zinc-300 line-through' : 'text-zinc-400'}>
                {m.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
