'use client'

import Image from 'next/image'

export function HeroLogo() {
  return (
    <div className="relative mb-8 inline-block">
      <div
        className="absolute inset-0 -m-8 animate-golden-pulse rounded-full blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <Image
          src="/logo.png"
          alt="DarkMonkey"
          width={160}
          height={160}
          className="relative z-10 mx-auto rounded-full object-contain drop-shadow-lg"
          priority
          unoptimized
        />
      </div>
    </div>
  )
}
