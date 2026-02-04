import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ForgotPasswordForm } from './forgot-password-form'

export async function generateMetadata() {
  const t = await getTranslations('forgotPassword')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations('forgotPassword')
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-50">{t('title')}</h1>
          <p className="mt-2 text-zinc-400">
            {t('instructions')}
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-center">
          <Link
            href="/login"
            className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
          >
            {t('backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
