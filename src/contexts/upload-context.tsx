'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { uploadProductImage } from '@/actions/admin-products'

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

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [job, setJob] = useState<UploadJob | null>(null)
  const cancelledRef = useRef(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startUpload = useCallback(
    async (productId: string, files: File[], color?: string | null) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
      cancelledRef.current = false

      // Client-side size guard — reject files over 8 MB immediately before any network call
      const MAX_MB = 8
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
          const formData = new FormData()
          formData.append('file', file)

          // Race the server action against a 45-second timeout so the UI never hangs forever
          const timeout = new Promise<{ ok: false; error: string }>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: false,
                  error: 'Upload timed out — try a smaller or more compressed image',
                }),
              45_000
            )
          )
          const result = await Promise.race([
            uploadProductImage(productId, formData, color ?? undefined),
            timeout,
          ])

          if (!result.ok) {
            const msg = `${file.name}: ${result.error}`
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
