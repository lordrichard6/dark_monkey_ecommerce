'use client'

import { useState } from 'react'
import { POINTS_REDEMPTION } from '@/lib/gamification'
import { useCurrency } from '@/components/currency/CurrencyContext'
import { Award, Gift, TrendingUp, ChevronRight } from 'lucide-react'

type Props = {
  totalPoints: number
  userId: string
}

export function PointsDisplay({ totalPoints, userId }: Props) {
  const { format } = useCurrency()
  const [selectedRedemption, setSelectedRedemption] = useState<number | null>(null)

  const redemptionOptions = Object.entries(POINTS_REDEMPTION).map(([points, discountCents]) => ({
    points: parseInt(points),
    discountCents,
    available: totalPoints >= parseInt(points),
  }))

  return (
    <div className="space-y-6">
      {/* Points Balance Card */}
      <div className="rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <Award className="h-4 w-4" />
              <span className="font-medium uppercase tracking-wider">Points Balance</span>
            </div>
            <div className="mt-2 text-4xl font-bold text-amber-500">
              {totalPoints.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-zinc-500">Earn points with every purchase and review</p>
          </div>
          <div className="text-6xl">🏆</div>
        </div>
      </div>

      {/* How to Earn Points */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-50">
          <TrendingUp className="h-5 w-5 text-green-400" />
          Earn Points
        </h3>
        <div className="space-y-3">
          <EarnRule icon="🛍️" title="Make a Purchase" points="1 point per CHF 1" />
          <EarnRule icon="⭐" title="Write a Review" points="50 points" />
          <EarnRule icon="🤝" title="Refer a Friend (Signup)" points="200 points" />
          <EarnRule icon="💰" title="Refer a Friend (First Purchase)" points="500 points" />
          <EarnRule icon="🎂" title="Birthday Bonus" points="500 points" />
          <EarnRule icon="🏆" title="Unlock Achievements" points="Varies" />
        </div>
      </div>

      {/* Redeem Points */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-50">
          <Gift className="h-5 w-5 text-purple-400" />
          Redeem Points
        </h3>
        <div className="space-y-3">
          {redemptionOptions.map((option) => (
            <button
              key={option.points}
              onClick={() => setSelectedRedemption(option.points)}
              disabled={!option.available}
              className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition ${
                option.available
                  ? 'border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-700'
                  : 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
              } ${selectedRedemption === option.points ? 'ring-2 ring-amber-500' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-400">
                    {option.points} points
                  </span>
                  {!option.available && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                      Locked
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  Get {format(option.discountCents)} discount
                </p>
              </div>
              {option.available && <ChevronRight className="h-5 w-5 text-zinc-500" />}
            </button>
          ))}
        </div>

        {selectedRedemption && (
          <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
            <p className="text-sm text-amber-400">
              💡 Your discount code will be generated at checkout when you redeem points
            </p>
          </div>
        )}
      </div>

      {/* Points History Preview */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-50">Recent Activity</h3>
        <p className="text-sm text-zinc-500">Points history will be displayed here</p>
        {/* TODO: Implement points transaction history */}
      </div>
    </div>
  )
}

function EarnRule({ icon, title, points }: { icon: string; title: string; points: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-zinc-300">{title}</span>
      </div>
      <span className="text-sm font-semibold text-green-400">+{points}</span>
    </div>
  )
}
