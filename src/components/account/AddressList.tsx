'use client'

import { useState } from 'react'
import { deleteAddress } from '@/actions/addresses'
import { AddressForm } from './AddressForm'

type Address = {
  id: string
  type: string
  full_name: string
  line1: string
  line2: string | null
  city: string
  postal_code: string
  country: string
  phone: string | null
  is_default: boolean
}

type Props = { addresses: Address[] }

function formatAddress(a: Address) {
  const parts = [a.line1, a.line2, `${a.postal_code} ${a.city}`, a.country].filter(Boolean)
  return parts.join(', ')
}

export function AddressList({ addresses: initial }: Props) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this address?')) return
    await deleteAddress(id)
  }

  return (
    <div className="space-y-4">
      {initial.map((addr) => (
        <div
          key={addr.id}
          className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
        >
          {editing === addr.id ? (
            <AddressForm
              address={addr}
              onCancel={() => setEditing(null)}
              onSuccess={() => setEditing(null)}
            />
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-zinc-50">{addr.full_name}</p>
                  <p className="mt-1 text-sm text-zinc-400">{formatAddress(addr)}</p>
                  {addr.phone && (
                    <p className="mt-1 text-sm text-zinc-500">{addr.phone}</p>
                  )}
                  <span className="mt-2 inline-block rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 capitalize">
                    {addr.type}
                    {addr.is_default && ' · Default'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(addr.id)}
                    className="text-sm text-zinc-400 hover:text-zinc-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      {adding ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
          <AddressForm
            onCancel={() => setAdding(false)}
            onSuccess={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-lg border border-dashed border-zinc-600 px-4 py-3 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-300"
        >
          + Add address
        </button>
      )}
    </div>
  )
}
