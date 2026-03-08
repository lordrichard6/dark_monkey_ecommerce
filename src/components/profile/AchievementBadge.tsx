import { type Achievement } from '@/lib/gamification'

type Props = {
  achievement: Achievement
  unlocked?: boolean
  unlockedAt?: Date
  size?: 'sm' | 'md' | 'lg'
}

export function AchievementBadge({
  achievement,
  unlocked = false,
  unlockedAt,
  size = 'md',
}: Props) {
  const tierColors = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-zinc-400 to-zinc-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-purple-600',
  }

  const sizes = {
    sm: {
      container: 'w-16 h-16',
      icon: 'text-2xl',
      text: 'text-[10px]',
    },
    md: {
      container: 'w-24 h-24',
      icon: 'text-4xl',
      text: 'text-xs',
    },
    lg: {
      container: 'w-32 h-32',
      icon: 'text-5xl',
      text: 'text-sm',
    },
  }

  const sizeClasses = sizes[size]

  return (
    <div
      className={`group relative flex flex-col items-center justify-center gap-1 rounded-lg border ${
        unlocked
          ? `border-${achievement.tier}-500/30 bg-gradient-to-br ${tierColors[achievement.tier]} shadow-lg`
          : 'border-zinc-800 bg-zinc-900/50 grayscale'
      } p-3 transition hover:scale-105 ${sizeClasses.container}`}
      title={achievement.description}
    >
      {/* Icon */}
      <div className={`${sizeClasses.icon} ${unlocked ? '' : 'opacity-30'}`}>
        {achievement.icon}
      </div>

      {/* Name */}
      <div
        className={`text-center font-bold ${unlocked ? 'text-white' : 'text-zinc-600'} ${sizeClasses.text}`}
      >
        {achievement.name}
      </div>

      {/* Points reward — shown on both locked and unlocked */}
      {achievement.pointsReward > 0 && (
        <div
          className={`absolute -right-2 -top-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow ${
            unlocked ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-400'
          }`}
        >
          +{achievement.pointsReward}
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute -top-24 left-1/2 z-10 hidden w-52 -translate-x-1/2 rounded-lg bg-zinc-900 p-3 text-xs text-zinc-300 shadow-xl group-hover:block">
        <p className="font-semibold text-zinc-50">{achievement.name}</p>
        <p className="mt-1">{achievement.description}</p>
        {achievement.pointsReward > 0 && (
          <p className="mt-2 font-semibold text-amber-400">
            Reward: +{achievement.pointsReward} points
          </p>
        )}
        {unlocked && unlockedAt && (
          <p className="mt-1 text-[10px] text-zinc-500">
            Unlocked: {unlockedAt.toLocaleDateString()}
          </p>
        )}
        {!unlocked && <p className="mt-1 text-[10px] text-zinc-500">Not yet unlocked</p>}
      </div>
    </div>
  )
}

// Grid layout for achievements
export function AchievementGrid({
  achievements,
  unlockedIds,
}: {
  achievements: Achievement[]
  unlockedIds: Set<string>
}) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          unlocked={unlockedIds.has(achievement.id)}
        />
      ))}
    </div>
  )
}
