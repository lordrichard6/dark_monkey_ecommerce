# DarkMonkey — Premium Gamified E-Commerce

Premium e-commerce platform: commerce + customization + progression in one brand ecosystem. Built for the Swiss market, deployed globally via Vercel Edge.

## 🔗 Links

- **Live site:** [https://www.dark-monkey.ch](https://www.dark-monkey.ch)
- **Vercel dashboard:** [dark-monkey-ecommerce](https://vercel.com/dashboard)
- **Supabase project:** [ehkwnyiktjsmegzxbpph](https://supabase.com/dashboard/project/ehkwnyiktjsmegzxbpph)

## Tech Stack

| Layer               | Technology                                                 |
| ------------------- | ---------------------------------------------------------- |
| **Framework**       | Next.js 16 (App Router, Server Components, Server Actions) |
| **Database / Auth** | Supabase (Postgres + RLS, Auth, Storage)                   |
| **Payments**        | Stripe Checkout + Webhooks                                 |
| **Fulfillment**     | Printful (print-on-demand)                                 |
| **Email**           | Resend (transactional)                                     |
| **Error tracking**  | Sentry (client + server + edge)                            |
| **Analytics**       | Google Analytics + Vercel Analytics + Speed Insights       |
| **Styling**         | Tailwind CSS v4                                            |
| **i18n**            | next-intl — 5 locales: en, de, fr, it, pt                  |
| **Testing**         | Vitest (unit) + Playwright (E2E)                           |
| **Hosting**         | Vercel Edge CDN                                            |
| **Node version**    | 22.x (see `.nvmrc`)                                        |

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

```bash
cp .env.local.example .env.local
```

The project points to the **production Supabase** instance by default. To develop against local Supabase:

```bash
supabase start
# then update .env.local with the local URLs from `supabase status`
```

### 3. Migrations (production)

```bash
supabase link --project-ref ehkwnyiktjsmegzxbpph
supabase db push
```

> ⚠️ **Heads up:** Run `supabase migration list` first. If any remote-only orphan versions appear (blank local column), repair them before pushing:
>
> ```bash
> supabase migration repair --status reverted <version>
> ```
>
> If a migration fails due to an already-existing policy, wrap the `CREATE POLICY` in a `DO $$ BEGIN IF NOT EXISTS ... END $$;` block and retry after `supabase migration repair --status reverted <version>`.

### 4. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Storage Buckets

| Bucket            | Public | Purpose                                            |
| ----------------- | ------ | -------------------------------------------------- |
| `product-images`  | ✅     | Product photos and variant images                  |
| `category-images` | ✅     | Category card images (1:1 square, 1200×1200px min) |
| `review-photos`   | ✅     | User-submitted review photos                       |

Admin-only upload/delete. See `supabase/migrations/` for RLS policies.

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (store)/         # Storefront: /, /categories, /products/[slug], /search
│   │   ├── (checkout)/      # Checkout flow + success
│   │   ├── (account)/       # User account (protected)
│   │   ├── admin/           # Admin panel (is_admin = true required)
│   │   ├── auth/            # Auth callback
│   │   ├── login/
│   │   ├── privacy/
│   │   ├── terms/
│   │   ├── shipping/
│   │   ├── refund/
│   │   ├── legal/           # Swiss Impressum
│   │   ├── contact/
│   │   └── faq/
│   ├── api/
│   │   └── webhooks/        # stripe/, printful/
│   ├── sitemap.ts
│   ├── robots.ts
│   └── opengraph-image.tsx
├── components/
│   ├── product/
│   ├── cart/
│   ├── customization/
│   ├── wishlist/
│   ├── gamification/
│   ├── admin/
│   └── ui/
├── actions/                 # Server Actions (cart, checkout, admin-*, sync-printful…)
├── lib/                     # supabase/, stripe.ts, printful.ts, orders.ts, currency.ts…
└── messages/                # i18n JSON — en.json is source of truth (592 keys)
```

---

## Admin Panel

1. **Grant admin access** (run once in Supabase SQL editor):

   ```sql
   UPDATE user_profiles SET is_admin = true WHERE id = 'your-user-id';
   ```

2. **Required env var:** `SUPABASE_SERVICE_ROLE_KEY`

3. Visit `/admin` — dashboard, products, categories, orders, discounts, analytics

---

## i18n

5 locales: **en, de, fr, it, pt**. All 592 keys must be present in every locale.

```bash
npm run check:i18n   # verify all locales match EN key count
```

Translation files live in `messages/`. EN is the source of truth.

---

## Printful

- Webhook registered for: `package_shipped`, `order_failed`, `order_canceled`
- Store ID: `17644007` → `PRINTFUL_STORE_ID` env var
- Verification: store ID check (Printful API v1 has no HMAC signing)
- See `docs/PRINTFUL_FLOW.md`

---

## Stripe

- Webhook: `/api/webhooks/stripe`
- Events handled: `checkout.session.completed`, `charge.refunded`
- Signing secret: `STRIPE_WEBHOOK_SECRET`

---

## Environment Variables

See `.env.local.example` for the full list. Key vars:

| Variable                        | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-side admin access                     |
| `STRIPE_SECRET_KEY`             | Stripe API                                   |
| `STRIPE_WEBHOOK_SECRET`         | Stripe webhook verification                  |
| `PRINTFUL_API_KEY`              | Printful API                                 |
| `PRINTFUL_STORE_ID`             | `17644007`                                   |
| `RESEND_API_KEY`                | Email (order confirmations, abandoned cart…) |
| `SENTRY_AUTH_TOKEN`             | Error tracking                               |
| `NEXT_PUBLIC_GA_ID`             | Google Analytics                             |
| `NEXT_PUBLIC_SITE_URL`          | `https://www.dark-monkey.ch`                 |

---

## Testing

```bash
npm run test              # run unit tests (Vitest)
npm run test:coverage     # coverage report
npm run test:e2e          # Playwright E2E (requires running app + Supabase)
```

Current coverage: ~56% statements. Target: 80%.

---

## Deployment

Push to `main` → Vercel auto-deploys. Migrations must be pushed separately:

```bash
supabase db push
```

See `DEPLOY_VERCEL.md` for full checklist.

---

## Phases Complete ✅

| Phase              | Status                                                                      |
| ------------------ | --------------------------------------------------------------------------- |
| 0 — Foundation     | ✅ Next.js 16, Supabase, Auth, Vercel deploy                                |
| 1 — Storefront     | ✅ Landing, categories, product pages, cart                                 |
| 2 — Checkout       | ✅ Stripe, webhooks, order emails (Resend)                                  |
| 3 — Accounts       | ✅ Profile, addresses, order history, password reset                        |
| 4 — Customization  | ✅ Config UI, preview, price modifier                                       |
| 5 — Gamification   | ✅ XP, tiers, badges, missions                                              |
| 6 — Admin          | ✅ Products, orders, discounts, analytics, refunds                          |
| 7 — Retention      | ✅ Wishlist, referrals, abandoned cart, restock alerts                      |
| 8 — Trust & Polish | ✅ Reviews, photo reviews, FAQ, urgency signals, bestseller badges          |
| 9 — Scale          | ✅ ISR, multi-currency (CHF/EUR/USD/GBP), i18n (5 locales), perf monitoring |
| 10 — Advanced      | 📋 Search, filters, recommendations, rate limiting, bundles, analytics      |

See `../roadmap.md` for Phase 10 plan (~56h estimated).
