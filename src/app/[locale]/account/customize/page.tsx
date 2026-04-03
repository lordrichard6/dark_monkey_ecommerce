import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMyCustomRequests } from '@/actions/custom-products'
import { CustomizeStudio } from './CustomizeStudio'
import { MyCustomRequests } from './MyCustomRequests'
import { getTranslations } from 'next-intl/server'

export default async function CustomizePage({
  searchParams,
}: {
  searchParams: Promise<{ change?: string }>
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login?redirectTo=/account/customize')

  const [requests, t, params] = await Promise.all([
    getMyCustomRequests(),
    getTranslations('customize'),
    searchParams,
  ])

  const changeStatus = params.change // 'success' | 'cancelled' | undefined

  return (
    <div className="min-h-screen pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 120% at 50% 0%, rgba(251,191,36,0.10) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(251,191,36,0.3) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050508] to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎨</span>
            <div>
              <h1 className="text-2xl font-bold text-zinc-50">{t('title')}</h1>
              <p className="mt-1 text-sm text-zinc-400">{t('subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-12 px-4">
        {/* Change request feedback */}
        {changeStatus === 'success' && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-400">
            ✅ {t('changeRequestSuccess')}
          </div>
        )}
        {changeStatus === 'cancelled' && (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-5 py-4 text-sm text-zinc-400">
            {t('changeRequestCancelled')}
          </div>
        )}

        {/* Existing requests */}
        {requests.length > 0 && <MyCustomRequests requests={requests} userId={data.user.id} />}

        {/* New request form */}
        <CustomizeStudio userId={data.user.id} />
      </div>
    </div>
  )
}
