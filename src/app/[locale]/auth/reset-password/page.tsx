import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from './reset-password-form'

export async function generateMetadata() {
  const t = await getTranslations('resetPassword')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/forgot-password?error=expired`)
  }

  const t = await getTranslations('resetPassword')
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-50">{t('title')}</h1>
          <p className="mt-2 text-zinc-400">{t('instructions')}</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
