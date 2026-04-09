'use client'

import { useEffect, useState } from 'react'
import { Rocket, Copy, Check } from 'lucide-react'

const DEADLINE = new Date('2026-05-01T00:00:00+02:00')

function getTimeLeft() {
  const diff = DEADLINE.getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

interface Props {
  /** "inline" renders as a static badge (no absolute positioning) */
  position?: 'inline'
}

export function LaunchCountdownBanner({ position }: Props) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft())
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleCopy() {
    await navigator.clipboard.writeText('LAUNCH')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mounted || !timeLeft) return null

  const { days, hours, minutes, seconds } = timeLeft

  const pill = (
    <div
      className="rounded-full p-px"
      style={{
        background:
          'linear-gradient(135deg, rgba(251,191,36,0.5) 0%, rgba(251,191,36,0.08) 50%, rgba(251,191,36,0.4) 100%)',
        boxShadow: '0 0 20px rgba(251,191,36,0.18)',
      }}
    >
      <div className="flex flex-row items-center gap-2 rounded-full bg-black/70 px-3 py-2 backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-2.5">
        {/* Rocket icon */}
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 ring-1 ring-amber-500/30 sm:h-6 sm:w-6">
          <Rocket className="h-2.5 w-2.5 text-amber-400 sm:h-3 sm:w-3" />
        </div>

        {/* Label — hidden on xs to save space */}
        <span className="hidden text-[11px] font-bold uppercase tracking-widest text-amber-400 xs:inline sm:text-xs">
          Free Shipping
        </span>
        <span className="hidden text-zinc-600 xs:inline">·</span>

        {/* Countdown */}
        <span className="flex items-baseline gap-1 font-mono tabular-nums">
          <CountUnit value={days} label="d" />
          <CountUnit value={hours} label="h" />
          <CountUnit value={minutes} label="m" />
          <CountUnit value={seconds} label="s" />
        </span>

        {/* Separator dot */}
        <span className="text-zinc-600">·</span>

        {/* Promo code button */}
        <button
          onClick={handleCopy}
          className="group flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 transition-all hover:border-amber-400/50 hover:bg-amber-500/20 active:scale-95 sm:gap-1.5 sm:px-2.5 sm:py-1"
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 sm:text-[11px]">
            LAUNCH
          </span>
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-amber-500/20 sm:h-4 sm:w-4">
            {copied ? (
              <Check className="h-2 w-2 text-emerald-400 sm:h-2.5 sm:w-2.5" />
            ) : (
              <Copy className="h-2 w-2 text-amber-400 sm:h-2.5 sm:w-2.5" />
            )}
          </span>
        </button>
      </div>
    </div>
  )

  if (position === 'inline') {
    return (
      <div
        className="inline-flex animate-in fade-in slide-in-from-bottom-4 duration-1000"
        style={{ animationFillMode: 'both' }}
      >
        {pill}
      </div>
    )
  }

  // Legacy absolute-positioned variant (kept for backwards compat)
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-bottom-3 duration-700 whitespace-nowrap"
      style={{ animationDelay: '700ms', animationFillMode: 'both' }}
    >
      {pill}
    </div>
  )
}

function CountUnit({ value, label }: { value: number; label: string }) {
  const [flash, setFlash] = useState(false)
  const [prev, setPrev] = useState(value)

  useEffect(() => {
    if (value !== prev) {
      setFlash(true)
      setPrev(value)
      const t = setTimeout(() => setFlash(false), 250)
      return () => clearTimeout(t)
    }
  }, [value, prev])

  return (
    <span className="flex items-baseline gap-0.5">
      <span
        className={`text-base font-black leading-none text-amber-300 transition-all duration-200 sm:text-lg ${flash ? 'scale-110 text-amber-200' : ''}`}
        style={{ display: 'inline-block' }}
      >
        {pad(value)}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/50">
        {label}
      </span>
    </span>
  )
}
