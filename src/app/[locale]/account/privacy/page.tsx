import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Shield, Edit, Cookie, Mail } from 'lucide-react'
import { DataExport } from '@/components/privacy/DataExport'
import { DataDeletion } from '@/components/privacy/DataDeletion'
import { CookieResetButton } from '@/components/privacy/CookieResetButton'
import { CopyEmailButton } from '@/components/privacy/CopyEmailButton'

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

  // Fetch pending deletion request + profile (for last_export_at) in parallel
  const [{ data: existingRequest }, { data: profile }] = await Promise.all([
    supabase
      .from('data_deletion_requests')
      .select('status, requested_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .maybeSingle(),
    supabase.from('user_profiles').select('last_data_export_at').eq('id', user.id).single(),
  ])

  const PRIVACY_EMAIL = 'privacy@dark-monkey.ch'

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4">
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
            <Shield className="h-5 w-5 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">{t('pageTitle')}</h1>
            <p className="text-sm text-zinc-500">{t('pageSubtitle')}</p>
          </div>
        </div>

        {/* GDPR Rights info box */}
        <div className="mb-6 rounded-xl border border-white/5 bg-white/[0.03] p-5 text-sm text-zinc-400 backdrop-blur-sm">
          <p className="mb-3 font-medium text-zinc-300">{t('yourRights')}</p>
          <ul className="space-y-2">
            {[t('rightAccess'), t('rightPortability'), t('rightErasure'), t('rightContact')].map(
              (right) => (
                <li key={right} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500/60" />
                  {right}
                </li>
              )
            )}
            {/* Right to rectification — links to edit profile */}
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500/60" />
              <span>
                Right to rectification —{' '}
                <Link
                  href="/account/edit-profile"
                  className="inline-flex items-center gap-1 text-amber-400 underline-offset-2 hover:underline"
                >
                  <Edit className="h-3 w-3" />
                  Edit your profile
                </Link>
              </span>
            </li>
          </ul>
        </div>

        <div className="space-y-5">
          {/* Data Export */}
          <DataExport lastExportAt={profile?.last_data_export_at ?? null} />

          {/* Cookie Preferences */}
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-500" />
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold text-zinc-50">Cookie Preferences</h3>
                <p className="mb-4 text-sm text-zinc-400">
                  You accepted cookie consent when you first visited. You can withdraw your consent
                  at any time — this will clear your preference and show the banner again on your
                  next visit.
                </p>
                <CookieResetButton />
              </div>
            </div>
          </div>

          {/* Data Deletion */}
          <DataDeletion
            existingRequest={
              existingRequest
                ? {
                    status: existingRequest.status as 'pending' | 'processing' | 'completed',
                    requested_at: existingRequest.requested_at,
                  }
                : undefined
            }
          />
        </div>

        {/* Contact footer */}
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <Mail className="h-4 w-4 flex-shrink-0 text-zinc-600" />
          <p className="flex-1 text-xs text-zinc-500">
            {t('gdprContact')}{' '}
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="text-zinc-300 underline-offset-2 hover:text-zinc-100 hover:underline"
            >
              {PRIVACY_EMAIL}
            </a>
          </p>
          <CopyEmailButton email={PRIVACY_EMAIL} />
        </div>
      </div>
    </div>
  )
}
