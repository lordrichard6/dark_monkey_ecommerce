# Printful integration — flow and validation

> Sync and fulfillment flow for DarkMonkey. Validated against Printful Store API response shape (see `printfull_API_data.json`).

---

## 1. API response shape (sync)

The **Store API** `GET store/products/:id` returns (our code expects `result`; the sample file uses `product` as wrapper):

- **sync_product:** `id`, `external_id`, `name`, `thumbnail_url`, `variants`, `synced`, …
- **sync_variants:** array of:
  - `id` → stored as **printful_sync_variant_id** (used when creating Printful orders)
  - `variant_id` → stored as **printful_variant_id** (catalog variant; used for price fallback)
  - `retail_price`, `sku`, `product.name`, `product.image`, `files[]` (preview_url, thumbnail_url), `size`, `color`

Our sync (`src/actions/sync-printful.ts`) maps:

- Product: `printful_sync_product_id` = sync_product.id, name, slug, description (from Catalog if available).
- Variants: `printful_sync_variant_id` = sv.id, `printful_variant_id` = sv.variant_id, price (retail or catalog fallback), attributes = { size, color }, name from product.name.
- Images: sync_product.thumbnail_url + sync_variants[].product.image + sync_variants[].files[].preview_url.

The sample `printfull_API_data.json` matches this shape (sync_product, sync_variants with id, variant_id, retail_price, product, files, size, color).

---

## 2. Default print file URL

Printful needs a **print file URL** (image) per order item.

- **Source:** `src/lib/printful.ts` → `getDefaultPrintFileUrl()`.
- **Value:** `{NEXT_PUBLIC_SITE_URL or VERCEL_URL or https://www.dark-monkey.ch}/logo.png`
- **Usage:** When creating a Printful order in the Stripe webhook, each item gets `files: [{ url: getDefaultPrintFileUrl() }]` if no custom design.

**To change the default design:**

1. Host your default print image (e.g. logo) at a public URL.
2. Set `NEXT_PUBLIC_SITE_URL` (or ensure `VERCEL_URL` / fallback) so `getDefaultPrintFileUrl()` returns that base + path, or add `PRINTFUL_DEFAULT_PRINT_URL` in env and use it in `getDefaultPrintFileUrl()`.

Customization (user text/image) is not yet wired to Printful; config is stored in order_item but print file resolution is default only.

---

## 3. Fulfillment flow (Stripe webhook)

**File:** `src/app/api/webhooks/stripe/route.ts`

1. On `checkout.session.completed`, create order and order_items in Supabase.
2. For each cart item, load variant’s **printful_sync_variant_id** (or printful_variant_id).
3. Build Printful items: `sync_variant_id` (preferred) or `variant_id`, quantity, `files: [{ url: getDefaultPrintFileUrl() }]`, retail_price.
4. Build recipient from `shipping_address_json` (name, address1, city, state_code, country_code, zip, email).
5. `POST https://api.printful.com/orders` with confirm=1; store `printful_order_id` on the order.

If no variant has a Printful mapping, the order is still saved in Supabase but a warning is logged; no Printful order is created.

---

## 4. Environment

| Variable | Purpose |
|----------|---------|
| `PRINTFUL_API_TOKEN` | Required for sync and orders. From [Printful tokens](https://developers.printful.com/tokens). |
| `NEXT_PUBLIC_SITE_URL` | Base URL for default print file (e.g. `https://www.dark-monkey.ch`). |

See `directives/printful_integration.md` for setup and edge cases.
