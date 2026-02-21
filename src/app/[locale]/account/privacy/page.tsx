import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'
import { DataExport } from '@/components/privacy/DataExport'
import { DataDeletion } from '@/components/privacy/DataDeletion'

export async function generateMetadata() {
  const t = await getTranslations('gdpr')
  return { title: t('pageTitle') }
}

export default async function PrivacyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/account/privacy')

  const t = await getTranslations('gdpr')

  // Check for existing pending deletion request
  const { data: existingRequest } = await supabase
    .from('data_deletion_requests')
    .select('status, requested_at')
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .maybeSingle()

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="mx-auto max-w-3xl px-4">
        {/* Back link */}
        <Link
          href="/account"
          className="mb-8 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToAccount')}
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-7 w-7 text-zinc-400" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">{t('pageTitle')}</h1>
            <p className="text-sm text-zinc-500">{t('pageSubtitle')}</p>
          </div>
        </div>

        {/* Info box */}
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5 text-sm text-zinc-400">
          <p className="mb-2 font-medium text-zinc-300">{t('yourRights')}</p>
          <ul className="list-inside list-disc space-y-1">
            <li>{t('rightAccess')}</li>
            <li>{t('rightPortability')}</li>
            <li>{t('rightErasure')}</li>
            <li>{t('rightContact')}</li>
          </ul>
        </div>

        <div className="space-y-6">
          {/* Data Export */}
          <DataExport />

          {/* Pending deletion notice */}
          {existingRequest && (
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4 text-sm text-amber-300/80">
              {t('deletePendingNotice', {
                date: new Date(existingRequest.requested_at).toLocaleDateString(),
              })}
            </div>
          )}

          {/* Data Deletion */}
          {!existingRequest && <DataDeletion />}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-zinc-600">
          {t('gdprContact')}{' '}
          <a href="mailto:privacy@dark-monkey.ch" className="underline hover:text-zinc-400">
            privacy@dark-monkey.ch
          </a>
        </p>
      </div>
    </div>
  )
}
