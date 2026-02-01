'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDiscount } from '@/actions/admin-discounts'

export function CreateDiscountForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    const result = await createDiscount({
      code: (formData.get('code') as string).trim().toUpperCase(),
      type: formData.get('type') as 'percentage' | 'fixed',
      valueCents:
        formData.get('type') === 'percentage'
          ? Math.round(parseFloat(formData.get('value') as string) * 100)
          : Math.round(parseFloat(formData.get('value') as string) * 100),
      minOrderCents: Math.round(parseFloat(formData.get('minOrder') as string || '0') * 100),
      maxUses: parseInt(formData.get('maxUses') as string, 10) || null,
    })
    setLoading(false)
    if (result.ok) {
      router.push('/admin/discounts')
    } else {
      setError(result.error ?? 'Failed to create')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300">Code</label>
        <input
          name="code"
          required
          placeholder="SAVE10"
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono uppercase text-zinc-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Type</label>
        <select
          name="type"
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount (CHF)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Value</label>
        <input
          name="value"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="10 (for 10% or CHF 10)"
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Min order (CHF)</label>
        <input
          name="minOrder"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Max uses (optional)</label>
        <input
          name="maxUses"
          type="number"
          min="1"
          placeholder="Unlimited"
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create discount'}
      </button>
    </form>
  )
}
