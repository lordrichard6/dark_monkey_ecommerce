'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Edit, Trash2, Copy, Check, Loader2, ShoppingBag, Tag } from 'lucide-react'
import { deleteAddress, setDefaultAddress } from '@/actions/addresses'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const COUNTRY_FLAGS: Record<string, string> = {
  AT: '🇦🇹',
  BE: '🇧🇪',
  BR: '🇧🇷',
  CA: '🇨🇦',
  CN: '🇨🇳',
  HR: '🇭🇷',
  CZ: '🇨🇿',
  DK: '🇩🇰',
  FI: '🇫🇮',
  FR: '🇫🇷',
  DE: '🇩🇪',
  GR: '🇬🇷',
  HU: '🇭🇺',
  IN: '🇮🇳',
  IE: '🇮🇪',
  IT: '🇮🇹',
  JP: '🇯🇵',
  LU: '🇱🇺',
  MX: '🇲🇽',
  NL: '🇳🇱',
  NZ: '🇳🇿',
  NO: '🇳🇴',
  PL: '🇵🇱',
  PT: '🇵🇹',
  RO: '🇷🇴',
  SK: '🇸🇰',
  SI: '🇸🇮',
  ZA: '🇿🇦',
  ES: '🇪🇸',
  SE: '🇸🇪',
  CH: '🇨🇭',
  TR: '🇹🇷',
  UA: '🇺🇦',
  GB: '🇬🇧',
  US: '🇺🇸',
}

type Address = {
  id: string
  type: 'shipping' | 'billing'
  label?: string | null
  full_name: string
  line1: string
  line2?: string | null
  city: string
  postal_code: string
  country: string
  phone?: string | null
  is_default: boolean
  order_count?: number
}

export function AddressCard({ address }: { address: Address }) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSettingDefault, setIsSettingDefault] = useState(false)
  const [copied, setCopied] = useState(false)

  const flag = COUNTRY_FLAGS[address.country] ?? ''

  const formattedAddress = [
    address.full_name,
    address.line1,
    address.line2,
    `${address.postal_code} ${address.city}`,
    `${flag} ${address.country}`,
    address.phone,
  ]
    .filter(Boolean)
    .join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedAddress)
      setCopied(true)
      toast.success('Address copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteAddress(address.id)
    if (result.ok) {
      toast.success('Address deleted')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to delete address')
      setShowDeleteConfirm(false)
    }
    setIsDeleting(false)
  }

  const handleSetDefault = async () => {
    setIsSettingDefault(true)
    const result = await setDefaultAddress(address.id, address.type)
    if (result.ok) {
      toast.success('Default address updated')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to update default')
    }
    setIsSettingDefault(false)
  }

  return (
    <div className="relative flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700">
      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-zinc-900/95 backdrop-blur-sm">
          <Trash2 className="h-8 w-8 text-red-400" />
          <p className="text-center text-sm font-medium text-zinc-200">Delete this address?</p>
          <p className="text-center text-xs text-zinc-500">This cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Card Header */}
      <div>
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="h-4 w-4 flex-shrink-0 text-zinc-500" />
            <span className="font-semibold text-zinc-100 capitalize">{address.type}</span>
            {address.label && (
              <span className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                <Tag className="h-3 w-3" />
                {address.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {address.is_default && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500 border border-amber-500/20">
                Default
              </span>
            )}
            {/* Copy button */}
            <button
              onClick={handleCopy}
              title="Copy address"
              className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Address Lines */}
        <div className="space-y-1 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200">{address.full_name}</p>
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.postal_code} {address.city}
          </p>
          <p>
            {flag} {address.country}
          </p>
          {address.phone && <p className="mt-2 text-xs text-zinc-500">{address.phone}</p>}
        </div>

        {/* Order count hint */}
        {typeof address.order_count === 'number' && address.order_count > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-600">
            <ShoppingBag className="h-3 w-3" />
            Used in {address.order_count} {address.order_count === 1 ? 'order' : 'orders'}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center gap-4 border-t border-zinc-800 pt-4">
        <Link
          href={`/account/addresses/${address.id}`}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Link>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>

        {!address.is_default && (
          <button
            onClick={handleSetDefault}
            disabled={isSettingDefault}
            className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-white hover:underline disabled:opacity-50"
          >
            {isSettingDefault && <Loader2 className="h-3 w-3 animate-spin" />}
            Set as Default
          </button>
        )}
      </div>
    </div>
  )
}
