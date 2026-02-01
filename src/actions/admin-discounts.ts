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

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase.from('discounts').insert({
    code: input.code,
    type: input.type,
    value_cents: input.valueCents,
    min_order_cents: input.minOrderCents ?? 0,
    max_uses: input.maxUses ?? null,
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  return { ok: true }
}
