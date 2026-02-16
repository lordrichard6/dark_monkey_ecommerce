import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditor } from '@/components/profile/ProfileEditor'
import { getTranslations } from 'next-intl/server'

export default async function EditProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const t = await getTranslations('profile')

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-zinc-50">{t('editProfile')}</h1>

        <ProfileEditor
          userId={user.id}
          userEmail={user.email}
          initialData={profile}
        />
      </div>
    </div>
  )
}
