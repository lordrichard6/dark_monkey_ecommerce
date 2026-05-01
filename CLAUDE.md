# dark_monkey_app — Agent Playbook

> Project-specific rules. The top-level `/Users/paulolopes/Desktop/lopes2tech/CLAUDE.md` still applies.
> **Update this file whenever you discover a non-obvious behavior or footgun.** A bug found once should not bite twice.

---

## 1. What this is

**Dark Monkey** is a premium, gamified, multi-locale e-commerce SaaS built on Printful on-demand fulfillment. It's the flagship storefront for the Dark Monkey brand.

- **Production URL:** https://www.dark-monkey.ch
- **Branch → env:** `main` → production (Vercel), `develop` → preview
- **Owner/admin email:** `admin@dark-monkey.ch`

---

## 2. Stack Summary

| Layer          | Tech                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| Framework      | **Next.js 16** (App Router, React 19, React Compiler enabled)                |
| Runtime        | **Node ≥ 22**                                                                |
| Language       | TypeScript 5, strict                                                         |
| Styling        | Tailwind CSS v4 (PostCSS plugin), dark theme                                 |
| i18n           | `next-intl` v4, locales `en, pt, de, it, fr`, prefix `always`, default `en`  |
| DB / Auth      | **Supabase** (project ref `ehkwnyiktjsmegzxbpph`, EU-West Ireland)           |
| Billing        | **Stripe** (mixed account — SaaS + client services; do NOT touch)            |
| Fulfillment    | **Printful** on-demand print (webhook-driven sync)                           |
| Email          | **Resend** (from `orders@dark-monkey.ch`)                                    |
| Rate limit     | **Upstash Redis** (`@upstash/ratelimit`)                                     |
| Error tracking | **Sentry** (`@sentry/nextjs`)                                                |
| Analytics      | Google Analytics 4 + Vercel Analytics + Speed Insights                       |
| Bot/CSRF       | Cloudflare Turnstile                                                         |
| Push           | Web Push (VAPID), PWA with `sw.js` + `manifest.json`                         |
| Deploy         | **Vercel** (auto from `main`)                                                |
| Tests          | **Vitest** (happy-dom) + **Playwright** (chromium/firefox/webkit)            |
| CI             | GitHub Actions (`.github/workflows/test.yml`) — unit coverage ≥ **58%** gate |
| Hooks          | Husky (pre-commit: lint-staged; pre-push: tsc + vitest)                      |

Full env var list: see `env.local.SAMPLE`. Key vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PRINTFUL_API_TOKEN`, `PRINTFUL_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `REVALIDATE_SECRET`.

---

## 3. Directory Map

```
src/
  app/
    layout.tsx                 ← root HTML layout (sets html[lang] from x-next-intl-locale header)
    robots.ts                  ← /robots.txt (disallows /admin, /account, /api, /auth)
    sitemap.ts                 ← /sitemap.xml (locale-aware, pulls dynamic products/categories from Supabase)
    opengraph-image.tsx        ← default OG image
    maintenance/ offline/ not-found.tsx
    [locale]/
      (store)/                 ← public storefront routes (products, categories, bundles, feed, search, blog...)
      (checkout)/              ← checkout flow
      admin/(dashboard)/       ← admin panel (products, orders, discounts, reviews, newsletter, support, ...)
      account/ auth/ login/ signup/ forgot-password/ blog/ contact/ legal/ privacy/ terms/ refund/ shipping/
    api/
      admin/ auth/ cron/ health/ push/ revalidate/ votes/ webhooks/{stripe,printful}/
  actions/                     ← ALL server actions (cart, checkout, auth, admin-*, reviews, ...)
  components/                  ← React components (product/, reviews/, admin/, auth/, checkout/, icons/, ...)
  content/blog/                ← MDX/TS blog content (getAllSlugs used by sitemap)
  contexts/ hooks/ utils/      ← client-side glue
  i18n/routing.ts              ← locale config
  lib/                         ← server-only business logic (queries, stripe, printful, supabase/, trust-urgency, ...)
    supabase/                  ← client.ts, server.ts, admin.ts, middleware.ts
  proxy.ts                     ← middleware (i18n + Supabase session refresh + x-pathname forwarding)
  types/
messages/                      ← en.json, pt.json, de.json, it.json, fr.json
supabase/migrations/           ← SQL migrations (full-timestamp naming: YYYYMMDDHHMMSS_*)
scripts/                       ← one-off node/ts scripts (debug-*, check-*, verify-*, test-*)
e2e/                           ← Playwright specs
public/                        ← favicons, icons/, manifest.json, sw.js, images/, videos/
.github/workflows/test.yml     ← CI
vercel.json                    ← redirects + extra headers (/ → /en)
next.config.ts                 ← CSP, image patterns, Sentry, bundle analyzer, Turbopack root
```

---

## 4. Preview / Verification — CRITICAL

- **NEVER run `preview_start`.** The user always runs `npm run dev` on port 3000 themselves.
- **Verification for backend/logic/type changes:** `npx tsc --noEmit` only. No browser. No screenshots.
- **Visual/UI changes:** ask the user to verify visually — do not open a browser.
- **i18n changes:** also run `npm run check:i18n` to verify all 5 locale files stay in sync.

Node PATH gotcha: if `tsc`/`npx` fail with "command not found", wrap with extended PATH. The `.husky/pre-push` hook already does this.

---

## 5. Database — Supabase (READ `directives/ops/manage_database.md` FIRST)

- **Project ref:** `ehkwnyiktjsmegzxbpph`
- **NEVER run `supabase db reset`** — it destroys data. Only `supabase db push`.
- **Always apply migrations immediately.** After creating `supabase/migrations/*.sql`, run `supabase db push` in the same task. Unapplied migrations have broken checkout multiple times (PostgrestError "column not found").
- **Migration naming:** full timestamp `YYYYMMDDHHMMSS_description.sql` — NOT date-only (clashes with remote orphans).
- **Always use guards in migrations** — `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. For policies, wrap in `DO $$ IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE ...) THEN CREATE POLICY ... END $$;` — a partially-applied migration re-run without this crashes with `policy already exists (SQLSTATE 42710)`.
- **Storage buckets:** `product-images`, `category-images`, `review-photos`, `custom-designs` (all public). New buckets → create via Storage REST API (service role), then apply RLS policies via migration.
- **Production data manipulation:** use Supabase REST API with `SUPABASE_SERVICE_ROLE_KEY` from `.env.local.production` (never commit that file — it's gitignored). Safe for tag/category/content fixes without triggering a deploy.

---

## 6. i18n — Rules

- Locales: `en` (default), `pt`, `de`, `it`, `fr`. All always prefixed (`/en/...`).
- Every user-facing string lives in `messages/{locale}.json`. When you add a key to one file, add it to **all five** or `npm run check:i18n` fails CI.
- Server components: `getTranslations()` / `setRequestLocale(locale)`. Client: `useTranslations()`.
- The middleware (`src/proxy.ts`) sets `x-next-intl-locale` and forwards `x-pathname` to server components. The root layout reads `x-next-intl-locale` to set `<html lang>`.

---

## 7. SEO — How this site is wired

**Anything that changes URLs, metadata, or routing affects SEO. Treat with care.**

1. **Sitemap** (`src/app/sitemap.ts`) — dynamically generates localized URLs for every product (via Supabase `products` where `is_active=true AND deleted_at IS NULL`), every category, every blog slug, and all static pages (`/`, `/products`, `/categories`, `/bundles`, `/blog`, `/contact`, `/privacy`, `/terms`, `/refund`, `/shipping`). Each URL includes `alternates.languages` for all 5 locales. **Never hardcode localhost in BASE_URL** — use `NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'`.
2. **Robots** (`src/app/robots.ts`) — allows `/`, disallows `/admin/`, `/account/`, `/api/`, `/auth/`. Sitemap URL is emitted.
3. **Middleware matcher** (`src/proxy.ts`) — **MUST** exclude `sitemap.xml`, `robots.txt`, `manifest.json`, `favicon.ico`, static assets, and `api`. A missing exclusion routes them through next-intl → 404. This bit us: `/sitemap.xml` returned 404 because it wasn't in the exclusion list. Current matcher:
   ```
   /((?!_next/static|_next/image|favicon.ico|manifest.json|sitemap.xml|robots.txt|api|.*\.(?:svg|png|jpg|jpeg|gif|webp|json|mp4|webm|ogg|mp3|wav)$).*)
   ```
4. **Product pages** — `generateMetadata()` emits: title, description (from `meta_description` override or stripped `description_translations[locale]`), `alternates.canonical`, `og.images` (first `product_images` by `sort_order`), Twitter card. Never ship a product without `name` + at least one image.
5. **Root layout** (`src/app/layout.tsx`) — default title template `"%s — DarkMonkey"`, OG, Twitter, manifest, Apple touch icon. `metadataBase` must be a real URL (driven by `NEXT_PUBLIC_SITE_URL`).
6. **Canonical / locale alternates** — sitemap emits `alternates.languages`; product metadata emits `alternates.canonical`. Keep this pattern for any new dynamic page (categories, blog, bundles).
7. **Google Search Console** — verified for `dark-monkey.ch` via DNS TXT on Infomaniak (record ID `33500245`, value `google-site-verification=mPga9bsukMSsH1Ytm6YdvwexuDWVaiHgISpfjgt9gxk`). Submit sitemap there after major URL changes.
8. **`/` → `/en` redirect** lives in `vercel.json` (`permanent: false`). Do NOT change to permanent without locale-detection planning.
9. **Structured data** — not fully wired yet. When adding product JSON-LD, include `Product` (offers/price/availability), `AggregateRating` when review count > 0, `BreadcrumbList`, `Organization`. Never inject JSON-LD for products with zero reviews (no `AggregateRating`) — Google flags invalid schema.
10. **OG images** — `src/app/opengraph-image.tsx` is the default. Product pages use first product image at 1200×1200. Keep images ≥ 1200px on the long edge.

---

## 8. CI / Build Gotchas

These have all bitten us. Do not repeat.

| #   | Gotcha                                                                                       | Where it bit                                                                              | Fix                                                                          |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | `sitemap.xml`/`robots.txt` routed through next-intl middleware → 404                         | Production `/sitemap.xml` was 404 for weeks                                               | Matcher in `src/proxy.ts` must exclude them (see §7.3)                       |
| 2   | `unstable_cache` missing from `next/cache` mock                                              | `products.test.ts` failed in CI                                                           | `vitest.setup.ts` mocks `unstable_cache: vi.fn(fn => fn)`                    |
| 3   | Pre-push ran `supabase local-connectivity.test.ts` locally → fails when Supabase not running | Every push blocked locally                                                                | Pre-push prefixes with `CI=true` to skip local-only tests                    |
| 4   | `@vitest/coverage-v8` missing → Vercel build failed                                          | CI runs `npm run test:coverage`                                                           | Install as devDependency (already in `package.json`)                         |
| 5   | Stale `revalidatePath('/')` assertions in tests after signature change                       | `newsletter.test.ts`, `wishlist.test.ts`                                                  | Use `revalidatePath('/path', 'page')` when invalidating a specific page type |
| 6   | Untracked files break Vercel builds after commit                                             | `PurchaseSocialProof.tsx`, `usePurchaseChannel.ts` were `??` in `git status` but imported | When the user says "commit all" → **`git add -A`**, never selective staging  |
| 7   | `echo "x" \| vercel env add` injects trailing `\n` → corrupts Stripe/URL vars                | Stripe "Invalid API key"                                                                  | Use `printf "x" \| vercel env add` or the Vercel REST API                    |
| 8   | Coverage gate hard-codes **58%**                                                             | CI fails if statement coverage drops                                                      | If you remove tests, rebalance — don't lower the gate without discussion     |
| 9   | `sharp` must NOT be bundled — resolves native binary at runtime on Vercel                    | Image optimization broke                                                                  | `next.config.ts`: `serverExternalPackages: ['sharp']` — do not remove        |
| 10  | `bc` required by coverage check (`bc -l`) — ubuntu runner has it, local may not              | CI only                                                                                   | No local impact                                                              |
| 11  | `revalidate` endpoints require `REVALIDATE_SECRET`                                           | Unauthorized reval attempts                                                               | Header or query param                                                        |

---

## 9. Testing

- Unit/integration: `npm test` (Vitest, happy-dom). Setup in `vitest.setup.ts` mocks `next/navigation`, `next/headers`, `next/cache`.
- Coverage: `npm run test:coverage` — gate is **58% statements** (enforced in CI).
- E2E: `npm run test:e2e` (Playwright, 3 browsers matrix). Skipped in CI if Supabase secrets are unset.
- i18n: `npm run check:i18n` checks that all `messages/*.json` files have the same key shape.
- Lint + types: `npm run lint` and `npx tsc --noEmit`.
- **Sensitive paths (auth, checkout, billing, webhooks) require both `npm test` and `npm run test:e2e` before commit.** See top-level `directives/reference/testing.md`.

---

## 10. Auth, Checkout, Webhooks — Fragile Areas

- **Auth** uses Supabase SSR (`@supabase/ssr`). Session refresh happens in `src/proxy.ts` via `updateSession()`. Admin check via `src/lib/auth-admin.ts` / `src/app/api/auth/is-admin`.
- **Checkout** — server actions in `src/actions/checkout.ts`. Stripe webhook at `src/app/api/webhooks/stripe/`. On order completion, creates Printful order via `src/actions/sync-printful.ts`.
- **Printful webhook** at `src/app/api/webhooks/printful/`. Secret-verified.
- **Cron jobs** — `src/app/api/cron/{abandoned-cart,review-request,wishlist-reminder}` — require `Authorization: Bearer <CRON_SECRET>`. Scheduled via Vercel Cron (see `vercel.json` if added there or the Vercel dashboard).
- **Rate limiting** — `src/lib/rate-limit.ts` wraps `@upstash/ratelimit`. **Currently dormant by design** (decided 2026-05-01): `UPSTASH_REDIS_REST_URL/TOKEN` are intentionally unset in Vercel because traffic doesn't justify the dependency yet. The lib falls open quietly. Wired into `/api/votes`, `/api/auth/verify-turnstile`, and the three `/api/push/*` endpoints — those calls return `{ success: true }` until Upstash is configured. **To enable**: add the two Upstash env vars + `RATE_LIMIT_REQUIRED=true` in Vercel; redeploy. The `RATE_LIMIT_REQUIRED` flag turns the missing-Upstash warning back into a Sentry-loud error so a misconfigured deploy can't silently drop protection.
- **CSP / security headers** live in `next.config.ts` — any new third-party script (analytics, embeds) must be added to `script-src` / `connect-src` / `frame-src` or the browser will block it silently. Sentry DSN host is allowlisted explicitly.

---

## 11. Content Structure & Admin

- **Products** — Supabase `products` table, Printful-synced. `is_active`, `deleted_at` (soft-delete), `is_featured`, `meta_description`, `description_translations: { en, pt, de, it, fr }`, `product_images[].sort_order`.
- **Categories** — `categories` table (slug, name, description, `updated_at` for sitemap `lastModified`).
- **Tags** — `tags` table, many-to-many `product_tags`. Admin can create tags inline on the product edit page (via `createTag` server action in `src/actions/admin-products.ts`).
- **Bundles, Reviews, Newsletter, Discounts, Support, Feed, Gallery, Announcements, Custom product requests** — each has its own admin route under `src/app/[locale]/admin/(dashboard)/` and a matching `src/actions/admin-*.ts` server action file.
- **Blog** — `src/content/blog/` with `getAllSlugs()` used by sitemap. Content is source-controlled (not DB).
- **Admin role** — granted via `user_profiles.is_admin = true` (NOT `profiles.role`). The `getAdminUser()` helper in `src/lib/auth-admin.ts` checks this. Setup script: `scripts/set-admin.sql`. RLS policies that gate on admin should reference `user_profiles.is_admin`, but in practice all admin writes go through the service-role admin client (which bypasses RLS) so an admin write policy is rarely needed — default-deny is fine.

---

## 12. Commit / Deploy Rules (reinforcing the top-level CLAUDE.md)

- **Never** `git commit`, `git push`, or `vercel deploy` without explicit user instruction.
- "commit all" means **`git add -A`**. No exceptions, no selective staging.
- **Never** `git push` unless user says "push".
- Deployment is auto from `main` → Vercel. A failing CI blocks Vercel.
- Before pushing, the local pre-push hook runs `tsc --noEmit` + `CI=true npm test -- --run`. If it fails, fix — don't `--no-verify`.

---

## 13. Update this file

When you discover a non-obvious behavior or footgun, add a row to the relevant section (§8 CI gotchas is the most common). Delete entries that stop being true. The goal is: a new Claude session should be able to work on this codebase safely from a cold read of this file.
