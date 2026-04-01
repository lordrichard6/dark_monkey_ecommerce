'use client'

import { useState } from 'react'

type Props = {
  avatarUrl: string | null
  initials: string
}

const ringStyle = {
  boxShadow: '0 0 0 4px rgba(251,191,36,0.08), 0 0 24px rgba(251,191,36,0.15)',
}

const initialsStyle = {
  boxShadow: '0 0 0 4px rgba(251,191,36,0.08), 0 0 24px rgba(251,191,36,0.2)',
}

export function AccountAvatar({ avatarUrl, initials }: Props) {
  const [broken, setBroken] = useState(false)

  if (avatarUrl && !broken) {
    return (
      <div
        className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-amber-500/40 bg-zinc-900"
        style={ringStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt="Avatar"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      </div>
    )
  }

  return (
    <div
      className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-2 border-amber-500/40 bg-gradient-to-br from-amber-500 to-amber-700 text-3xl font-bold text-white"
      style={initialsStyle}
    >
      {initials}
    </div>
  )
}
