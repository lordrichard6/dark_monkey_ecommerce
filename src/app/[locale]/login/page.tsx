import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from './login-form'
import { Link } from '@/i18n/navigation'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirectTo?: string }>
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params
  const t = await getTranslations('auth')
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Invalid refresh token (stale session) — treat as logged out
  }

  if (user) {
    const { redirectTo } = await searchParams
    redirect(redirectTo ?? `/${locale}/account`)
  }

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <LoginForm />
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <Link
            href="/categories"
            className="text-sm text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
          >
            {t('continueWithoutAccount')}
          </Link>
          <a
            href="mailto:support@dark-monkey.ch"
            className="text-sm text-zinc-500 underline-offset-4 transition hover:text-amber-400 hover:underline"
          >
            {t('contactSupport')} — support@dark-monkey.ch
          </a>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 space-y-1 text-xs text-zinc-600">
              <p>Supabase: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set'}</p>
              <a
                href="/auth/clear"
                className="text-zinc-500 hover:text-amber-400 hover:underline"
              >
                Clear session (fixes Refresh Token errors)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
