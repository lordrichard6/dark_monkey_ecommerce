'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { notifyRestockAlerts } from '@/lib/wishlist-notifications'
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
  tagIds?: string[]
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

  // Add tags
  if (input.tagIds && input.tagIds.length > 0) {
    await supabase.from('product_tags').insert(
      input.tagIds.map(tagId => ({
        product_id: product.id,
        tag_id: tagId
      }))
    )
  }

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

  // Revalidate admin pages
  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/')

  // Revalidate category page if product is assigned to a category
  if (input.categoryId) {
    const { data: category } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', input.categoryId)
      .single()

    if (category?.slug) {
      revalidatePath(`/categories/${category.slug}`)
      console.log(`[Cache] Revalidated category page: /categories/${category.slug}`)
    }
  }

  return { ok: true, productId: product.id }
}

export async function updateStock(variantId: string, quantity: number) {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  console.log('[updateStock] called for variant:', variantId, 'quantity:', quantity)

  const { data: variant, error: varError } = await supabase
    .from('product_variants')
    .select('product_id')
    .eq('id', variantId)
    .single()

  if (varError) console.error('[updateStock] Variant lookup error:', varError)
  if (!variant) console.error('[updateStock] Variant not found:', variantId)

  const { data: existing, error: invError } = await supabase
    .from('product_inventory')
    .select('id, quantity')
    .eq('variant_id', variantId)
    .single()

  if (invError && invError.code !== 'PGRST116') {
    console.error('[updateStock] Inventory lookup error:', invError)
  }

  const previousQty = existing?.quantity ?? 0
  console.log('[updateStock] Existing inventory:', existing, 'Previous qty:', previousQty)

  if (existing) {
    console.log('[updateStock] Updating existing record...')
    const { error } = await supabase
      .from('product_inventory')
      .update({ quantity })
      .eq('variant_id', variantId)
    if (error) {
      console.error('[updateStock] Update error:', error)
      return { ok: false, error: error.message }
    }
  } else {
    console.log('[updateStock] Inserting new record...')
    const { error } = await supabase
      .from('product_inventory')
      .insert({ variant_id: variantId, quantity })
    if (error) {
      console.error('[updateStock] Insert error:', error)
      return { ok: false, error: error.message }
    }
  }

  console.log('[updateStock] Success.')

  if (previousQty === 0 && quantity > 0 && variant?.product_id) {
    await notifyRestockAlerts(variant.product_id).catch((err) => {
      console.warn('Restock alerts failed:', err)
    })
  }

  // Revalidate admin pages
  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/products')
  if (variant?.product_id) {
    revalidatePath(`/admin/products/${variant.product_id}`)

    // Revalidate customer-facing product page (stock updated)
    const { data: product } = await supabase
      .from('products')
      .select('slug, category_id')
      .eq('id', variant.product_id)
      .single()

    if (product?.slug) {
      revalidatePath(`/products/${product.slug}`)
      console.log(`[Cache] Revalidated product page: /products/${product.slug}`)

      // Also revalidate category page (product availability changed)
      if (product.category_id) {
        const { data: category } = await supabase
          .from('categories')
          .select('slug')
          .eq('id', product.category_id)
          .single()

        if (category?.slug) {
          revalidatePath(`/categories/${category.slug}`)
          console.log(`[Cache] Revalidated category page: /categories/${category.slug}`)
        }
      }
    }
  }
  return { ok: true }
}

export async function uploadProductImage(
  productId: string,
  formData: FormData,
  color?: string | null
): Promise<{ ok: true; imageId: string; url: string } | { ok: false; error: string }> {
  try {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Admin not configured' }

    const file = formData.get('file') as File | null
    if (!file) return { ok: false, error: 'No file provided' }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return { ok: false, error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF' }
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: 'File too large. Maximum size: 10MB' }
    }

    // Ensure bucket exists (may be missing on cloud if migration didn't run)
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.some((b) => b.name === 'product-images')) {
        await supabase.storage.createBucket('product-images', {
          public: true,
          fileSizeLimit: '10MB',
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        })
      }
    } catch {
      // Bucket may already exist or listBuckets not allowed; continue with upload
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { ok: false, error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filename)
    const publicUrl = urlData.publicUrl

    // Get current max sort_order
    const { data: existingImages } = await supabase
      .from('product_images')
      .select('sort_order')
      .eq('product_id', productId)
      .order('sort_order', { ascending: false })
      .limit(1)
    const maxSort = existingImages?.[0]?.sort_order ?? -1

    // Insert into product_images table
    const { data: imageRow, error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: publicUrl,
        alt: file.name.replace(/\.[^.]+$/, ''),
        sort_order: maxSort + 1,
        color: color || null,
      })
      .select('id')
      .single()

    if (insertError || !imageRow) {
      // Cleanup: delete uploaded file
      await supabase.storage.from('product-images').remove([filename])
      return { ok: false, error: insertError?.message ?? 'Failed to save image' }
    }

    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath('/')
    return { ok: true, imageId: imageRow.id, url: publicUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return { ok: false, error: message }
  }
}

export async function deleteProductImage(
  imageId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  // Get image to find URL and product_id
  const { data: image } = await supabase
    .from('product_images')
    .select('id, url, product_id')
    .eq('id', imageId)
    .single()

  if (!image) return { ok: false, error: 'Image not found' }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (deleteError) return { ok: false, error: deleteError.message }

  // Try to delete from storage if it's our bucket
  if (image.url.includes('product-images')) {
    const path = image.url.split('/product-images/')[1]
    if (path) {
      await supabase.storage.from('product-images').remove([path])
    }
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${image.product_id}`)
  revalidatePath('/')
  return { ok: true }
}

export async function setPrimaryProductImage(
  imageId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { data: image } = await supabase
    .from('product_images')
    .select('id, product_id')
    .eq('id', imageId)
    .single()

  if (!image) return { ok: false, error: 'Image not found' }

  const { data: allImages } = await supabase
    .from('product_images')
    .select('id, sort_order')
    .eq('product_id', image.product_id)
    .order('sort_order', { ascending: true })

  if (!allImages?.length) return { ok: false, error: 'No images found' }

  const primaryIndex = allImages.findIndex((img) => img.id === imageId)
  if (primaryIndex < 0) return { ok: false, error: 'Image not found' }

  const reordered = [
    { id: imageId, sort_order: 0 },
    ...allImages
      .filter((img) => img.id !== imageId)
      .map((img, i) => ({ id: img.id, sort_order: i + 1 })),
  ]

  for (const { id, sort_order } of reordered) {
    await supabase.from('product_images').update({ sort_order }).eq('id', id)
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${image.product_id}`)
  revalidatePath('/')
  return { ok: true }
}

export async function updateProduct(
  productId: string,
  data: { name?: string; slug?: string; description?: string | null; category_id?: string | null }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const updates: Record<string, unknown> = {}
  if (data.name != null) updates.name = data.name.trim()
  if ('category_id' in data) updates.category_id = data.category_id || null
  if (data.slug != null) {
    const slug = data.slug.trim().toLowerCase().replace(/\s+/g, '-')
    const { data: conflict } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .neq('id', productId)
      .single()
    if (conflict) return { ok: false, error: 'Slug already in use' }
    updates.slug = slug
  }
  if ('description' in data) updates.description = data.description?.trim() || null

  if (Object.keys(updates).length === 0) return { ok: true }

  const { error } = await supabase.from('products').update(updates).eq('id', productId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/')
  return { ok: true }
}

export async function updateProductStatus(
  productId: string,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/')
  return { ok: true }
}

export async function deleteProduct(
  productId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', productId)

  if (error) {
    console.error('Delete product error:', error)
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/products')
  return { ok: true }
}

export async function bulkDeleteProducts(
  productIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', productIds)

  if (error) {
    console.error('Bulk delete products error:', error)
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/products')
  return { ok: true }
}

export async function bulkUpdateProductStatus(
  productIds: string[],
  isActive: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .in('id', productIds)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/admin/dashboard')
  revalidatePath('/')
  return { ok: true }
}

export async function updateProductTags(
  productId: string,
  tagIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Admin not configured' }

    // First, remove existing tags
    const { error: deleteError } = await supabase
      .from('product_tags')
      .delete()
      .eq('product_id', productId)

    if (deleteError) throw deleteError

    // Then, insert new tags
    if (tagIds.length > 0) {
      const { error: insertError } = await supabase
        .from('product_tags')
        .insert(tagIds.map(tagId => ({
          product_id: productId,
          tag_id: tagId
        })))

      if (insertError) throw insertError
    }

    revalidatePath(`/admin/products/${productId}`)
    return { ok: true }
  } catch (err: any) {
    console.error('Update product tags error:', err)
    return { ok: false, error: err.message || 'Failed to update tags' }
  }
}
export async function updateProductImageColor(imageId: string, color: string | null) {
  try {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Database error' }

    const { error } = await supabase
      .from('product_images')
      .update({ color })
      .eq('id', imageId)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/admin/products')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Update failed' }
  }
}

export async function updateProductPrice(
  productId: string,
  priceCents: number,
  compareAtPriceCents?: number | null
) {
  try {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Database error' }

    const { error } = await supabase
      .from('product_variants')
      .update({
        price_cents: priceCents,
        compare_at_price_cents: compareAtPriceCents || null,
      })
      .eq('product_id', productId)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Update failed' }
  }
}
