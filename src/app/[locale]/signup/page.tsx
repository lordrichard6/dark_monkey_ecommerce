import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { SignupForm } from './signup-form'
import { Link } from '@/i18n/navigation'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirectTo?: string; email?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')
  return { title: t('signupPageTitle') }
}

export default async function SignupPage({ params, searchParams }: Props) {
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

  const { redirectTo, email: initialEmail } = await searchParams

  if (user) {
    redirect(redirectTo ?? `/${locale}/account`)
  }

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <SignupForm initialEmail={initialEmail ?? ''} />
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
        </div>
      </div>
    </div>
  )
}
