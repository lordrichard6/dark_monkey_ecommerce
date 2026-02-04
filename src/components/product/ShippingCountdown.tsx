'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

/** Cutoff hour (0–23) for same-day dispatch. Orders after this get "ships tomorrow" message. */
const DISPATCH_CUTOFF_HOUR = 14

function getMinutesUntilCutoff(): number | null {
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setHours(DISPATCH_CUTOFF_HOUR, 0, 0, 0)
  if (now >= cutoff) return null
  return Math.floor((cutoff.getTime() - now.getTime()) / (60 * 1000))
}

export function ShippingCountdown() {
  const t = useTranslations('product')
  const [minutesLeft, setMinutesLeft] = useState<number | null>(() => getMinutesUntilCutoff())

  useEffect(() => {
    const tick = () => setMinutesLeft(getMinutesUntilCutoff())
    tick()
    const id = setInterval(tick, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  if (minutesLeft == null || minutesLeft <= 0) {
    return (
      <p className="mt-1 text-sm text-amber-400/90">
        {t('orderTodayShipsTomorrow')}
      </p>
    )
  }

  const hours = Math.floor(minutesLeft / 60)
  const minutes = minutesLeft % 60
  return (
    <p className="mt-1 text-sm text-amber-400/90">
      {t('orderWithinForDispatch', { hours, minutes })}
    </p>
  )
}
