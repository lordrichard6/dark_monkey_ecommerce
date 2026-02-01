import { getXpProgress, getXpToNextTier, type Tier } from '@/lib/gamification'

const TIER_COLORS: Record<Tier, string> = {
  bronze: 'from-amber-800 to-amber-600',
  silver: 'from-zinc-400 to-zinc-600',
  gold: 'from-yellow-500 to-amber-600',
  vip: 'from-purple-600 to-amber-500',
}

const TIER_LABELS: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  vip: 'VIP',
}

type Props = {
  tier: Tier
  totalXp: number
}

export function ProgressCard({ tier, totalXp }: Props) {
  const progress = getXpProgress(totalXp)
  const toNext = getXpToNextTier(totalXp)

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">Your tier</p>
          <p className={`mt-1 text-2xl font-bold bg-gradient-to-r ${TIER_COLORS[tier]} bg-clip-text text-transparent`}>
            {TIER_LABELS[tier]}
          </p>
        </div>
        <p className="text-3xl font-bold text-zinc-50">{totalXp} XP</p>
      </div>

      {progress && toNext && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Progress to {TIER_LABELS[toNext.tier]}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${TIER_COLORS[toNext.tier]}`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {progress.current} / {progress.next} XP
          </p>
        </div>
      )}

      {!toNext && (
        <p className="mt-4 text-sm text-amber-400">You&apos;ve reached the highest tier! 🎉</p>
      )}
    </div>
  )
}
