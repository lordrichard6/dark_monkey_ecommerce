'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { addAddress, updateAddress, type AddressFormData } from '@/actions/addresses'

type AddressRow = {
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

type Props = {
  address?: AddressRow | null
  onCancel?: () => void
  onSuccess?: () => void
}

const defaultValues: AddressFormData = {
  type: 'shipping',
  full_name: '',
  line1: '',
  line2: '',
  city: '',
  postal_code: '',
  country: 'CH',
  phone: '',
  is_default: false,
}

export function AddressForm({ address, onCancel, onSuccess }: Props) {
  const t = useTranslations('account')
  const [form, setForm] = useState<AddressFormData>(
    address
      ? {
        type: (address.type as 'shipping' | 'billing') ?? 'shipping',
        full_name: address.full_name,
        line1: address.line1,
        line2: address.line2 ?? '',
        city: address.city,
        postal_code: address.postal_code,
        country: address.country || 'CH',
        phone: address.phone ?? '',
        is_default: address.is_default,
      }
      : defaultValues
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = address
      ? await updateAddress(address.id, form)
      : await addAddress(form)
    setLoading(false)
    if (result.ok) {
      onSuccess?.()
    } else {
      setError(result.error ?? t('failed'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300">{t('type')}</label>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as 'shipping' | 'billing' })}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        >
          <option value="shipping">{t('shipping')}</option>
          <option value="billing">{t('billing')}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">{t('fullName')}</label>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Address line 1</label>
        <input
          type="text"
          value={form.line1}
          onChange={(e) => setForm({ ...form, line1: e.target.value })}
          required
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Address line 2</label>
        <input
          type="text"
          value={form.line2}
          onChange={(e) => setForm({ ...form, line2: e.target.value })}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300">{t('city')}</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
            className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">{t('postalCode')}</label>
          <input
            type="text"
            value={form.postal_code}
            onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
            required
            className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">{t('country')}</label>
        <input
          type="text"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">{t('phone')}</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
          className="rounded border-zinc-600 bg-zinc-800"
        />
        <span className="text-sm text-zinc-300">{t('defaultAddress')}</span>
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? t('saving') : address ? t('updateAddress') : t('addAddressButton')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-zinc-400 hover:text-zinc-300">
            {t('cancel')}
          </button>
        )}
      </div>
    </form>
  )
}
