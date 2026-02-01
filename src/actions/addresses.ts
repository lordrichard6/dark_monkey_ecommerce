'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AddressInput = {
  type: 'shipping' | 'billing'
  fullName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  phone?: string
  isDefault?: boolean
}

export async function createAddress(input: AddressInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase.from('addresses').insert({
    user_id: user.id,
    type: input.type,
    full_name: input.fullName.trim(),
    line1: input.line1.trim(),
    line2: input.line2?.trim() || null,
    city: input.city.trim(),
    postal_code: input.postalCode.trim(),
    country: input.country.trim() || 'CH',
    phone: input.phone?.trim() || null,
    is_default: input.isDefault ?? false,
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/account')
  return { ok: true }
}

export async function updateAddress(id: string, input: AddressInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('addresses')
    .update({
      type: input.type,
      full_name: input.fullName.trim(),
      line1: input.line1.trim(),
      line2: input.line2?.trim() || null,
      city: input.city.trim(),
      postal_code: input.postalCode.trim(),
      country: input.country.trim() || 'CH',
      phone: input.phone?.trim() || null,
      is_default: input.isDefault ?? false,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/account')
  return { ok: true }
}

export async function deleteAddress(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/account')
  return { ok: true }
}
