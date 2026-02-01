'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'

export async function createProduct(input: {
  name: string
  slug: string
  description?: string
  categoryId?: string
  isCustomizable?: boolean
  variantName: string
  priceCents: number
  stock: number
  imageUrl?: string
}): Promise<{ ok: true; productId: string } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: input.description?.trim() || null,
      category_id: input.categoryId || null,
      is_customizable: input.isCustomizable ?? false,
      is_active: true,
    })
    .select('id')
    .single()

  if (productError || !product) return { ok: false, error: productError?.message ?? 'Failed to create product' }

  const sku = `SKU-${product.id.slice(0, 8).toUpperCase()}`
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .insert({
      product_id: product.id,
      sku,
      name: input.variantName.trim() || 'Default',
      price_cents: input.priceCents,
      attributes: {},
      sort_order: 0,
    })
    .select('id')
    .single()

  if (variantError || !variant) {
    await supabase.from('products').delete().eq('id', product.id)
    return { ok: false, error: variantError?.message ?? 'Failed to create variant' }
  }

  await supabase.from('product_inventory').insert({
    variant_id: variant.id,
    quantity: Math.max(0, input.stock),
  })

  if (input.imageUrl?.trim()) {
    await supabase.from('product_images').insert({
      product_id: product.id,
      url: input.imageUrl.trim(),
      alt: input.name,
      sort_order: 0,
    })
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { ok: true, productId: product.id }
}

export async function updateStock(variantId: string, quantity: number) {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { data: existing } = await supabase
    .from('product_inventory')
    .select('id')
    .eq('variant_id', variantId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('product_inventory')
      .update({ quantity })
      .eq('variant_id', variantId)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('product_inventory')
      .insert({ variant_id: variantId, quantity })
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/products`)
  return { ok: true }
}
