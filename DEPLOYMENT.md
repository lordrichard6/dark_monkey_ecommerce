# Deployment Guide

Complete guide to deploying Dark Monkey to production on Vercel + Supabase.

---

## Prerequisites

| Tool                                                 | Version | Purpose                     |
| ---------------------------------------------------- | ------- | --------------------------- |
| Node.js                                              | 20+     | Runtime                     |
| [Vercel CLI](https://vercel.com/docs/cli)            | latest  | Deploy & env var management |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | latest  | Database migrations         |
| [Stripe CLI](https://stripe.com/docs/stripe-cli)     | latest  | Local webhook testing       |

---

## 1. Supabase Setup

### Create a project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **API keys** (Settings → API)

### Run migrations

All 57 database migrations must be applied to a fresh project:

```bash
# Link to your production project
supabase link --project-ref <your-project-ref>

# Push all migrations
supabase db push
```

Verify the migration count:

```bash
supabase migration list
```

### Required Supabase env vars

| Variable                        | Where to find                                               |
| ------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Settings → API → Project URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon public key                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Settings → API → service_role secret key (server-side only) |

---

## 2. Environment Variables

Set all of these in Vercel: **Project Settings → Environment Variables**.
Mark server-only vars for **Production** environment only (never expose them client-side).

### Core (required)

| Variable                        | Example                   | Notes                                      |
| ------------------------------- | ------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxx.supabase.co` | From Supabase dashboard                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...`                  | Public key — safe to expose                |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJ...`                  | **Secret** — server-only                   |
| `NEXT_PUBLIC_APP_URL`           | `https://dark-monkey.ch`  | Your production domain (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL`          | `https://dark-monkey.ch`  | Same as above (used by auth callbacks)     |

### Stripe (required for checkout)

| Variable                             | Example       | Notes                            |
| ------------------------------------ | ------------- | -------------------------------- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Public key — safe to expose      |
| `STRIPE_SECRET_KEY`                  | `sk_live_...` | **Secret** — server-only         |
| `STRIPE_WEBHOOK_SECRET`              | `whsec_...`   | From Stripe Dashboard → Webhooks |

### Printful (required for fulfillment)

| Variable                     | Example              | Notes                                                                         |
| ---------------------------- | -------------------- | ----------------------------------------------------------------------------- |
| `PRINTFUL_API_TOKEN`         | `your_private_token` | From [developers.printful.com/tokens](https://developers.printful.com/tokens) |
| `PRINTFUL_STORE_ID`          | `12345678`           | `curl -H "Authorization: Bearer $TOKEN" https://api.printful.com/stores`      |
| `PRINTFUL_WEBHOOK_SECRET`    | `your_secret`        | Set when configuring Printful webhook (see step 4)                            |
| `PRINTFUL_DEFAULT_PRINT_URL` | `https://...`        | URL of default print file for customizable products                           |

### Email — Resend (required for order confirmations)

| Variable         | Example                 | Notes                                           |
| ---------------- | ----------------------- | ----------------------------------------------- |
| `RESEND_API_KEY` | `re_...`                | From [resend.com](https://resend.com) dashboard |
| `RESEND_FROM`    | `orders@dark-monkey.ch` | Must be a verified domain in Resend             |

### Cloudflare Turnstile — anti-bot (required for signup/auth)

| Variable                         | Example      | Notes                                 |
| -------------------------------- | ------------ | ------------------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAA...` | From Cloudflare dashboard → Turnstile |
| `TURNSTILE_SECRET_KEY`           | `0x4AAAA...` | **Secret** — server-only              |

To get keys: [dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile → Add site.

### Rate Limiting — Upstash Redis (strongly recommended for production)

| Variable                   | Example                  | Notes                                   |
| -------------------------- | ------------------------ | --------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | `https://xxx.upstash.io` | From [upstash.com](https://upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | `your_token`             | From Upstash dashboard                  |

> **Note:** If these are not set, rate limiting is disabled (fail-open). Set them before going live to protect auth endpoints.

### Sentry — error tracking (required for production observability)

| Variable                 | Example                                | Notes                                          |
| ------------------------ | -------------------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://xxx@xxx.ingest.sentry.io/xxx` | From Sentry project settings                   |
| `SENTRY_ORG`             | `darkmonkey`                           | Your Sentry org slug                           |
| `SENTRY_PROJECT`         | `javascript-nextjs`                    | Your Sentry project slug                       |
| `SENTRY_AUTH_TOKEN`      | `sntrys_...`                           | For source map upload — see Sentry setup below |

### Web Push Notifications (optional)

| Variable                       | Example  | Notes                                            |
| ------------------------------ | -------- | ------------------------------------------------ |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BK...`  | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY`            | `xxx...` | **Secret** — server-only; same command           |

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

### Security & Cron

| Variable            | Example                | Notes                                                            |
| ------------------- | ---------------------- | ---------------------------------------------------------------- |
| `REVALIDATE_SECRET` | `random-secret-string` | Used by `/api/revalidate` endpoint to protect cache invalidation |
| `CRON_SECRET`       | `random-secret-string` | Used by cron job endpoints — set a strong random value           |

Generate a secure secret:

```bash
openssl rand -hex 32
```

---

## 3. Stripe Webhook Setup

### Local development

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` value into your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### Production

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://dark-monkey.ch/api/webhooks/stripe`
4. Select event: **`checkout.session.completed`**
5. Click **Add endpoint**
6. Click **Reveal signing secret** → copy `whsec_...` → set as `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 4. Printful Webhook Setup

1. Go to Printful Dashboard → Settings → Webhooks
2. Add webhook URL: `https://dark-monkey.ch/api/webhooks/printful`
3. Set a secret and copy it → set as `PRINTFUL_WEBHOOK_SECRET` in Vercel
4. Enable these events:
   - `package_shipped`
   - `package_returned`
   - `order_failed`
   - `order_canceled`

---

## 5. Sentry Setup

1. Go to [sentry.io](https://sentry.io) → Create new project → Platform: Next.js
2. Copy the **DSN** from the project setup page → set as `NEXT_PUBLIC_SENTRY_DSN`
3. Note your **org slug** and **project slug** → set as `SENTRY_ORG` / `SENTRY_PROJECT`
4. Go to Settings → Auth Tokens → Create new token (scope: `project:releases`, `org:read`)
5. Set the token as `SENTRY_AUTH_TOKEN` in Vercel

Source maps will upload automatically on every `vercel --prod` deploy.

Verify it's working: trigger a test error in the app, check the Sentry issues feed.

---

## 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Deploy to production
vercel --prod
```

Or use the Vercel dashboard → Import Git repository.

**Build settings** (auto-detected for Next.js):

- Build command: `next build`
- Output directory: `.next`
- Node.js version: 20.x

---

## 7. Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add `dark-monkey.ch` and `www.dark-monkey.ch`
3. Set DNS records at your registrar:
   ```
   Type  Name  Value
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```
4. SSL is provisioned automatically by Vercel (Let's Encrypt).

---

## 8. Pre-launch Checklist

### Infrastructure

- [ ] All environment variables set in Vercel (Production environment)
- [ ] Supabase: all migrations applied (`supabase migration list` shows correct count)
- [ ] Stripe: production webhook endpoint configured, `checkout.session.completed` event enabled
- [ ] Printful: webhook configured with correct secret
- [ ] Sentry: source maps uploading (check a release in Sentry dashboard)
- [ ] Upstash Redis: connected and rate limiting active
- [ ] Custom domain resolving with HTTPS

### Functional testing (do in order)

- [ ] Browse products as a guest — all pages load
- [ ] Add item to cart — cart persists on page refresh
- [ ] Guest checkout: complete purchase with Stripe test card `4242 4242 4242 4242`
- [ ] Confirm order appears in admin → Orders
- [ ] Confirm Printful order was created
- [ ] Confirm order confirmation email received via Resend
- [ ] Signup as a new user — check email confirmation
- [ ] Login and checkout as authenticated user — order appears in account
- [ ] Admin: create a product, sync from Printful, activate it
- [ ] Admin: apply a discount code in checkout — verify correct deduction
- [ ] Test password reset flow end-to-end (request → email → reset)

### Performance

- [ ] Lighthouse score > 90 for all core metrics on product page
- [ ] Run `npm run test:e2e` — all E2E tests pass
- [ ] Run `npm test` — all unit tests pass

---

## 9. Troubleshooting

### Build fails: "Cannot find module 'X'"

```bash
npm ci  # Clean install instead of npm install
```

### Supabase auth not working in production

Ensure `NEXT_PUBLIC_SITE_URL` matches the exact production domain including `https://`. Supabase uses this for redirect allow-listing.

Add your production URL to: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.

### Stripe webhook returning 400

- The `STRIPE_WEBHOOK_SECRET` must come from the **production** webhook endpoint in the Stripe Dashboard, not the local `stripe listen` one.
- Ensure the webhook URL is exact: `https://your-domain.com/api/webhooks/stripe`

### Printful orders not being created

- Verify `PRINTFUL_API_TOKEN` is valid: `curl -H "Authorization: Bearer $TOKEN" https://api.printful.com/stores`
- Check Supabase → Function logs for `[Printful]` errors

### Sentry source maps not uploading

- Confirm `SENTRY_AUTH_TOKEN` is set in Vercel's **Build** environment (not just Runtime)
- Check Vercel build logs for "Sentry" output

### Rate limiting not working

- Confirm `UPSTASH_REDIS_REST_URL` starts with `https://` (not `redis://`)
- Test the connection: `curl "$UPSTASH_REDIS_REST_URL/ping" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"`

### Emails not sending

- Verify domain is verified in Resend Dashboard
- `RESEND_FROM` must exactly match a verified sender domain
- Check Resend logs for bounce/block reasons
