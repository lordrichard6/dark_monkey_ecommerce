'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  full_name: z.string().min(1, 'Full name is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  is_default: z.boolean().default(false),
})

export type AddressFormData = z.infer<typeof addressSchema>

/**
 * Adds a new shipping or billing address for the authenticated user.
 * Validates input against `addressSchema` (Zod). If `is_default` is true,
 * any existing default address of the same type is unset first.
 * Revalidates `/account/addresses` on success.
 *
 * @param data - Address form data validated by `AddressFormData` (Zod schema).
 * @returns `{ ok: true }` on success or `{ ok: false, error }` on validation or DB failure.
 */
export async function addAddress(data: AddressFormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Unauthorized' }
  }

  const result = addressSchema.safeParse(data)
  if (!result.success) {
    return { ok: false, error: result.error.message }
  }

  // If setting as default, unset other defaults of same type
  if (data.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('type', data.type)
  }

  const { error } = await supabase.from('addresses').insert({
    user_id: user.id,
    ...data,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/account/addresses')
  return { ok: true }
}

/**
 * Updates an existing address record owned by the authenticated user.
 * Validates input via Zod and enforces row-level security by requiring `user_id` match.
 * If `is_default` is true, unsets any existing default of the same type first.
 *
 * @param id - UUID of the address to update.
 * @param data - Updated address form data validated by `AddressFormData`.
 * @returns `{ ok: true }` on success or `{ ok: false, error }` on validation or DB failure.
 */
export async function updateAddress(id: string, data: AddressFormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Unauthorized' }
  }

  const result = addressSchema.safeParse(data)
  if (!result.success) {
    return { ok: false, error: result.error.message }
  }

  // If setting as default, unset other defaults of same type
  if (data.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('type', data.type)
  }

  const { error } = await supabase
    .from('addresses')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id) // Security check

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/account/addresses')
  return { ok: true }
}

/**
 * Permanently deletes an address record owned by the authenticated user.
 * Enforces ownership via `user_id` match (RLS double-check at the action layer).
 * Revalidates `/account/addresses` on success.
 *
 * @param id - UUID of the address to delete.
 * @returns `{ ok: true }` on success or `{ ok: false, error }` if not authenticated or DB error.
 */
export async function deleteAddress(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Unauthorized' }
  }

  const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/account/addresses')
  return { ok: true }
}

/**
 * Sets an address as the default for a given address type (shipping or billing).
 * First unsets all existing defaults of that type, then marks the specified address as default.
 * Revalidates `/account/addresses` on success.
 *
 * @param id - UUID of the address to set as default.
 * @param type - Address type: `'shipping'` or `'billing'`.
 * @returns `{ ok: true }` on success or `{ ok: false, error }` if not authenticated or DB error.
 */
export async function setDefaultAddress(id: string, type: 'shipping' | 'billing') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Unauthorized' }
  }

  // Unset all defaults for this type
  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .eq('type', type)

  // Set new default
  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/account/addresses')
  return { ok: true }
}
