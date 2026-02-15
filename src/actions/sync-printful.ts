'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import {
  fetchStoreProducts,
  fetchSyncProduct,
  fetchCatalogVariant,
  fetchCatalogProduct,
  isPrintfulConfigured,
  PrintfulSyncProduct,
  PrintfulSyncVariant
} from '@/lib/printful'
import { PRINTFUL_CONFIG } from '@/lib/printful/config'
import { revalidatePath } from 'next/cache'
import * as fs from 'fs'
import * as path from 'path'
import { printfulCache } from '@/lib/printful/cache'
import { logger } from '@/lib/printful/logger'
import { printfulAnalytics } from '@/lib/printful/analytics'

/** Resolve variant details: price, color codes, etc. */
async function resolveCatalogDetails(
  retailPrice: string | undefined,
  catalogVariantId: number
): Promise<{ priceCents: number; rrpCents: number; colorCode?: string; colorCode2?: string }> {
  const retail = parseFloat(retailPrice || '0')
  const details = await fetchCatalogVariant(catalogVariantId)

  let priceCents = retail > 0 ? Math.round(retail * 100) : PRINTFUL_CONFIG.CONSTANTS.DEFAULT_RETAIL_PRICE_CENTS
  let rrpCents = priceCents
  let colorCode: string | undefined
  let colorCode2: string | undefined

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
  }

  return { priceCents, rrpCents, colorCode, colorCode2 }
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
  const keepers = new Map<string, { url: string; color: string | null; printful_sync_variant_id?: number }>()

  // A. Main Thumbnail
  const thumbUrl = (sync_product.thumbnail_url || sync_variants[0]?.product?.image) ?? undefined
  if (thumbUrl) {
    const key = `${thumbUrl}::null`
    keepers.set(key, { url: thumbUrl, color: null })
  }

  // B. Get mockups from ALL variants
  for (const sv of sync_variants) {
    const color = sv.color || null

    if (sv.name.includes('Carolina Blue')) {
      const logMsg = `[ensureProductImages] Processing Carolina Blue files (Variant ID: ${sv.id}):\n` +
        (sv.files ? sv.files.map(f => `  - Type: ${f.type}, URL: ${f.preview_url || f.thumbnail_url}`).join('\n') : '  - No files') + '\n';
      // console.log(logMsg);
      if (logs) logs.push(logMsg);
      try {
        fs.appendFileSync(path.join(process.cwd(), 'sync-debug.log'), logMsg);
      } catch (e) { console.error('Failed to write to log file', e); }
    }

    const allFiles = sv.files || []
    const previewFiles = allFiles.filter(f => f.type === 'preview' && (f.preview_url || f.thumbnail_url))
    const otherFiles = allFiles.filter(f =>
      (f.type === 'default' || f.type === 'back' || f.type === 'front' || f.type.includes('sleeve')) &&
      (f.preview_url || f.thumbnail_url) &&
      f.type !== 'preview'
    )

    if (previewFiles.length > 0) {
      for (const file of previewFiles) {
        const url = file.preview_url || file.thumbnail_url
        if (url) {
          const key = `${url}::${color || 'null'}`
          keepers.set(key, { url, color, printful_sync_variant_id: sv.id })
        }
      }
    } else if (otherFiles.length > 0) {
      for (const file of otherFiles) {
        const url = file.preview_url || file.thumbnail_url
        if (url) {
          const key = `${url}::${color || 'null'}`
          keepers.set(key, { url, color, printful_sync_variant_id: sv.id })
        }
      }
    } else {
      const catalogImage = sv.product?.image
      if (catalogImage) {
        const key = `${catalogImage}::${color || 'null'}`
        keepers.set(key, { url: catalogImage, color, printful_sync_variant_id: sv.id })
      }
    }
  }

  // 2. DELETE ALL existing Printful images for this product
  const { data: deletedImages } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId)
    .like('url', '%printful.com%')
    .select('id')

  // console.log(`[ensureProductImages] Deleted ${deletedImages?.length || 0} old Printful images for product ${productId}`)

  // 3. Insert ALL keeper images with variant mapping
  const toInsert = Array.from(keepers.values())
    .map((metadata, index) => {
      const { url, color, printful_sync_variant_id } = metadata
      const variant_id = printful_sync_variant_id && variantIdMap
        ? variantIdMap.get(printful_sync_variant_id) || null
        : null

      return {
        product_id: productId,
        url,
        alt: color ? `${sync_product.name} (${color})` : sync_product.name,
        sort_order: index,
        color,
        variant_id,
      }
    })

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('product_images').insert(toInsert)
    if (insertError) {
      console.error(`[ensureProductImages] Failed to insert images:`, insertError)
    } else {
      // console.log(`[ensureProductImages] Inserted ${toInsert.length} images`)
    }
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}


/**
 * Helper to Create or Update Product
 */
async function upsertProduct(
  supabase: any,
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

  // Create New
  let slug = slugify(sync_product.name)
  let n = 0
  while (true) {
    const { data: slugTaken } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()
    if (!slugTaken) break
    slug = `${slugify(sync_product.name)}-${++n}`
  }

  let description: string | null = null
  const catalogProductId = sync_variants[0]?.product?.product_id
  if (catalogProductId != null) {
    const catalog = await fetchCatalogProduct(catalogProductId)
    if (catalog.ok && catalog.description?.trim()) {
      description = catalog.description.trim()
    }
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('products')
    .insert({
      category_id: categoryId,
      name: sync_product.name,
      slug,
      description: description ?? undefined,
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
  supabase: any,
  productId: string,
  sync_product: PrintfulSyncProduct,
  sync_variants: PrintfulSyncVariant[]
): Promise<{ variantIdMap?: Map<number, string>; error?: string }> {

  const { data: existingVariants } = await supabase
    .from('product_variants')
    .select('id, printful_sync_variant_id, price_cents')
    .eq('product_id', productId)

  const existingByPfId = new Map(
    (existingVariants ?? [])
      .filter((v: any) => v.printful_sync_variant_id != null)
      .map((v: any) => [v.printful_sync_variant_id, v])
  )

  // Resolve details
  const variantPromises = sync_variants.map(sv =>
    resolveCatalogDetails(sv.retail_price, sv.variant_id)
  )
  const variantDetails = await Promise.all(variantPromises)

  for (let i = 0; i < sync_variants.length; i++) {
    const sv = sync_variants[i]
    const { priceCents, rrpCents, colorCode, colorCode2 } = variantDetails[i]

    const attrs: Record<string, any> = {}
    if (sv.size) attrs.size = sv.size
    if (sv.color) attrs.color = sv.color
    if (colorCode) attrs.color_code = colorCode
    if (colorCode2) attrs.color_code2 = colorCode2
    if (rrpCents) attrs.rrp_cents = rrpCents

    const existingVar = existingByPfId.get(sv.id) as any
    if (existingVar) {
      await supabase
        .from('product_variants')
        .update({
          price_cents: existingVar.price_cents === 0 ? priceCents : existingVar.price_cents,
          attributes: attrs
        })
        .eq('id', existingVar.id)
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
        { variant_id: newVar.id, quantity: PRINTFUL_CONFIG.CONSTANTS.DEFAULT_INVENTORY_QTY },
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


export async function syncPrintfulProducts(debug = false, onlyLatest = false): Promise<{
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
  if (!isPrintfulConfigured()) return { ok: false, error: 'Printful not configured (PRINTFUL_API_TOKEN)' }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Database not configured' }

  const logs: string[] = []
  let synced = 0
  let skipped = 0
  let totalFromApi = 0
  let firstError: string | null = null
  let offset = 0
  const limit = onlyLatest ? 1 : PRINTFUL_CONFIG.CONSTANTS.SYNC_LIMIT

  const { data: defaultCat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'apparel')
    .single()
  const categoryId = defaultCat?.id ?? null

  while (true) {
    const listRes = await fetchStoreProducts(offset, limit)

    if (debug) {
      logger.debug('Fetched store products', { offset, limit, count: listRes.products?.length ?? 0, operation: 'sync' })
      logger.info(`Fetched store products offset=${offset} limit=${limit} count=${listRes.products?.length ?? 0}`, { operation: 'sync' });
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
          logs
        }
      }
      break
    }
    if (offset === 0) totalFromApi = listRes.total ?? 0

    for (const pf of listRes.products) {
      const detailRes = await fetchSyncProduct(pf.id)
      if (debug) {
        logger.debug('Fetched sync product detail', { productId: pf.id, name: pf.name, operation: 'sync' })
      }
      if (!detailRes.ok || !detailRes.product?.sync_variants?.length) {
        if (detailRes.error && !firstError) firstError = `Printful API: ${detailRes.error}`
        skipped++
        continue
      }

      const { sync_product, sync_variants } = detailRes.product
      const msg = `Syncing product: ${sync_product.name} (ID: ${sync_product.id})`;
      console.log(msg);
      logs.push(msg);

      // 1. Upsert Product
      const productRes = await upsertProduct(supabase, sync_product, sync_variants, categoryId)
      if (!productRes.productId) {
        if (productRes.error && !firstError) firstError = productRes.error
        skipped++
        continue
      }
      if (productRes.synced) synced++

      // 2. Sync Variants
      const variantRes = await syncVariants(supabase, productRes.productId, sync_product, sync_variants)
      if (variantRes.error) {
        if (!firstError) firstError = variantRes.error
        // Don't skip product based on variant failure, try to process what we can
      }

      // 3. Sync Images
      // Only if we have the variant map
      if (variantRes.variantIdMap) {
        await ensureProductImages(supabase, productRes.productId, sync_product, sync_variants, variantRes.variantIdMap, logs)
      }

      if (onlyLatest) break
    }

    if (onlyLatest) break

    offset += limit
    if (listRes.products.length < limit) break
  }

  try {
    revalidatePath('/admin/products')
    revalidatePath('/admin/dashboard')
    revalidatePath('/')
  } catch (err) {
    // Ignored: revalidatePath fails in standalone scripts
    if (debug) console.warn('revalidatePath skipped (script context)')
  }

  const duration = Date.now() - startTime
  printfulAnalytics.trackSyncStats({
    synced,
    skipped,
    totalFromApi,
    duration,
    errors: firstError ? [firstError] : undefined
  })

  return {
    ok: true,
    synced,
    skipped,
    error: synced > 0 ? undefined : (firstError ?? (totalFromApi === 0 ? 'No products' : undefined)),
    logs
  }
}
