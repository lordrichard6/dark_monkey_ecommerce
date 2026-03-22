'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { sendTestEmailFull } from '@/actions/test-emails'

const EMAIL_TYPES = [
  {
    id: 'order',
    label: 'Order Confirmation',
    icon: '🛍️',
    description: 'Sent after successful checkout',
  },
  {
    id: 'cancellation',
    label: 'Order Cancellation',
    icon: '❌',
    description: 'Sent when order is cancelled',
  },
  {
    id: 'shipment',
    label: 'Shipment',
    icon: '📦',
    description: 'Sent when Printful ships the order',
  },
  {
    id: 'abandoned-cart',
    label: 'Abandoned Cart',
    icon: '🛒',
    description: 'Sent 1hr after cart abandoned',
  },
  {
    id: 'restock',
    label: 'Restock Alert',
    icon: '🔔',
    description: 'Sent when wishlist item is restocked',
  },
  {
    id: 'wishlist',
    label: 'Wishlist Reminder',
    icon: '❤️',
    description: 'Sent every 7 days to wishlist users',
  },
  { id: 'welcome', label: 'Welcome', icon: '👋', description: 'Sent on new user registration' },
  {
    id: 'review-request',
    label: 'Review Request',
    icon: '⭐',
    description: 'Sent 7 days after shipment',
  },
  {
    id: 'password-reset',
    label: 'Password Reset',
    icon: '🔑',
    description: 'Sent when user requests reset',
  },
  {
    id: 'email-confirmation',
    label: 'Account Confirmation',
    icon: '✅',
    description: 'Sent on signup via Resend',
  },
  {
    id: 'magic-link',
    label: 'Magic Link',
    icon: '🔗',
    description: 'Sent on passwordless sign-in',
  },
] as const

type EmailTypeId = (typeof EMAIL_TYPES)[number]['id']

interface User {
  id: string
  email: string
  name: string
}

export function EmailPreviewClient({ users }: { users: User[] }) {
  const [selected, setSelected] = useState<EmailTypeId>('order')
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id ?? '')
  const [locale, setLocale] = useState<string>('en')
  const [sending, setSending] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const selectedUser = users.find((u) => u.id === selectedUserId)
  const selectedType = EMAIL_TYPES.find((e) => e.id === selected)!

  async function handlePreview() {
    setLoadingPreview(true)
    try {
      const res = await fetch(`/api/admin/email-preview?type=${selected}&locale=${locale}`)
      const data = (await res.json()) as { html?: string; error?: string }
      if (data.html) setPreviewHtml(data.html)
      else toast.error(data.error ?? 'Failed to load preview')
    } catch {
      toast.error('Failed to load preview')
    } finally {
      setLoadingPreview(false)
    }
  }

  async function handleSend() {
    if (!selectedUser) {
      toast.error('Select a user first')
      return
    }
    setSending(true)
    try {
      const result = await sendTestEmailFull(selected, selectedUser.email, locale)
      if (result.ok) toast.success(`Sent to ${selectedUser.email}`)
      else toast.error(result.error ?? 'Send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex gap-6 min-h-[700px]">
      {/* Left sidebar — email type list */}
      <div className="w-64 shrink-0 space-y-1.5">
        {EMAIL_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setSelected(type.id)
              setPreviewHtml(null)
            }}
            className={`w-full rounded-lg border px-3 py-3 text-left transition ${
              selected === type.id
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{type.icon}</span>
              <span className="text-xs font-semibold">{type.label}</span>
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-600 leading-tight">{type.description}</p>
          </button>
        ))}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Controls */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedType.icon}</span>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{selectedType.label}</p>
              <p className="text-[11px] text-zinc-500">{selectedType.description}</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Locale picker */}
            <select
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value)
                setPreviewHtml(null)
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="it">Italiano</option>
            </select>

            {/* User picker */}
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>

            {/* Preview button */}
            <button
              onClick={handlePreview}
              disabled={loadingPreview}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              {loadingPreview ? 'Loading…' : 'Preview'}
            </button>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || !selectedUser}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {sending ? 'Sending…' : `Send to ${selectedUser?.email ?? '—'}`}
            </button>
          </div>
        </div>

        {/* Preview pane */}
        <div className="flex-1 rounded-xl border border-zinc-800 bg-white overflow-hidden">
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className="h-full w-full min-h-[600px]"
              title="Email preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex h-full min-h-[600px] items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-3">{selectedType.icon}</p>
                <p className="text-sm text-zinc-400 font-medium">{selectedType.label}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Click &quot;Preview&quot; to render this email
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
