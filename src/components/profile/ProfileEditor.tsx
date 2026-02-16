'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { AvatarUpload } from './AvatarUpload'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

type ProfileData = {
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  birthday?: string | null
  preferred_size?: string | null
  style_preferences?: string[] | null
  is_public?: boolean
}

type Props = {
  userId: string
  userEmail?: string | null
  initialData: ProfileData | null
}

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const STYLE_OPTIONS = [
  'Casual',
  'Formal',
  'Sporty',
  'Streetwear',
  'Vintage',
  'Minimalist',
  'Bohemian',
  'Classic',
]

export function ProfileEditor({ userId, userEmail, initialData }: Props) {
  const router = useRouter()
  const t = useTranslations('profile')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<ProfileData>({
    display_name: initialData?.display_name || '',
    bio: initialData?.bio || '',
    avatar_url: initialData?.avatar_url || null,
    birthday: initialData?.birthday || '',
    preferred_size: initialData?.preferred_size || '',
    style_preferences: initialData?.style_preferences || [],
    is_public: initialData?.is_public || false,
  })

  const handleStyleToggle = (style: string) => {
    const currentPrefs = formData.style_preferences || []
    const newPrefs = currentPrefs.includes(style)
      ? currentPrefs.filter((s) => s !== style)
      : [...currentPrefs, style]

    setFormData({ ...formData, style_preferences: newPrefs })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          birthday: formData.birthday || null,
          preferred_size: formData.preferred_size || null,
          style_preferences: formData.style_preferences || [],
          is_public: formData.is_public,
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setSuccess(true)

      // Redirect back to account page after a moment
      setTimeout(() => {
        router.refresh()
        router.push('/account')
      }, 1500)
    } catch (err) {
      console.error('Profile update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar Section */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('avatar')}</h2>
        <AvatarUpload
          userId={userId}
          currentAvatarUrl={formData.avatar_url}
          userEmail={userEmail}
          displayName={formData.display_name}
          onUploadComplete={(url) => {
            setFormData({ ...formData, avatar_url: url })
            router.refresh()
          }}
        />
      </div>

      {/* Basic Info */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('basicInfo')}</h2>

        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-zinc-300">
              {t('displayName')}
            </label>
            <input
              type="text"
              id="display_name"
              value={formData.display_name || ''}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder={t('displayNamePlaceholder')}
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-zinc-300">
              {t('bio')}
            </label>
            <textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder={t('bioPlaceholder')}
            />
          </div>

          {/* Birthday */}
          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-zinc-300">
              {t('birthday')}
            </label>
            <input
              type="date"
              id="birthday"
              value={formData.birthday || ''}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            <p className="mt-1 text-xs text-zinc-500">{t('birthdayHint')}</p>
          </div>
        </div>
      </div>

      {/* Personalization */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('personalization')}</h2>

        <div className="space-y-4">
          {/* Preferred Size */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              {t('preferredSize')}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFormData({ ...formData, preferred_size: size })}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${formData.preferred_size === size
                    ? 'bg-amber-500 text-black'
                    : 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-500">{t('preferredSizeHint')}</p>
          </div>

          {/* Style Preferences */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              {t('stylePreferences')}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleStyleToggle(style)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${formData.style_preferences?.includes(style)
                    ? 'bg-amber-500 text-black'
                    : 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
                    }`}
                >
                  {style}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-500">{t('stylePreferencesHint')}</p>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">{t('privacy')}</h2>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
            className="h-5 w-5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-2 focus:ring-amber-500"
          />
          <div>
            <span className="text-sm font-medium text-zinc-300">{t('makeProfilePublic')}</span>
            <p className="text-xs text-zinc-500">{t('makeProfilePublicHint')}</p>
          </div>
        </label>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {t('profileUpdated')}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push('/account')}
          className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
        >
          {t('cancel')}
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? t('saving') : t('saveChanges')}
        </button>
      </div>
    </form>
  )
}
