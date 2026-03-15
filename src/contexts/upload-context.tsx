'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { createPresignedUploadUrl, registerUploadedImage } from '@/actions/admin-products'

type UploadStatus = 'uploading' | 'done' | 'error' | 'cancelled'

type UploadJob = {
  productId: string
  files: File[]
  color?: string | null
  done: number
  total: number
  status: UploadStatus
  errors: string[]
}

type UploadContextValue = {
  job: UploadJob | null
  startUpload: (productId: string, files: File[], color?: string | null) => Promise<void>
  cancel: () => void
  dismiss: () => void
}

const UploadContext = createContext<UploadContextValue | null>(null)

/**
 * Convert any image File to a WebP Blob client-side using the Canvas API.
 * Max dimension is capped at 1500px to mirror what sharp used to do server-side.
 * Falls back to the original file if the browser doesn't support WebP export.
 */
async function convertToWebP(file: File, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const MAX_DIM = 1500
      let { width, height } = img
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file) // fallback to original
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file) // fallback to original
            return
          }
          resolve(blob)
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for conversion'))
    }

    img.src = objectUrl
  })
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [job, setJob] = useState<UploadJob | null>(null)
  const cancelledRef = useRef(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startUpload = useCallback(
    async (productId: string, files: File[], color?: string | null) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
      cancelledRef.current = false

      // Client-side size guard — reject files over 50 MB immediately before any network call
      const MAX_MB = 50
      const oversized = files.filter((f) => f.size > MAX_MB * 1024 * 1024)
      const validFiles = files.filter((f) => f.size <= MAX_MB * 1024 * 1024)

      // Toast immediately for every oversized file — don't wait for anything
      oversized.forEach((f) =>
        toast.error(`${f.name} is too large — max ${MAX_MB} MB per file`, { duration: 6000 })
      )

      if (oversized.length > 0 && validFiles.length === 0) {
        setJob({
          productId,
          files,
          color: color ?? null,
          done: 0,
          total: files.length,
          status: 'error',
          errors: oversized.map((f) => `${f.name}: exceeds ${MAX_MB} MB limit`),
        })
        return
      }

      setJob({
        productId,
        files: validFiles,
        color: color ?? null,
        done: 0,
        total: validFiles.length,
        status: 'uploading',
        errors: oversized.map((f) => `${f.name}: exceeds ${MAX_MB} MB limit`),
      })

      const errors: string[] = oversized.map((f) => `${f.name}: exceeds ${MAX_MB} MB limit`)

      // Upload all valid files in parallel — each completes independently and updates the counter
      await Promise.all(
        validFiles.map(async (file) => {
          if (cancelledRef.current) return

          // Step 1: Convert to WebP client-side (Canvas API — no server needed)
          let webpBlob: Blob
          try {
            webpBlob = await convertToWebP(file)
          } catch {
            webpBlob = file // fallback to original if conversion fails
          }
          const webpFilename = file.name.replace(/\.[^.]+$/, '') + '.webp'

          // Step 2: Get presigned upload URL (tiny server action call — no file data sent)
          const presignedResult = await createPresignedUploadUrl(
            productId,
            webpFilename,
            color ?? null
          )
          if (!presignedResult.ok) {
            const msg = `${file.name}: ${presignedResult.error}`
            errors.push(msg)
            toast.error(msg, { duration: 6000 })
            setJob((prev) => (prev ? { ...prev, done: prev.done + 1, errors: [...errors] } : prev))
            return
          }

          // Step 3: Upload WebP blob directly to Supabase Storage (bypasses Vercel's 4.5 MB limit)
          const uploadTimeout = new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Upload timed out — try again')), 60_000)
          )
          try {
            const uploadResponse = await Promise.race([
              fetch(presignedResult.uploadUrl, {
                method: 'PUT',
                body: webpBlob,
                headers: { 'Content-Type': 'image/webp' },
              }),
              uploadTimeout,
            ])
            if (!uploadResponse.ok) {
              throw new Error(`Storage upload failed (${uploadResponse.status})`)
            }
          } catch (err) {
            const msg = `${file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`
            errors.push(msg)
            toast.error(msg, { duration: 6000 })
            setJob((prev) => (prev ? { ...prev, done: prev.done + 1, errors: [...errors] } : prev))
            return
          }

          // Step 3: Register the uploaded file in the DB
          const registerResult = await registerUploadedImage(
            productId,
            presignedResult.storagePath,
            file.name,
            color ?? null
          )
          if (!registerResult.ok) {
            const msg = `${file.name}: ${registerResult.error}`
            errors.push(msg)
            toast.error(msg, { duration: 6000 })
          }
          setJob((prev) => (prev ? { ...prev, done: prev.done + 1, errors: [...errors] } : prev))
        })
      )

      // If cancel() was already called it already updated the UI — don't overwrite it
      if (cancelledRef.current) return

      const finalStatus: UploadStatus = errors.length ? 'error' : 'done'
      setJob((prev) => (prev ? { ...prev, status: finalStatus, errors } : prev))

      if (!errors.length) {
        dismissTimer.current = setTimeout(() => setJob(null), 4000)
      }
    },
    []
  )

  const cancel = useCallback(() => {
    cancelledRef.current = true
    // Update UI immediately — don't wait for in-flight server actions to finish
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    setJob((prev) => (prev ? { ...prev, status: 'cancelled' } : prev))
    dismissTimer.current = setTimeout(() => setJob(null), 3000)
  }, [])

  const dismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    setJob(null)
  }, [])

  return (
    <UploadContext.Provider value={{ job, startUpload, cancel, dismiss }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used inside UploadProvider')
  return ctx
}
