import { getTranslations } from 'next-intl/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth-admin'
import { redirect } from 'next/navigation'
import { EmailPreviewClient } from './email-preview-client'

export default async function EmailsPage() {
  const user = await getAdminUser()
  if (!user) redirect('/admin')

  const supabase = getAdminClient()
  const t = await getTranslations('admin')

  // Fetch registered users for the send picker
  let users: Array<{ id: string; email: string; name: string }> = []
  if (supabase) {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 100 })
    users = (data?.users ?? [])
      .map((u) => ({
        id: u.id,
        email: u.email ?? '',
        name: (u.user_metadata?.full_name as string) ?? u.email?.split('@')[0] ?? 'User',
      }))
      .filter((u) => u.email)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{t('emails.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t('emails.subtitle')}</p>
      </div>
      <EmailPreviewClient users={users} />
    </div>
  )
}
