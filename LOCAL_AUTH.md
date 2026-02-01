# Local Auth Troubleshooting

If you can't create an account in local dev, check the following.

## 0. Verify which Supabase you're connected to

On the login page (in development), a small line shows: **Supabase: [URL]**

- `http://127.0.0.1:54321` → local Supabase ✅
- `https://xxx.supabase.co` → cloud Supabase
- `not set` → env vars missing; sign up requests will fail

To use **local** Supabase, your `.env.local` must have:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Publishable Key from supabase status>
```

**Critical:** Use the **Publishable Key** (sb_publishable_...), NOT the Secret Key.  
See `env.local.SAMPLE` for a ready-to-copy template with your current keys.

**Then restart the dev server** (`Ctrl+C`, then `npm run dev`). Next.js only reads env vars at startup.

## 1. Which Supabase are you using?

**Local Supabase** (`supabase start`):
- `.env.local` should have `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- Get the anon key from `supabase status`
- Email confirmations are **disabled** by default — you can sign in right after sign up
- Confirmation emails go to **Inbucket**: http://127.0.0.1:54324 (if you enable confirmations)

**Cloud Supabase** (project on supabase.com):
- `.env.local` has your project URL (e.g. `https://xxx.supabase.co`)
- Add redirect URLs in **Dashboard → Authentication → URL Configuration**:
  - `http://localhost:3000`
  - `http://localhost:3000/auth/callback`
  - `http://127.0.0.1:3000`
  - `http://127.0.0.1:3000/auth/callback`
- Email confirmations are usually **enabled** — check your email (or spam) for the link
- To sign in immediately without email verification: **Authentication → Providers → Email** → turn off **Confirm email**
- Note: confirmation emails may use your project's Site URL; for local testing, consider using local Supabase instead

## 2. Visit the same host you configured

If Supabase redirect URLs use `http://127.0.0.1:3000`, open that in your browser — not `http://localhost:3000`. Or add both to redirect URLs (local config already includes both).

## 3. Restart Supabase after config changes

After editing `supabase/config.toml`:

```bash
supabase stop
supabase start
```

## 4. Check the error message

The sign-up form shows errors in a red box. Common messages:

- **"Email rate limit exceeded"** — wait an hour or increase `email_sent` in `config.toml` (local)
- **"Signup disabled"** — enable in Supabase Auth settings
- **"Invalid redirect URL"** — add your URL to `additional_redirect_urls` (local) or Dashboard (cloud)

## 5. Reset local Supabase (fresh start)

```bash
supabase db reset
```

Then update `.env.local` with fresh keys from `supabase status`.
