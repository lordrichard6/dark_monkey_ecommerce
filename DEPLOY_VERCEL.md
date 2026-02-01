# Deploy to Vercel (Web)

## One-click import

**Open this link in your browser** (while logged into Vercel):

**https://vercel.com/new/clone?repository-url=https://github.com/lordrichard6/dark_monkey_ecommerce&project-name=dark-monkey-ecommerce**

## Steps

1. **Click the link above** → Vercel will open the import screen for this repo.
2. **Configure project** (if prompted):
   - Project Name: `dark-monkey-ecommerce` (or leave default)
   - Framework: Next.js (auto-detected)
   - Root Directory: `./` (leave as-is)
3. **Environment variables** (add later in Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — for webhooks/admin
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc. when ready
4. **Deploy** → Click **Deploy**.
5. **Custom domain**: After deploy, go to Project Settings → Domains → Add `dark-monkey.ch`.
