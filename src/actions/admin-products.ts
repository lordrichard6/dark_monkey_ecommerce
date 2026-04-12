'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { notifyRestockAlerts } from '@/lib/wishlist-notifications'
import { revalidatePath } from 'next/cache'
import sharp from 'sharp'

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

  const slug = input.slug.trim().toLowerCase().replace(/\s+/g, '-')
  const { data: slugConflict } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()
  if (slugConflict) return { ok: false, error: 'Slug already in use by another product' }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      category_id: input.categoryId || null,
      is_customizable: input.isCustomizable ?? false,
      is_active: true,
    })
    .select('id')
    .single()

  if (productError || !product)
    return { ok: false, error: productError?.message ?? 'Failed to create product' }

  // Add tags (non-fatal: log error but don't block product creation)
  if (input.tagIds && input.tagIds.length > 0) {
    const { error: tagError } = await supabase.from('product_tags').insert(
      input.tagIds.map((tagId) => ({
        product_id: product.id,
        tag_id: tagId,
      }))
    )
    if (tagError) console.error('[createProduct] Failed to add tags:', tagError)
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

  const { error: inventoryError } = await supabase.from('product_inventory').insert({
    variant_id: variant.id,
    quantity: Math.max(0, input.stock),
  })
  if (inventoryError)
    console.error('[createProduct] Failed to create inventory record:', inventoryError)

  if (input.imageUrl?.trim()) {
    const { error: imageError } = await supabase.from('product_images').insert({
      product_id: product.id,
      url: input.imageUrl.trim(),
      alt: input.name,
      sort_order: 0,
    })
    if (imageError) console.error('[createProduct] Failed to save product image:', imageError)
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
    }
  }

  return { ok: true, productId: product.id }
}

export async function updateStock(variantId: string, quantity: number) {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

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

  if (existing) {
    const { error } = await supabase
      .from('product_inventory')
      .update({ quantity })
      .eq('variant_id', variantId)
    if (error) {
      console.error('[updateStock] Update error:', error)
      return { ok: false, error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('product_inventory')
      .insert({ variant_id: variantId, quantity })
    if (error) {
      console.error('[updateStock] Insert error:', error)
      return { ok: false, error: error.message }
    }
  }

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

      // Also revalidate category page (product availability changed)
      if (product.category_id) {
        const { data: category } = await supabase
          .from('categories')
          .select('slug')
          .eq('id', product.category_id)
          .single()

        if (category?.slug) {
          revalidatePath(`/categories/${category.slug}`)
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
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      return { ok: false, error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF, AVIF' }
    }

    // Validate file size (20MB input limit — sharp will shrink it significantly)
    if (file.size > 20 * 1024 * 1024) {
      return { ok: false, error: 'File too large. Maximum input size: 20MB' }
    }

    // Convert to WebP with compression (sharp runs server-side)
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const webpBuffer = await sharp(inputBuffer)
      .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    // Ensure bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.some((b) => b.name === 'product-images')) {
        await supabase.storage.createBucket('product-images', {
          public: true,
          fileSizeLimit: '20MB',
          allowedMimeTypes: ['image/webp'],
        })
      }
    } catch {
      // Bucket may already exist or listBuckets not allowed; continue
    }

    // Always store as .webp
    const filename = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`

    // Upload converted WebP to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filename, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year — content-addressed filename
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
        source: 'custom',
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

export async function createPresignedUploadUrl(
  productId: string,
  filename: string,
  color?: string | null
): Promise<
  { ok: true; uploadUrl: string; storagePath: string; token: string } | { ok: false; error: string }
> {
  try {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Admin not configured' }

    // Ensure bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.some((b) => b.name === 'product-images')) {
        await supabase.storage.createBucket('product-images', {
          public: true,
          fileSizeLimit: '20MB',
          allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/avif'],
        })
      }
    } catch {
      // Bucket may already exist
    }

    // Always store as webp (client will send webp after client-side conversion, or we accept original and convert on register)
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const storagePath = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .createSignedUploadUrl(storagePath)

    if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create upload URL' }

    return {
      ok: true,
      uploadUrl: data.signedUrl,
      storagePath,
      token: data.token,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create upload URL' }
  }
}

export async function registerUploadedImage(
  productId: string,
  storagePath: string,
  originalFilename: string,
  color?: string | null
): Promise<{ ok: true; imageId: string; url: string } | { ok: false; error: string }> {
  try {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Admin not configured' }

    // Get public URL
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(storagePath)
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
        alt: originalFilename.replace(/\.[^.]+$/, ''),
        sort_order: maxSort + 1,
        color: color || null,
        source: 'custom',
      })
      .select('id')
      .single()

    if (insertError || !imageRow) {
      // Cleanup: delete uploaded file
      await supabase.storage.from('product-images').remove([storagePath])
      return { ok: false, error: insertError?.message ?? 'Failed to save image' }
    }

    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath('/')
    return { ok: true, imageId: imageRow.id, url: publicUrl }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to register image' }
  }
}

export async function deleteProductImage(
  imageId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  // Get image to find URL, source, and product_id
  const { data: image } = await supabase
    .from('product_images')
    .select('id, url, product_id, source')
    .eq('id', imageId)
    .single()

  if (!image) return { ok: false, error: 'Image not found' }

  // Delete from database
  const { error: deleteError } = await supabase.from('product_images').delete().eq('id', imageId)

  if (deleteError) return { ok: false, error: deleteError.message }

  // Only delete from Supabase Storage for custom images — Printful CDN images are not ours to delete
  if (image.source === 'custom' && image.url.includes('product-images')) {
    const storagePath = image.url.split('/product-images/')[1]
    if (storagePath) {
      await supabase.storage.from('product-images').remove([storagePath])
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

export async function setSecondaryProductImage(
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

  const primary = allImages[0]
  if (primary.id === imageId) return { ok: false, error: 'Cover image cannot also be Cover 2' }

  const others = allImages.filter((img) => img.id !== primary.id && img.id !== imageId)
  const reordered = [
    { id: primary.id, sort_order: 0 },
    { id: imageId, sort_order: 1 },
    ...others.map((img, i) => ({ id: img.id, sort_order: i + 2 })),
  ]

  for (const { id, sort_order } of reordered) {
    await supabase.from('product_images').update({ sort_order }).eq('id', id)
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${image.product_id}`)
  revalidatePath('/')
  return { ok: true }
}

export async function reorderProductImages(
  imageIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  if (!imageIds.length) return { ok: true }

  // Verify all images belong to the same product (security check)
  const { data: images } = await supabase
    .from('product_images')
    .select('id, product_id')
    .in('id', imageIds)

  if (!images?.length) return { ok: false, error: 'Images not found' }

  const productIds = new Set(images.map((img) => img.product_id))
  if (productIds.size > 1) return { ok: false, error: 'Images must belong to the same product' }

  for (let i = 0; i < imageIds.length; i++) {
    await supabase.from('product_images').update({ sort_order: i }).eq('id', imageIds[i])
  }

  const productId = images[0].product_id
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/')
  return { ok: true }
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string
    slug?: string
    description?: string | null
    description_translations?: Record<string, string> | null
    meta_description?: string | null
    category_id?: string | null
    material_info?: string | null
    care_instructions?: string | null
    print_method?: string | null
    size_guide_url?: string | null
    origin_country?: string | null
    avg_fulfillment_time?: string | null
  }
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
      .is('deleted_at', null)
      .maybeSingle()
    if (conflict) return { ok: false, error: 'Slug already in use' }
    updates.slug = slug
  }
  if ('description' in data) updates.description = data.description?.trim() || null
  if ('description_translations' in data)
    updates.description_translations = data.description_translations ?? {}
  if ('meta_description' in data) updates.meta_description = data.meta_description?.trim() || null
  if ('material_info' in data) updates.material_info = data.material_info?.trim() || null
  if ('care_instructions' in data)
    updates.care_instructions = data.care_instructions?.trim() || null
  if ('print_method' in data) updates.print_method = data.print_method?.trim() || null
  if ('size_guide_url' in data) updates.size_guide_url = data.size_guide_url?.trim() || null
  if ('origin_country' in data) updates.origin_country = data.origin_country?.trim() || null
  if ('avg_fulfillment_time' in data)
    updates.avg_fulfillment_time = data.avg_fulfillment_time?.trim() || null

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

export async function bulkUpdateProductFeatured(
  productIds: string[],
  isFeatured: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase
    .from('products')
    .update({ is_featured: isFeatured })
    .in('id', productIds)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/products')
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
      const { error: insertError } = await supabase.from('product_tags').insert(
        tagIds.map((tagId) => ({
          product_id: productId,
          tag_id: tagId,
        }))
      )

      if (insertError) throw insertError
    }

    revalidatePath(`/admin/products/${productId}`)
    return { ok: true }
  } catch (err: unknown) {
    console.error('Update product tags error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update tags' }
  }
}

export async function createTag(
  name: string
): Promise<{ ok: true; tag: { id: string; name: string } } | { ok: false; error: string }> {
  try {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Admin not configured' }

    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Tag name cannot be empty' }

    const { data, error } = await supabase
      .from('tags')
      .insert({ name: trimmed })
      .select('id, name')
      .single()

    if (error) {
      if (error.code === '23505') return { ok: false, error: 'Tag already exists' }
      throw error
    }

    revalidatePath('/admin/products')
    return { ok: true, tag: data }
  } catch (err: unknown) {
    console.error('Create tag error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create tag' }
  }
}

export async function updateProductImageColor(imageId: string, color: string | null) {
  try {
    const user = await getAdminUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const supabase = getAdminClient()
    if (!supabase) return { ok: false, error: 'Database error' }

    const { error } = await supabase.from('product_images').update({ color }).eq('id', imageId)

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

export async function updateProductImageAlt(
  imageId: string,
  alt: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }
  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }
  const { error } = await supabase
    .from('product_images')
    .update({ alt: alt.trim() || null })
    .eq('id', imageId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function duplicateProduct(
  productId: string
): Promise<{ ok: true; newProductId: string } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }
  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select(
      `
      name, slug, description, category_id, is_customizable,
      material_info, care_instructions, print_method, size_guide_url,
      product_variants (id, sku, name, price_cents, compare_at_price_cents, attributes, sort_order),
      product_tags (tag_id)
    `
    )
    .eq('id', productId)
    .single()

  if (fetchError || !product)
    return { ok: false, error: fetchError?.message ?? 'Product not found' }

  // Find a unique slug
  const baseSlug = `${(product as Record<string, unknown>).slug}-copy`
  let slug = baseSlug
  let counter = 1
  for (;;) {
    const { data: conflict } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle()
    if (!conflict) break
    slug = `${baseSlug}-${counter++}`
  }

  const p = product as Record<string, unknown>
  const { data: newProduct, error: insertError } = await supabase
    .from('products')
    .insert({
      name: `${p.name} (Copy)`,
      slug,
      description: p.description as string | null,
      category_id: p.category_id as string | null,
      is_customizable: p.is_customizable as boolean,
      material_info: p.material_info as string | null,
      care_instructions: p.care_instructions as string | null,
      print_method: p.print_method as string | null,
      size_guide_url: p.size_guide_url as string | null,
      is_active: false,
    })
    .select('id')
    .single()

  if (insertError || !newProduct)
    return { ok: false, error: insertError?.message ?? 'Failed to duplicate' }

  const variants = (product as Record<string, unknown>).product_variants as Array<{
    sku: string | null
    name: string | null
    price_cents: number
    compare_at_price_cents: number | null
    attributes: Record<string, unknown>
    sort_order: number
  }>

  for (const v of variants) {
    const { data: newVariant } = await supabase
      .from('product_variants')
      .insert({
        product_id: newProduct.id,
        sku: v.sku ? `${v.sku}-copy` : null,
        name: v.name,
        price_cents: v.price_cents,
        compare_at_price_cents: v.compare_at_price_cents,
        attributes: v.attributes,
        sort_order: v.sort_order,
      })
      .select('id')
      .single()
    if (newVariant) {
      await supabase.from('product_inventory').insert({ variant_id: newVariant.id, quantity: 0 })
    }
  }

  const tags = (product as Record<string, unknown>).product_tags as Array<{ tag_id: string }>
  if (tags.length > 0) {
    await supabase
      .from('product_tags')
      .insert(tags.map((tag) => ({ product_id: newProduct.id, tag_id: tag.tag_id })))
  }

  revalidatePath('/admin/products')
  return { ok: true, newProductId: newProduct.id }
}

export async function updateProductDualImageMode(
  productId: string,
  dualImageMode: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase
    .from('products')
    .update({ dual_image_mode: dualImageMode })
    .eq('id', productId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/')
  return { ok: true }
}

export async function updateProductFeatured(
  productId: string,
  isFeatured: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase
    .from('products')
    .update({ is_featured: isFeatured })
    .eq('id', productId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/')
  return { ok: true }
}

export async function updateProductExclusive(
  productId: string,
  isExclusive: boolean,
  exclusiveUserId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Admin not configured' }

  const { error } = await supabase
    .from('products')
    .update({
      is_exclusive: isExclusive,
      exclusive_user_id: isExclusive ? exclusiveUserId : null,
    })
    .eq('id', productId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function getAdminUsersList(): Promise<
  { id: string; email: string; displayName: string | null }[]
> {
  const adminUser = await getAdminUser()
  if (!adminUser) return []

  const supabase = getAdminClient()
  if (!supabase) return []

  // Fetch auth users list (up to 1000)
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error || !data) return []

  // Fetch display names from user_profiles
  const ids = data.users.map((u) => u.id)
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name')
    .in('id', ids)

  const profileMap = new Map(
    (profiles ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name])
  )

  return data.users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    displayName: (profileMap.get(u.id) as string | null) ?? null,
  }))
}
