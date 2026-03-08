'use client'

import { Cookie } from 'lucide-react'

const CONSENT_KEY = 'darkmonkey-cookie-consent'

export function CookieResetButton() {
  function handleReset() {
    localStorage.removeItem(CONSENT_KEY)
    window.location.reload()
  }

  return (
    <button
      onClick={handleReset}
      className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
    >
      <Cookie className="h-4 w-4" />
      Reset cookie consent
    </button>
  )
}
