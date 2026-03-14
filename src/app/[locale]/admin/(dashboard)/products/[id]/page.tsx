import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getAdminClient } from '@/lib/supabase/admin'
import { getCategories } from '@/actions/admin-categories'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { ProductEditor } from './product-editor'
import { ProductEditableFields } from './product-editable-fields'
import { ProductDescriptionField } from './product-description-field'
import { ProductCategoryField } from './product-category-field'
import { ProductTagsField } from './product-tags-field'
import { ProductToggleStatus } from './product-toggle-status'
import { ProductDangerZone } from './product-danger-zone'
import { ProductInfoFields } from './product-info-fields'
import { CopyIdButton } from './copy-id-button'
import { getStoreSetting } from '@/actions/admin-shipping'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminProductDetailPage({ params }: Props) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const t = useTranslations('admin')
  const { id } = await params
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const [productRes, tagsRes, productTagsRes, allCategories, shipmentInfo, gpsrInfo] =
    await Promise.all([
      supabase
        .from('products')
        .select(
          `
        id,
        name,
        slug,
        description,
        category_id,
        is_active,
        is_customizable,
        printful_sync_product_id,
        material_info,
        care_instructions,
        print_method,
        size_guide_url,
        created_at,
        updated_at,
        product_images (id, url, alt, sort_order, color, source),
        product_variants (
          id,
          sku,
          name,
          price_cents,
          compare_at_price_cents,
          attributes,
          product_inventory (quantity)
        )
      `
        )
        .eq('id', id)
        .single(),
      supabase.from('tags').select('id, name').order('name', { ascending: true }),
      supabase.from('product_tags').select('tag_id').eq('product_id', id),
      getCategories(),
      getStoreSetting('shipment_info'),
      getStoreSetting('gpsr_info'),
    ])

  const { data: product, error } = productRes

  if (error) {
    return (
      <div className="p-8 text-red-500">
        {t('products.errorFetchProduct')} {error.message}
      </div>
    )
  }

  if (!product) {
    return <div className="p-8 text-amber-500">{t('products.productNotFound', { id })}</div>
  }

  const availableTags = (tagsRes.data ?? []) as { id: string; name: string }[]
  const currentTagIds = (productTagsRes.data ?? []).map((pt: { tag_id: string }) => pt.tag_id)

  const variants = (product.product_variants ?? []) as Array<{
    id: string
    sku: string | null
    name: string | null
    price_cents: number
    compare_at_price_cents: number | null
    attributes: Record<string, unknown>
    product_inventory: { quantity: number } | { quantity: number }[] | null
  }>

  const images = (
    (product.product_images as {
      id: string
      url: string
      alt: string | null
      sort_order?: number
      color?: string | null
    }[]) ?? []
  ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return (
    <div className="min-h-screen p-4 pb-24 md:p-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Back button */}
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('products.backToProducts')}
        </Link>

        {/* Right side: timestamps + copy ID */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>
            {t('products.createdAt')} {formatDateTime(product.created_at)}
          </span>
          {product.updated_at !== product.created_at && (
            <>
              <span className="text-zinc-700">·</span>
              <span>
                {t('products.updatedAt')} {formatDateTime(product.updated_at)}
              </span>
            </>
          )}
          <span className="text-zinc-700">·</span>
          <CopyIdButton id={product.id} />
        </div>
      </div>

      <ProductEditor
        productId={product.id}
        printfulSyncProductId={product.printful_sync_product_id ?? null}
        images={images}
        variants={variants}
        metaSlot={
          <div className="space-y-5">
            {/* Name + Slug + store link */}
            <ProductEditableFields
              productId={product.id}
              name={product.name}
              slug={product.slug}
              nameAction={
                <Link
                  href={`/products/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-amber-500 hover:bg-amber-950/30 hover:text-amber-400"
                  title={t('fields.openInStorefront')}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  {t('products.viewInStore')}
                </Link>
              }
            />

            <div className="border-t border-zinc-800" />

            {/* Category & Tags side by side */}
            <div className="grid gap-5 sm:grid-cols-2">
              <ProductCategoryField
                productId={product.id}
                categoryId={product.category_id ?? null}
                categories={allCategories}
              />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t('products.tags')}
                </label>
                <div className="mt-2">
                  <ProductTagsField
                    productId={product.id}
                    initialTagIds={currentTagIds}
                    availableTags={availableTags}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800" />

            {/* Status — now interactive toggle + static Customizable badge */}
            <div className="flex flex-wrap items-center gap-2">
              <ProductToggleStatus productId={product.id} initialIsActive={product.is_active} />
              {product.is_customizable && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                  {t('products.customizable')}
                </span>
              )}
            </div>
          </div>
        }
        descriptionSlot={
          <ProductDescriptionField productId={product.id} description={product.description} />
        }
      />

      {/* ── Product Info Tabs Content ─────────────────────────────────────── */}
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="mb-1 text-sm font-semibold text-zinc-200">
          {t('products.productInfoTabs')}
        </h2>
        <p className="mb-5 text-xs text-zinc-500">{t('products.productInfoTabsDesc')}</p>
        <ProductInfoFields
          productId={product.id}
          materialInfo={(product as Record<string, unknown>).material_info as string | null}
          careInstructions={(product as Record<string, unknown>).care_instructions as string | null}
          printMethod={(product as Record<string, unknown>).print_method as string | null}
          sizeGuideUrl={(product as Record<string, unknown>).size_guide_url as string | null}
          shipmentInfo={shipmentInfo}
          gpsrInfo={gpsrInfo}
        />
      </div>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <div className="mt-8">
        <ProductDangerZone productId={product.id} productName={product.name} />
      </div>
    </div>
  )
}
