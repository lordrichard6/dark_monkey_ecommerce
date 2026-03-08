import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { NotificationSettings } from '@/components/account/NotificationSettings'

export async function generateMetadata() {
  const t = await getTranslations('account')
  return { title: t('notifications') }
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/account/notifications')

  const t = await getTranslations('account')

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Back link */}
        <Link
          href="/account"
          className="mb-8 inline-block text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          {t('backToAccount')}
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <Bell className="h-5 w-5 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">{t('notifications')}</h1>
            <p className="text-sm text-zinc-500">{t('notificationsDescription')}</p>
          </div>
        </div>

        <NotificationSettings />
      </div>
    </div>
  )
}
