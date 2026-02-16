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

export async function deleteAddress(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/account/addresses')
  return { ok: true }
}

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
