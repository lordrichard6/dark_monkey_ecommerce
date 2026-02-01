import Link from 'next/link'
import { CartTrigger } from '@/components/cart/CartTrigger'
import { DarkMonkeyLogo } from '@/components/DarkMonkeyLogo'

export function DesktopTopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 hidden h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl md:flex md:pl-16">
      <div className="flex flex-1 items-center justify-between px-4">
        <DarkMonkeyLogo size="sm" textOnly />
        <div className="flex items-center gap-2">
          <CartTrigger />
          <Link
            href="/account"
            className="rounded p-2 text-zinc-400 transition hover:text-zinc-50"
            aria-label="Account"
            title="Account"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="rounded px-3 py-2 text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
