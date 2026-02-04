'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'

type Props = {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  textOnly?: boolean
  href?: string
  className?: string
  onClick?: () => void
  /** When true, render content only (no Link) — use when wrapping in another Link to avoid nested anchors */
  noLink?: boolean
}

const sizes = {
  sm: { img: 32, text: 'text-lg' },
  md: { img: 48, text: 'text-xl' },
  lg: { img: 80, text: 'text-2xl' },
}

export function DarkMonkeyLogo({
  size = 'md',
  showText = true,
  textOnly = false,
  href = '/',
  className = '',
  onClick,
  noLink = false,
}: Props) {
  const { img, text } = sizes[size]
  const content = (
    <>
      {!textOnly && (
        <Image
          src="/logo.png"
          alt="DarkMonkey"
          width={img}
          height={img}
          className="shrink-0 rounded-full object-contain"
          priority
          unoptimized
        />
      )}
      {(showText || textOnly) && (
        <span className={`font-bold tracking-tight ${text}`}>
          <span className="text-zinc-50">Dark</span>
          <span className="text-amber-400">Monkey</span>
        </span>
      )}
    </>
  )

  if (noLink) {
    return (
      <span
        className={`inline-flex items-center gap-2 ${className}`}
        role="img"
        aria-label="DarkMonkey"
      >
        {content}
      </span>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-2 transition hover:opacity-90 ${className}`}
    >
      {content}
    </Link>
  )
}
