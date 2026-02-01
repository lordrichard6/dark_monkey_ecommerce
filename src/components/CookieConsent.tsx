'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const CONSENT_KEY = 'darkmonkey-cookie-consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const consented = localStorage.getItem(CONSENT_KEY)
    if (!consented) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 md:pl-20 md:pb-4">
      <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-zinc-900/95 px-4 py-4 shadow-xl backdrop-blur-md md:px-6 md:py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-zinc-300 md:text-base">
            We use cookies to provide cart persistence, authentication, and a
            better shopping experience.{' '}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-amber-400"
            >
              Privacy &amp; Cookies
            </Link>
          </p>
          <button
            type="button"
            onClick={accept}
            className="shrink-0 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-amber-400"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
