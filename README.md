# Ecommerce Premium — App

Premium gamified e-commerce platform: commerce, customization, progression.

## Tech Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **Supabase** (Postgres, Auth, Storage)
- **Tailwind CSS**
- **TypeScript**

## Local Development

### 1. Supabase (local)

From this directory:

```bash
supabase start
```

Copy the output values for `API URL` and `anon key`, or run:

```bash
supabase status
```

### 2. Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with values from `supabase status`:

- `NEXT_PUBLIC_SUPABASE_URL` — API URL (e.g. `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key

### 3. Migrations

Migrations run automatically when Supabase starts. To apply manually:

```bash
supabase db push
```

### 4. Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (store)/           # Storefront: /, /categories, /products/[slug]
│   ├── (account)/         # User account (protected)
│   ├── login/             # Auth
│   ├── auth/callback/     # OAuth / email confirmation callback
│   └── api/               # API routes, webhooks
├── components/
│   ├── ui/                # shadcn/ui (Phase 1)
│   ├── product/
│   ├── cart/
│   └── customization/
├── lib/supabase/          # Client, server, middleware
├── actions/               # Server Actions
└── types/
```

## Phase 2: Stripe Checkout (when keys are ready)

1. **Create a Stripe account** at [stripe.com](https://stripe.com)
2. **Get API keys** from [Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
3. **Add to `.env.local`**:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. **Webhook** (for order creation):
   - Local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Copy the `whsec_...` signing secret to `STRIPE_WEBHOOK_SECRET`
   - Webhook also needs `SUPABASE_SERVICE_ROLE_KEY` (from `supabase status --output json`)

5. **Run migration** for guest address:
   ```bash
   supabase db reset
   ```
   Or apply migration `20260131000005_orders_guest_address.sql` manually.

## Order Confirmation Emails (Resend)

Structure is in place. Add your Resend API key when ready:

1. **Create a Resend account** at [resend.com](https://resend.com)
2. **Get API key** from [API Keys](https://resend.com/api-keys)
3. **Add to `.env.local`**:
   ```
   RESEND_API_KEY=re_...
   ```
4. **Optional:** Set `RESEND_FROM=orders@yourdomain.com` (must be a verified domain). Omit to use `onboarding@resend.dev` for testing.

Without the key, order creation still works; confirmation emails are skipped (logged as a warning).

## Admin Panel

1. **Grant admin access** — Run in Supabase SQL editor or `psql`:
   ```sql
   UPDATE user_profiles SET is_admin = true WHERE id = 'your-user-id';
   ```
   Or for the first user: `UPDATE user_profiles SET is_admin = true LIMIT 1;`

2. **Requires** `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (from `supabase status`)

3. Visit `/admin` — Dashboard, products, orders, discounts

## Phases Complete ✓

- **Phase 0:** Foundation, Auth, migrations
- **Phase 1:** Storefront, cart, product detail
- **Phase 2:** Checkout flow (add Stripe keys to enable)
- **Phase 3:** User accounts, profile, addresses, order history
- **Phase 4:** Product customization
- **Phase 5:** Gamification (XP, tiers, badges, missions)
- **Phase 6:** Admin panel
- **Phase 7:** Wishlist (save for later)

See `../roadmap.md` for full implementation plan.
