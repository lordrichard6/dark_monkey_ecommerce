import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { TagManager } from '@/components/admin/settings/TagManager'
import { EmailTester } from '@/components/admin/settings/EmailTester'
import { Settings, Tag, Mail, Truck } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function AdminSettingsPage() {
  const supabase = getAdminClient()
  if (!supabase)
    return (
      <div className="p-8">
        <AdminNotConfigured />
      </div>
    )

  const tags = await supabase.from('tags').select('*').order('name', { ascending: true })

  const t = await getTranslations('admin')

  return (
    <div className="p-8">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-zinc-400" />
        <h1 className="text-2xl font-bold text-zinc-50">{t('settings.title')}</h1>
      </div>

      <div className="mt-8 space-y-12">
        {/* General Settings */}
        <section id="general">
          <div className="mb-6 flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-zinc-50">{t('settings.general')}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/messages"
              className="block rounded-lg border border-white/10 bg-zinc-900/50 p-4 transition hover:bg-zinc-900"
            >
              <h3 className="font-medium text-white">{t('settings.topBarMessages')}</h3>
              <p className="mt-1 text-sm text-zinc-400">{t('settings.topBarMessagesDesc')}</p>
            </Link>
            <Link
              href="/admin/categories"
              className="block rounded-lg border border-white/10 bg-zinc-900/50 p-4 transition hover:bg-zinc-900"
            >
              <h3 className="font-medium text-white">{t('settings.categories')}</h3>
              <p className="mt-1 text-sm text-zinc-400">{t('settings.categoriesDesc')}</p>
            </Link>
            <Link
              href="/admin/discounts"
              className="block rounded-lg border border-white/10 bg-zinc-900/50 p-4 transition hover:bg-zinc-900"
            >
              <h3 className="font-medium text-white">{t('settings.discounts')}</h3>
              <p className="mt-1 text-sm text-zinc-400">{t('settings.discountsDesc')}</p>
            </Link>
            <Link
              href="/admin/shipping"
              className="block rounded-lg border border-white/10 bg-zinc-900/50 p-4 transition hover:bg-zinc-900"
            >
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-zinc-400" />
                <h3 className="font-medium text-white">{t('settings.shippingRates')}</h3>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{t('settings.shippingRatesDesc')}</p>
            </Link>
          </div>
        </section>

        {/* Email Testing */}
        <section id="email-testing">
          <div className="mb-6 flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-zinc-50">
              {t('settings.emailNotifications')}
            </h2>
          </div>
          <EmailTester />
        </section>

        {/* Tag Management */}
        <section id="tags">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-zinc-50">{t('settings.tags')}</h2>
          </div>
          <TagManager initialTags={tags.data || []} />
        </section>
      </div>
    </div>
  )
}
