import { getTierInfo, type Tier } from '@/lib/gamification'

type Props = {
  totalSpentCents: number
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export function TierBadge({ totalSpentCents, size = 'md', showName = true }: Props) {
  const tierInfo = getTierInfo(totalSpentCents)

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${tierInfo.color} font-bold text-white shadow-lg ${sizes[size]}`}
    >
      <span className={iconSizes[size]}>{tierInfo.icon}</span>
      {showName && <span>{tierInfo.name}</span>}
    </span>
  )
}

// Standalone tier icon (no background)
export function TierIcon({ tier }: { tier: Tier }) {
  const icons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
  }

  return <span className="text-2xl">{icons[tier]}</span>
}
