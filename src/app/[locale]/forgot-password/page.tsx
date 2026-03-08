import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { ForgotPasswordForm } from './forgot-password-form'
import { Link } from '@/i18n/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('forgotPassword')
  return { title: `${t('title')} — DarkMonkey` }
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth')

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <Link
            href="/login"
            className="text-sm text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
          >
            {t('alreadyHaveAccountLink')} {t('goToLogin')}
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
