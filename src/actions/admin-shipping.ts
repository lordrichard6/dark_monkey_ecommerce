'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { SHIPPING_ZONES, FREE_SHIPPING_THRESHOLD_CENTS } from '@/lib/shipping'
import type { ShippingZone } from '@/lib/shipping'
import { revalidatePath } from 'next/cache'

export type ShippingZoneRow = {
  id: string
  name: string
  countries: string[]
  first_item_cents: number
  additional_item_cents: number
  sort_order: number
}

/** Fetch all shipping zones from DB, falling back to hardcoded defaults. */
export async function getShippingZones(): Promise<ShippingZoneRow[]> {
  const supabase = getAdminClient()
  if (!supabase) return toRows(SHIPPING_ZONES)

  const { data, error } = await supabase
    .from('shipping_zones')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error || !data?.length) return toRows(SHIPPING_ZONES)
  return data as ShippingZoneRow[]
}

/** Fetch free shipping threshold from store_settings, falling back to hardcoded default. */
export async function getFreeShippingThreshold(): Promise<number> {
  const supabase = getAdminClient()
  if (!supabase) return FREE_SHIPPING_THRESHOLD_CENTS

  const { data } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'free_shipping_threshold_cents')
    .single()

  const val = parseInt(data?.value ?? '', 10)
  return isNaN(val) ? FREE_SHIPPING_THRESHOLD_CENTS : val
}

/** Update a zone's rates. Admin only. */
export async function updateShippingZone(
  id: string,
  firstItemCents: number,
  additionalItemCents: number
): Promise<{ ok: boolean; error?: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  if (firstItemCents < 0 || additionalItemCents < 0)
    return { ok: false, error: 'Prices cannot be negative' }

  const { error } = await supabase
    .from('shipping_zones')
    .update({ first_item_cents: firstItemCents, additional_item_cents: additionalItemCents })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/shipping')
  return { ok: true }
}

/** Fetch a text value from store_settings by key (public read, no auth required). */
export async function getStoreSetting(key: string): Promise<string | null> {
  const supabase = getAdminClient()
  if (!supabase) return null

  const { data } = await supabase.from('store_settings').select('value').eq('key', key).single()
  return data?.value ?? null
}

/** Update a text store_setting. Admin only. */
export async function updateStoreSetting(
  key: string,
  value: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase.from('store_settings').upsert({ key, value })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/settings')
  return { ok: true }
}

/** Update the free shipping threshold. Admin only. */
export async function updateFreeShippingThreshold(
  cents: number
): Promise<{ ok: boolean; error?: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  if (cents < 0) return { ok: false, error: 'Threshold cannot be negative' }

  const { error } = await supabase
    .from('store_settings')
    .upsert({ key: 'free_shipping_threshold_cents', value: String(cents) })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/shipping')
  return { ok: true }
}

// --- helpers ---

function toRows(zones: ShippingZone[]): ShippingZoneRow[] {
  return zones.map((z, i) => ({
    id: z.name.toLowerCase().replace(/\s+/g, '-'),
    name: z.name,
    countries: z.countries,
    first_item_cents: z.firstItemCents,
    additional_item_cents: z.additionalItemCents,
    sort_order: i + 1,
  }))
}
