'use client'

import Image from 'next/image'

export function HeroLogo() {
  return (
    <div className="relative mb-8 inline-block">
      <div
        className="absolute inset-0 -m-8 animate-golden-pulse rounded-full blur-3xl"
        aria-hidden
      />
      <div
        className="relative"
        style={{
          animation: 'heroFloat 4s ease-in-out infinite',
        }}
      >
        <Image
          src="/logo.webp"
          alt="DarkMonkey"
          width={196}
          height={196}
          className="relative z-10 mx-auto rounded-full object-contain drop-shadow-[0_8px_32px_rgba(251,191,36,0.25)]"
          priority
          unoptimized
        />
      </div>
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
