'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import {
  fetchStoreProducts,
  fetchSyncProduct,
  fetchCatalogVariant,
  fetchCatalogProduct,
  isPrintfulConfigured,
} from '@/lib/printful'
import { revalidatePath } from 'next/cache'

/** Resolve price in cents: use retail_price, or catalog wholesale * 2.5 as fallback */
async function resolvePriceCents(
  retailPrice: string | undefined,
  catalogVariantId: number
): Promise<number> {
  const retail = parseFloat(retailPrice || '0')
  if (retail > 0) return Math.round(retail * 100)
  const cat = await fetchCatalogVariant(catalogVariantId)
  if (cat.ok && cat.price != null && cat.price > 0) {
    return Math.round(cat.price * 2.5 * 100) // ~2.5x markup from wholesale
  }
  return 3990 // CHF 39.90 default when no price available
}

type SyncProduct = { name: string; thumbnail_url?: string }
type SyncVariant = {
  product?: { name?: string; image?: string }
  files?: Array<{ preview_url?: string; thumbnail_url?: string }>
}

async function ensureProductImages(
  supabase: NonNullable<ReturnType<typeof import('@/lib/supabase/admin').getAdminClient>>,
  productId: string,
  sync_product: SyncProduct,
  sync_variants: SyncVariant[]
) {
  const { data: existing } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .limit(1)
  if ((existing ?? []).length > 0) return

  const seen = new Set<string>()
  let sortOrder = 0
  const thumbUrl = sync_product.thumbnail_url || sync_variants[0]?.product?.image
  if (thumbUrl && !seen.has(thumbUrl)) {
    seen.add(thumbUrl)
    await supabase.from('product_images').insert({
      product_id: productId,
      url: thumbUrl,
      alt: sync_product.name,
      sort_order: sortOrder++,
    })
  }
  for (const sv of sync_variants) {
    const img = sv.product?.image
    if (img && !seen.has(img)) {
      seen.add(img)
      await supabase.from('product_images').insert({
        product_id: productId,
        url: img,
        alt: sv.product?.name ?? sync_product.name,
        sort_order: sortOrder++,
      })
    }
    for (const f of sv.files ?? []) {
      const url = f.preview_url ?? f.thumbnail_url
      if (url && !seen.has(url)) {
        seen.add(url)
        await supabase.from('product_images').insert({
          product_id: productId,
          url,
          alt: sync_product.name,
          sort_order: sortOrder++,
        })
      }
    }
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export type PrintfulDebugEntry = {
  api: string
  productId?: number
  productName?: string
  raw: unknown
}

export async function syncPrintfulProducts(debug = false): Promise<{
  ok: boolean
  synced?: number
  skipped?: number
  error?: string
  debugLog?: PrintfulDebugEntry[]
}> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  if (!isPrintfulConfigured()) {
    return { ok: false, error: 'Printful not configured (PRINTFUL_API_TOKEN)' }
  }

  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Database not configured' }

  let synced = 0
  let skipped = 0
  let totalFromApi = 0
  let firstError: string | null = null
  let offset = 0
  const limit = 20
  const debugLog: PrintfulDebugEntry[] = []

  const { data: defaultCat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'apparel')
    .single()
  const categoryId = defaultCat?.id ?? null

  while (true) {
    const listRes = await fetchStoreProducts(offset, limit)
    if (debug) {
      debugLog.push({
        api: 'GET store/products',
        raw: { offset, limit, ok: listRes.ok, total: listRes.total, products: listRes.products, error: listRes.error },
      })
    }
    if (!listRes.ok) {
      return { ok: false, error: listRes.error ?? 'Printful API error', debugLog: debug ? debugLog : undefined }
    }
    if (!listRes.products?.length) {
      if (offset === 0) {
        return {
          ok: true,
          synced: 0,
          skipped: 0,
          error:
            'No products in your Printful store. Add products at my.printful.com (Store → Add product). The sync only imports products from a Manual/API store.',
        }
      }
      break
    }
    if (offset === 0) totalFromApi = listRes.total ?? 0

    for (const pf of listRes.products) {
      const detailRes = await fetchSyncProduct(pf.id)
      if (debug) {
        debugLog.push({
          api: 'GET store/products/:id',
          productId: pf.id,
          productName: pf.name,
          raw: detailRes,
        })
      }
      if (!detailRes.ok || !detailRes.product?.sync_variants?.length) {
        if (detailRes.error && !firstError) firstError = `Printful API: ${detailRes.error}`
        skipped++
        continue
      }

      const { sync_product, sync_variants } = detailRes.product

      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('printful_sync_product_id', sync_product.id)
        .single()

      let productId: string

      if (existing?.id) {
        productId = existing.id
        await ensureProductImages(supabase, productId, sync_product, sync_variants)
      } else {
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
            description,
            is_customizable: false,
            is_active: true,
            printful_sync_product_id: sync_product.id,
          })
          .select('id')
          .single()

        if (insertErr || !inserted?.id) {
          if (insertErr && !firstError) firstError = insertErr.message
          skipped++
          continue
        }
        productId = inserted.id
        synced++

        await ensureProductImages(supabase, productId, sync_product, sync_variants)
      }

      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('id, printful_sync_variant_id, price_cents')
        .eq('product_id', productId)
      const existingPfIds = new Set(
        (existingVariants ?? []).map((v) => v.printful_sync_variant_id).filter((id): id is number => id != null)
      )
      const existingByPfId = new Map(
        (existingVariants ?? [])
          .filter((v): v is typeof v & { printful_sync_variant_id: number } => v.printful_sync_variant_id != null)
          .map((v) => [v.printful_sync_variant_id, v])
      )

      for (let i = 0; i < sync_variants.length; i++) {
        const sv = sync_variants[i]
        const priceCents = await resolvePriceCents(sv.retail_price, sv.variant_id)
        const attrs: Record<string, string> = {}
        if (sv.size) attrs.size = sv.size
        if (sv.color) attrs.color = sv.color

        const existingVar = existingByPfId.get(sv.id)
        if (existingVar) {
          if (existingVar.price_cents === 0) {
            await supabase
              .from('product_variants')
              .update({ price_cents: priceCents, attributes: attrs })
              .eq('id', existingVar.id)
          }
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
            { variant_id: newVar.id, quantity: 999 },
            { onConflict: 'variant_id' }
          )
          synced++
        } else if (varErr && !firstError) {
          firstError = `Variant: ${varErr.message}`
        }
      }
    }

    offset += limit
    if (listRes.products.length < limit) break
  }

  revalidatePath('/admin/products')
  revalidatePath('/admin/dashboard')
  revalidatePath('/')
  const message =
    synced > 0
      ? `Synced ${synced} items`
      : firstError
        ? `Sync failed: ${firstError}`
        : totalFromApi > 0
          ? `All ${totalFromApi} Printful products already in store (nothing new to sync)`
          : undefined
  return {
    ok: true,
    synced,
    skipped,
    error: message,
    ...(debug && { debugLog }),
  }
}
