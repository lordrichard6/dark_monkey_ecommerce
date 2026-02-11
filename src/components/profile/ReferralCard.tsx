'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, Share2, Users, Gift } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Props = {
  userId: string
  referralCount: number
}

export function ReferralCard({ userId, referralCount }: Props) {
  const t = useTranslations('profile')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrCreateReferralCode()
  }, [userId])

  const loadOrCreateReferralCode = async () => {
    try {
      const supabase = createClient()

      // Check if user already has a referral code
      const { data: existingReferral } = await supabase
        .from('user_referrals')
        .select('referral_code')
        .eq('referrer_id', userId)
        .limit(1)
        .single()

      if (existingReferral) {
        setReferralCode(existingReferral.referral_code)
      } else {
        // Generate new referral code using database function
        const { data, error } = await supabase.rpc('generate_referral_code', {
          user_id: userId,
        })

        if (!error && data) {
          // Create referral entry
          await supabase.from('user_referrals').insert({
            referrer_id: userId,
            referral_code: data,
            status: 'pending',
          })

          setReferralCode(data)
        }
      }
    } catch (error) {
      console.error('Error loading referral code:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!referralCode) return

    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`

    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareReferral = async () => {
    if (!referralCode) return

    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`
    const text = `Join me on this amazing store! Use my referral code: ${referralCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join with my referral',
          text,
          url: referralUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copy
      copyToClipboard()
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="h-32 animate-pulse rounded bg-zinc-800" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
          <Users className="h-5 w-5 text-purple-400" />
          {t('referFriends')}
        </h3>
        <div className="flex items-center gap-1 rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-400">
          {referralCount} {t('referred')}
        </div>
      </div>

      {/* Referral Code */}
      {referralCode && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {t('yourReferralCode')}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-bold tracking-wider text-purple-400">
                {referralCode}
              </code>
              <button
                onClick={copyToClipboard}
                className="rounded-lg bg-zinc-800 p-3 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
                title={t('copyLink')}
              >
                {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={shareReferral}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium text-white transition hover:from-purple-600 hover:to-pink-600"
          >
            <Share2 className="h-5 w-5" />
            {t('shareReferral')}
          </button>

          {/* Rewards Info */}
          <div className="space-y-2 rounded-lg bg-zinc-800/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Gift className="h-4 w-4 text-amber-400" />
              {t('referralRewards')}
            </p>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li>• {t('referralSignup')}: +200 {t('points')}</li>
              <li>• {t('referralPurchase')}: +500 {t('points')}</li>
              <li>
                • {t('friendGets')}: 10% {t('discount')}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
