'use server'

import { SupabaseClient } from '@supabase/supabase-js'
import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import {
  fetchStoreProducts,
  fetchSyncProduct,
  fetchCatalogVariant,
  fetchCatalogProduct,
  isPrintfulConfigured,
  PrintfulSyncProduct,
  PrintfulSyncVariant,
} from '@/lib/printful'
import {
  parsePrintfulDescription,
  extractMaterialInfo,
  formatTechnique,
  formatFulfillmentTime,
} from '@/lib/printful-description'
import { PRINTFUL_CONFIG } from '@/lib/printful/config'
import { revalidatePath } from 'next/cache'

import { printfulCache } from '@/lib/printful/cache'
import { logger } from '@/lib/printful/logger'
import { printfulAnalytics } from '@/lib/printful/analytics'

/** Resolve variant details: price, color codes, etc. */
async function resolveCatalogDetails(
  retailPrice: string | undefined,
  catalogVariantId: number
): Promise<{
  priceCents: number
  rrpCents: number
  colorCode?: string
  colorCode2?: string
  inStock: boolean
}> {
  const retail = parseFloat(retailPrice || '0')
  const details = await fetchCatalogVariant(catalogVariantId)

  let priceCents =
    retail > 0 ? Math.round(retail * 100) : PRINTFUL_CONFIG.CONSTANTS.DEFAULT_RETAIL_PRICE_CENTS
  let rrpCents = priceCents
  let colorCode: string | undefined
  let colorCode2: string | undefined
  let inStock = true // Default to true if fetch fails to avoid hiding products unnecessarily, or false? true is safer for POD.

  if (details.ok && details.variant) {
    const wholesale = parseFloat(details.variant.price || '0')
    if (wholesale > 0) {
      rrpCents = Math.round(wholesale * PRINTFUL_CONFIG.CONSTANTS.WHOLESALE_MARKUP_MULTIPLIER * 100)
    }
    if (retail <= 0 && wholesale > 0) {
      priceCents = rrpCents
    }
    colorCode = details.variant.color_code
    colorCode2 = details.variant.color_code2 || undefined
    inStock = details.variant.in_stock
  }

  return { priceCents, rrpCents, colorCode, colorCode2, inStock }
}

async function ensureProductImages(
  supabase: NonNullable<ReturnType<typeof import('@/lib/supabase/admin').getAdminClient>>,
  productId: string,
  sync_product: PrintfulSyncProduct,
  sync_variants: PrintfulSyncVariant[],
  variantIdMap?: Map<number, string>, // Printful sync_variant_id -> our DB variant UUID
  logs?: string[]
) {
  // 1. Identify "Keeper" URLs with metadata
  const keepers = new Map<
    string,
    { url: string; color: string | null; printful_sync_variant_id?: number }
  >()

  // A. Main Thumbnail
  const thumbUrl = (sync_product.thumbnail_url || sync_variants[0]?.product?.image) ?? undefined
  if (thumbUrl) {
    const key = `${thumbUrl}::null`
    keepers.set(key, { url: thumbUrl, color: null })
  }

  // B. Get mockups from ALL variants
  for (const sv of sync_variants) {
    const color = sv.color || null

    const allFiles = sv.files || []
    // Collect ALL view files: preview composites + individual views (front, back, sleeve, etc.)
    // Previously used exclusive if/else which silently discarded back files when a preview existed.
    const viewFiles = allFiles.filter(
      (f) =>
        (f.type === 'preview' ||
          f.type === 'default' ||
          f.type === 'back' ||
          f.type === 'front' ||
          f.type.includes('sleeve')) &&
        (f.preview_url || f.thumbnail_url)
    )

    if (viewFiles.length > 0) {
      for (const file of viewFiles) {
        const url = file.preview_url || file.thumbnail_url
        if (url) {
          const key = `${url}::${color || 'null'}`
          keepers.set(key, { url, color, printful_sync_variant_id: sv.id })
        }
      }
    } else {
      // Fallback: catalog image if no files have usable preview URLs
      const catalogImage = sv.product?.image
      if (catalogImage) {
        const key = `${catalogImage}::${color || 'null'}`
        keepers.set(key, { url: catalogImage, color, printful_sync_variant_id: sv.id })
      }
    }
  }

  // 2. Fetch IDs of existing Printful images BEFORE any changes (for safe rollback)
  const { data: existingImages } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .eq('source', 'printful')

  const existingIds = existingImages?.map((img) => img.id) ?? []

  // 3. Build and INSERT new keeper images FIRST (insert-first pattern).
  //    If insert fails, old images remain intact — no data loss.
  const toInsert = Array.from(keepers.values()).map((metadata, index) => {
    const { url, color, printful_sync_variant_id } = metadata
    const variant_id =
      printful_sync_variant_id && variantIdMap
        ? variantIdMap.get(printful_sync_variant_id) || null
        : null

    return {
      product_id: productId,
      url,
      alt: color ? `${sync_product.name} (${color})` : sync_product.name,
      sort_order: index,
      color,
      variant_id,
      source: 'printful',
    }
  })

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('product_images').insert(toInsert)
    if (insertError) {
      // Abort without deleting old images — product keeps its existing images
      console.error(
        `[ensureProductImages] Failed to insert new images, keeping existing images:`,
        insertError
      )
      return
    }
  }

  // 4. Delete OLD Printful images only AFTER successful insert (by their fetched IDs)
  if (existingIds.length > 0) {
    await supabase.from('product_images').delete().in('id', existingIds)
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Subset of product_variants row returned by the sync query */
type SyncedVariant = {
  id: string
  printful_sync_variant_id: number | null
  printful_variant_id: number | null
  price_cents: number
  sku: string | null
}

/**
 * Helper to Create or Update Product
 */
async function upsertProduct(
  supabase: SupabaseClient,
  sync_product: PrintfulSyncProduct,
  sync_variants: PrintfulSyncVariant[],
  categoryId: string | null
): Promise<{ productId?: string; error?: string; skipped?: boolean; synced?: boolean }> {
  // Check existing
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('printful_sync_product_id', sync_product.id)
    .single()

  if (existing?.id) {
    const productId = existing.id
    // Restore product if it was soft-deleted, and ensure it's active
    await supabase
      .from('products')
      .update({ deleted_at: null, is_active: true })
      .eq('id', productId)
    return { productId }
  }

  // Secondary check: if a manually-created (unsynced) product has the same slug, link it.
  // IMPORTANT: only match products with no Printful ID — if a product already has one,
  // it's a different Printful product that happens to share the same name.
  const baseSlug = slugify(sync_product.name)
  const { data: existingBySlug } = await supabase
    .from('products')
    .select('id')
    .eq('slug', baseSlug)
    .is('printful_sync_product_id', null)
    .single()

  if (existingBySlug?.id) {
    await supabase
      .from('products')
      .update({ printful_sync_product_id: sync_product.id, deleted_at: null, is_active: true })
      .eq('id', existingBySlug.id)
    return { productId: existingBySlug.id }
  }

  // Create New — slug must be unique; append -N if taken by an unrelated product
  let slug = baseSlug
  let n = 0
  while (true) {
    const { data: slugTaken } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()
    if (!slugTaken) break
    slug = `${baseSlug}-${++n}`
  }

  let description: string | null = null
  let material_info: string | null = null
  let print_method: string | null = null
  let origin_country: string | null = null
  let avg_fulfillment_time: string | null = null

  const catalogProductId = sync_variants[0]?.product?.product_id
  if (catalogProductId != null) {
    const catalog = await fetchCatalogProduct(catalogProductId)
    if (catalog.ok) {
      // Parse raw description: converts bullet text to proper HTML
      const rawDesc = catalog.description?.trim() ?? null
      description = parsePrintfulDescription(rawDesc)

      // Extract material/fabric bullets from description
      material_info = extractMaterialInfo(rawDesc)

      // Print technique from Printful catalog
      print_method = formatTechnique(catalog.techniques ?? [])

      // Fulfillment time
      avg_fulfillment_time = formatFulfillmentTime(catalog.avg_fulfillment_time)

      // Origin country
      origin_country = catalog.origin_country ?? null
    }
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('products')
    .insert({
      category_id: categoryId,
      name: sync_product.name,
      slug,
      description: description ?? undefined,
      material_info: material_info ?? undefined,
      print_method: print_method ?? 'DTF (Direct to Film)',
      origin_country: origin_country ?? undefined,
      avg_fulfillment_time: avg_fulfillment_time ?? undefined,
      is_customizable: false,
      is_active: true,
      printful_sync_product_id: sync_product.id,
    })
    .select('id')
    .single()

  if (insertErr || !inserted?.id) {
    return { error: insertErr?.message || 'Failed to insert product', skipped: true }
  }

  return { productId: inserted.id, synced: true }
}

/**
 * Helper to Sync Variants
 */
async function syncVariants(
  supabase: SupabaseClient,
  productId: string,
  sync_product: PrintfulSyncProduct,
  sync_variants: PrintfulSyncVariant[]
): Promise<{ variantIdMap?: Map<number, string>; error?: string }> {
  // Clean up orphaned variants from OTHER products that hold the same Printful IDs.
  // This happens when a product was deleted but its variants were not, causing
  // unique constraint violations on printful_sync_variant_id when re-syncing.
  const pfSyncIds = sync_variants.map((sv) => sv.id)
  if (pfSyncIds.length > 0) {
    await supabase
      .from('product_variants')
      .delete()
      .in('printful_sync_variant_id', pfSyncIds)
      .neq('product_id', productId)
  }

  const { data: existingVariants } = await supabase
    .from('product_variants')
    .select('id, printful_sync_variant_id, printful_variant_id, price_cents, sku')
    .eq('product_id', productId)

  // Primary lookup: by printful_sync_variant_id (already synced variants)
  const existingByPfId = new Map<number, SyncedVariant>(
    (existingVariants ?? [])
      .filter((v: SyncedVariant) => v.printful_sync_variant_id != null)
      .map((v: SyncedVariant) => [v.printful_sync_variant_id!, v])
  )

  // Fallback lookup: by SKU (catches variants that exist but have null printful_sync_variant_id)
  const existingBySku = new Map<string, SyncedVariant>(
    (existingVariants ?? [])
      .filter((v: SyncedVariant) => v.sku != null)
      .map((v: SyncedVariant) => [v.sku!, v])
  )

  // Resolve details
  const variantPromises = sync_variants.map((sv) =>
    resolveCatalogDetails(sv.retail_price, sv.variant_id)
  )
  const variantDetails = await Promise.all(variantPromises)

  for (let i = 0; i < sync_variants.length; i++) {
    const sv = sync_variants[i]
    const { priceCents, rrpCents, colorCode, colorCode2, inStock } = variantDetails[i]

    const attrs: Record<string, string | number> = {}
    if (sv.size) attrs.size = sv.size
    if (sv.color) attrs.color = sv.color
    if (colorCode) attrs.color_code = colorCode
    if (colorCode2) attrs.color_code2 = colorCode2
    if (rrpCents) attrs.rrp_cents = rrpCents

    const existingVar = existingByPfId.get(sv.id) ?? existingBySku.get(sv.sku ?? '')
    if (existingVar) {
      await supabase
        .from('product_variants')
        .update({
          price_cents: existingVar.price_cents === 0 ? priceCents : existingVar.price_cents,
          attributes: attrs,
          // Always ensure Printful IDs are written — they may be null on older variants
          printful_sync_variant_id: sv.id,
          printful_variant_id: sv.variant_id ?? existingVar.printful_variant_id ?? null,
        })
        .eq('id', existingVar.id)

      // Update inventory even for existing variants
      await supabase.from('product_inventory').upsert(
        {
          variant_id: existingVar.id,
          quantity: inStock ? PRINTFUL_CONFIG.CONSTANTS.DEFAULT_INVENTORY_QTY : 0,
        },
        { onConflict: 'variant_id' }
      )
      continue
    }

    const { data: newVar, error: varErr } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        sku: sv.sku ?? null,
        name: sv.product?.name ?? `${sync_product.name} variant`,
        price_cents: priceCents,
        attributes: attrs,
        sort_order: i + 1,
        printful_sync_variant_id: sv.id,
        printful_variant_id: sv.variant_id ?? null,
      })
      .select('id')
      .single()

    if (newVar?.id) {
      await supabase.from('product_inventory').upsert(
        {
          variant_id: newVar.id,
          quantity: inStock ? PRINTFUL_CONFIG.CONSTANTS.DEFAULT_INVENTORY_QTY : 0,
        },
        { onConflict: 'variant_id' }
      )
    } else if (varErr) {
      return { error: `Variant sync failed: ${varErr.message}` }
    }
  }

  // Re-fetch for map
  const { data: allVariants } = await supabase
    .from('product_variants')
    .select('id, printful_sync_variant_id')
    .eq('product_id', productId)

  const variantIdMap = new Map<number, string>()
  for (const v of allVariants || []) {
    if (v.printful_sync_variant_id) {
      variantIdMap.set(v.printful_sync_variant_id, v.id)
    }
  }

  return { variantIdMap }
}

export async function getPrintfulSyncStats(): Promise<{
  ok: boolean
  total?: number
  existingCount?: number
  newCount?: number
  newProducts?: { id: number; name: string }[]
  error?: string
}> {
  if (!isPrintfulConfigured()) return { ok: false, error: 'Printful not configured' }

  // Printful API max limit is 100 — paginate to collect all product IDs + names
  const PAGE_SIZE = 100
  const allProducts: { id: number; name: string }[] = []
  let offset = 0
  let total = 0

  while (true) {
    const res = await fetchStoreProducts(offset, PAGE_SIZE)
    if (!res.ok) return { ok: false, error: res.error }
    total = res.total ?? 0
    const page = (res.products ?? []).map((p) => ({ id: p.id, name: p.name }))
    allProducts.push(...page)
    if (allProducts.length >= total || page.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  if (allProducts.length === 0)
    return { ok: true, total: 0, existingCount: 0, newCount: 0, newProducts: [] }

  // Compare with products already in the database
  const supabase = getAdminClient()
  if (!supabase)
    return { ok: true, total, existingCount: 0, newCount: total, newProducts: allProducts }

  const printfulIds = allProducts.map((p) => p.id)
  const { data: existing } = await supabase
    .from('products')
    .select('printful_sync_product_id')
    .in('printful_sync_product_id', printfulIds)
    .is('deleted_at', null) // soft-deleted products must be re-syncable

  const existingSet = new Set((existing ?? []).map((p) => p.printful_sync_product_id))
  const newProducts = allProducts.filter((p) => !existingSet.has(p.id))
  const existingCount = allProducts.length - newProducts.length

  return { ok: true, total, existingCount, newCount: newProducts.length, newProducts }
}

export async function getPrintfulSyncProductIds(
  limit = 100,
  offset = 0
): Promise<{
  ok: boolean
  products?: { id: number; name: string }[]
  total?: number
  error?: string
}> {
  if (!isPrintfulConfigured()) return { ok: false, error: 'Printful not configured' }
  const res = await fetchStoreProducts(offset, limit)
  if (!res.ok) return { ok: false, error: res.error }
  return {
    ok: true,
    products: res.products?.map((p) => ({ id: p.id, name: p.name })),
    total: res.total,
  }
}

export async function syncPrintfulProductById(
  pfProductId: number
): Promise<{ ok: boolean; error?: string; product?: { id: string; name: string } }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Database not configured' }

  const detailRes = await fetchSyncProduct(pfProductId)
  if (!detailRes.ok || !detailRes.product?.sync_variants?.length) {
    return { ok: false, error: detailRes.error ?? 'Product not found or has no variants' }
  }

  const { sync_product, sync_variants } = detailRes.product

  const { data: defaultCat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'apparel')
    .single()
  const categoryId = defaultCat?.id ?? null

  // 1. Upsert Product
  const productRes = await upsertProduct(supabase, sync_product, sync_variants, categoryId)
  if (!productRes.productId)
    return { ok: false, error: productRes.error || 'Failed to sync product' }

  // 2. Sync Variants
  const variantRes = await syncVariants(supabase, productRes.productId, sync_product, sync_variants)
  if (variantRes.error) return { ok: false, error: variantRes.error }

  // 3. Sync Images
  if (variantRes.variantIdMap) {
    await ensureProductImages(
      supabase,
      productRes.productId,
      sync_product,
      sync_variants,
      variantRes.variantIdMap
    )
  }

  return {
    ok: true,
    product: { id: productRes.productId, name: sync_product.name },
  }
}

export async function syncPrintfulProducts(
  debug = false,
  onlyLatest = false
): Promise<{
  ok: boolean
  synced?: number
  skipped?: number
  error?: string
  logs?: string[]
}> {
  const startTime = Date.now()
  logger.info('Starting Printful product sync', { debug, onlyLatest, operation: 'sync' })
  printfulCache.invalidate(/^catalog:/)

  const isCli = process.env.IS_CLI_SYNC === 'true'
  const user = isCli ? { id: 'cli-admin', email: 'cli@example.com' } : await getAdminUser()

  if (!user) return { ok: false, error: 'Unauthorized' }
  if (!isPrintfulConfigured())
    return { ok: false, error: 'Printful not configured (PRINTFUL_API_TOKEN)' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Database not configured' }

  const logs: string[] = []
  let synced = 0
  let skipped = 0
  let totalFromApi = 0
  let firstError: string | null = null
  let offset = 0
  const limit = onlyLatest ? 1 : PRINTFUL_CONFIG.CONSTANTS.SYNC_LIMIT

  while (true) {
    const listRes = await fetchStoreProducts(offset, limit)

    if (debug) {
      logger.debug('Fetched store products', {
        offset,
        limit,
        count: listRes.products?.length ?? 0,
        operation: 'sync',
      })
      logger.info(
        `Fetched store products offset=${offset} limit=${limit} count=${listRes.products?.length ?? 0}`,
        { operation: 'sync' }
      )
    }
    if (!listRes.ok) {
      return { ok: false, error: listRes.error ?? 'Printful API error', logs }
    }
    if (!listRes.products?.length) {
      if (offset === 0) {
        return {
          ok: true,
          synced: 0,
          skipped: 0,
          error: 'No products in your Printful store.',
          logs,
        }
      }
      break
    }
    if (offset === 0) totalFromApi = listRes.total ?? 0

    // Batched Processing
    const BATCH_SIZE = 5
    for (let i = 0; i < listRes.products.length; i += BATCH_SIZE) {
      const batch = listRes.products.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (pf) => {
          const syncRes = await syncPrintfulProductById(pf.id)
          if (!syncRes.ok) {
            if (!firstError) firstError = syncRes.error ?? 'Unknown error'
            skipped++
            return
          }
          synced++
          const msg = `Syncing product: ${syncRes.product?.name} (ID: ${pf.id})`
          console.log(msg)
          logs.push(msg)
        })
      )

      if (onlyLatest && i === 0) break
    }

    if (onlyLatest) break

    offset += limit
    if (listRes.products.length < limit) break
  }

  try {
    revalidatePath('/admin/products')
    revalidatePath('/admin/dashboard')
    revalidatePath('/')
  } catch {
    // Ignored: revalidatePath fails in standalone scripts
    if (debug) console.warn('revalidatePath skipped (script context)')
  }

  const duration = Date.now() - startTime
  printfulAnalytics.trackSyncStats({
    synced,
    skipped,
    totalFromApi,
    duration,
    errors: firstError ? [firstError] : undefined,
  })

  return {
    ok: true,
    synced,
    skipped,
    error:
      synced > 0 ? undefined : (firstError ?? (totalFromApi === 0 ? 'No products' : undefined)),
    logs,
  }
}
