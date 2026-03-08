'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'

export async function createDiscount(input: {
  code: string
  type: 'percentage' | 'fixed'
  valueCents: number
  minOrderCents?: number
  maxUses?: number | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  // Validate code format: alphanumeric + hyphens, 3–20 chars, uppercase
  const code = input.code.trim().toUpperCase()
  if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
    return {
      ok: false,
      error: 'Discount code must be 3–20 characters and contain only letters, numbers, or hyphens',
    }
  }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase.from('discounts').insert({
    code,
    type: input.type,
    value_cents: input.valueCents,
    min_order_cents: input.minOrderCents ?? 0,
    max_uses: input.maxUses ?? null,
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  return { ok: true }
}
