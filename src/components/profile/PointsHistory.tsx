'use client'

import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Award, ShoppingBag, UserPlus } from 'lucide-react'

type Transaction = {
    id: string
    points: number
    reason: string
    created_at: string
}

type Props = {
    transactions: Transaction[]
}

export function PointsHistory({ transactions }: Props) {
    if (!transactions.length) {
        return (
            <div className="text-center py-8 text-zinc-500">
                <p>No points history yet.</p>
            </div>
        )
    }

    const getIcon = (reason: string) => {
        if (reason === 'purchase') return <ShoppingBag className="h-4 w-4 text-blue-400" />
        if (reason.startsWith('referral')) return <UserPlus className="h-4 w-4 text-green-400" />
        if (reason.startsWith('achievement')) return <Award className="h-4 w-4 text-amber-400" />
        if (reason === 'redemption') return <TrendingDown className="h-4 w-4 text-red-400" />
        return <TrendingUp className="h-4 w-4 text-zinc-400" />
    }

    const formatReason = (reason: string) => {
        if (reason === 'purchase') return 'Purchase Reward'
        if (reason === 'referral_signup') return 'Referral (Sign up)'
        if (reason === 'referral_purchase') return 'Referral (First Purchase)'
        if (reason.startsWith('achievement:')) {
            const achievementId = reason.split(':')[1]
            return `Achievement Unlocked: ${achievementId.replace(/_/g, ' ')}`
        }
        if (reason === 'redemption') return 'Points Redeemed'
        if (reason === 'birthday') return 'Birthday Bonus'
        return reason
    }

    return (
        <div className="space-y-4">
            {transactions.map((tx) => (
                <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 transition hover:bg-zinc-900/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-zinc-800 p-2">
                            {getIcon(tx.reason)}
                        </div>
                        <div>
                            <p className="font-medium text-zinc-200 capitalize">
                                {formatReason(tx.reason)}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {format(new Date(tx.created_at), 'PPP')}
                            </p>
                        </div>
                    </div>
                    <div className={`font-bold ${tx.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points} XP
                    </div>
                </div>
            ))}
        </div>
    )
}
