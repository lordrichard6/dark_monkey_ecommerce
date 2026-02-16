'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import md5 from 'md5'
import imageCompression from 'browser-image-compression'

type Props = {
  userId: string
  currentAvatarUrl?: string | null
  userEmail?: string | null
  displayName?: string | null
  onUploadComplete?: (url: string | null) => void
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  userEmail,
  displayName,
  onUploadComplete,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get Gravatar URL
  const getGravatarUrl = (email: string) => {
    const hash = md5(email.toLowerCase().trim())
    return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`
  }

  // Get initials for generated avatar
  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (userEmail) {
      return userEmail[0].toUpperCase()
    }
    return 'U'
  }

  // Current display URL (priority: preview > uploaded > gravatar > generated)
  const displayUrl =
    previewUrl || currentAvatarUrl || (userEmail ? getGravatarUrl(userEmail) : null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (compress if needed)
    // We no longer reject > 5MB, we try to compress it

    setError(null)

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      setUploading(true) // Show loading state during compression

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      }

      const compressedFile = await imageCompression(file, options)

      // Upload to Supabase Storage
      await uploadAvatar(compressedFile)
    } catch (error) {
      console.error('Compression error:', error)
      setError('Failed to process image. Please try a different file.')
      setUploading(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      onUploadComplete?.(publicUrl)
    } catch (err) {
      console.error('Avatar upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    if (!currentAvatarUrl) return

    try {
      const supabase = createClient()

      // Extract file path from URL
      const urlParts = currentAvatarUrl.split('/avatars/')
      if (urlParts.length === 2) {
        const filePath = urlParts[1]

        // Delete from storage
        await supabase.storage.from('avatars').remove([filePath])
      }

      // Remove from profile
      await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      setPreviewUrl(null)
      onUploadComplete?.(null)
    } catch (err) {
      console.error('Avatar removal error:', err)
      setError('Failed to remove avatar')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative">
        {displayUrl ? (
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-zinc-800 bg-zinc-900">
            <Image
              src={displayUrl}
              alt="Avatar"
              fill
              className="object-cover"
              unoptimized
              onError={() => {
                // Fallback to generated avatar if Gravatar fails
                setPreviewUrl(null)
              }}
            />
          </div>
        ) : (
          // Generated avatar with initials
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-zinc-800 bg-gradient-to-br from-amber-500 to-amber-600 text-4xl font-bold text-white">
            {getInitials()}
          </div>
        )}

        {/* Remove button */}
        {currentAvatarUrl && (
          <button
            type="button"
            onClick={removeAvatar}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-2 text-white shadow-lg transition hover:bg-red-600"
            aria-label="Remove avatar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {currentAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}
            </>
          )}
        </button>

        <p className="text-xs text-zinc-500">JPG, PNG, GIF or WebP. Large images will be automatically optimized.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Gravatar Info */}
      {userEmail && !currentAvatarUrl && (
        <p className="text-center text-xs text-zinc-500">
          Using <a href="https://gravatar.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400">Gravatar</a> for {userEmail}
        </p>
      )}
    </div>
  )
}
