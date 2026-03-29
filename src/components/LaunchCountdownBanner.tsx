'use client'

import { useEffect, useState } from 'react'
import { Rocket, Copy, Check } from 'lucide-react'

// End of April 30 2026 — Swiss time (UTC+2 = CEST)
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

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const [flash, setFlash] = useState(false)
  const [prev, setPrev] = useState(value)

  useEffect(() => {
    if (value !== prev) {
      setFlash(true)
      setPrev(value)
      const t = setTimeout(() => setFlash(false), 300)
      return () => clearTimeout(t)
    }
  }, [value, prev])

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-lg border border-amber-500/20 bg-black/40 text-xl font-black tabular-nums text-amber-300 backdrop-blur-sm transition-all duration-200 sm:h-14 sm:w-14 sm:text-2xl ${
          flash ? 'scale-110 border-amber-400/60 text-amber-200' : ''
        }`}
      >
        {/* Inner glow on flash */}
        <div
          className={`absolute inset-0 rounded-lg bg-amber-500/10 transition-opacity duration-200 ${flash ? 'opacity-100' : 'opacity-0'}`}
        />
        <span className="relative">{pad(value)}</span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  )
}

export function LaunchCountdownBanner() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft())
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleCopy() {
    await navigator.clipboard.writeText('LAUNCH')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Don't render after deadline or before mount (avoid hydration mismatch)
  if (!mounted || !timeLeft) return null

  return (
    <div
      className="mx-auto mt-10 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700"
      style={{ animationDelay: '600ms', animationFillMode: 'both' }}
    >
      {/* Outer glow ring */}
      <div
        className="relative rounded-2xl p-px"
        style={{
          background:
            'linear-gradient(135deg, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0.05) 50%, rgba(251,191,36,0.3) 100%)',
        }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-black/70 px-5 py-4 backdrop-blur-xl sm:px-7 sm:py-5">
          {/* Ambient background glow */}
          <div className="pointer-events-none absolute -top-12 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

          {/* Top row: label + code */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Launch badge */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 ring-1 ring-amber-500/30">
                <Rocket className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/80">
                  Launch Month
                </p>
                <p className="text-sm font-semibold text-zinc-100">
                  Free Shipping — Limited Orders
                </p>
              </div>
            </div>

            {/* Right: promo code */}
            <button
              onClick={handleCopy}
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 transition-all hover:border-amber-400/50 hover:bg-amber-500/20 active:scale-95"
            >
              {/* Shimmer sweep */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative text-sm font-black uppercase tracking-[0.25em] text-amber-300">
                LAUNCH
              </span>
              <span className="relative flex h-5 w-5 items-center justify-center rounded bg-amber-500/20">
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-amber-400" />
                )}
              </span>
              <span className="relative text-[10px] text-zinc-400">
                {copied ? 'Copied!' : 'Copy code'}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

          {/* Countdown */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <CountdownUnit value={timeLeft.days} label="Days" />
            <Separator />
            <CountdownUnit value={timeLeft.hours} label="Hours" />
            <Separator />
            <CountdownUnit value={timeLeft.minutes} label="Min" />
            <Separator />
            <CountdownUnit value={timeLeft.seconds} label="Sec" />
          </div>

          {/* Bottom hint */}
          <p className="mt-4 text-center text-[11px] text-zinc-500">
            Paste <span className="font-bold text-amber-500/80">LAUNCH</span> at checkout · Free
            shipping ends when the clock hits zero
          </p>
        </div>
      </div>
    </div>
  )
}

function Separator() {
  return (
    <span className="mb-5 text-xl font-black text-amber-500/40 animate-pulse select-none">:</span>
  )
}
