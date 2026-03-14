'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
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

      setJob({
        productId,
        files,
        color: color ?? null,
        done: 0,
        total: files.length,
        status: 'uploading',
        errors: [],
      })

      const errors: string[] = []

      // Upload all files in parallel — each completes independently and updates the counter
      await Promise.all(
        files.map(async (file) => {
          if (cancelledRef.current) return
          const formData = new FormData()
          formData.append('file', file)
          const result = await uploadProductImage(productId, formData, color ?? undefined)
          if (!result.ok) errors.push(`${file.name}: ${result.error}`)
          setJob((prev) => (prev ? { ...prev, done: prev.done + 1, errors: [...errors] } : prev))
        })
      )

      if (cancelledRef.current) {
        setJob((prev) => (prev ? { ...prev, status: 'cancelled' } : prev))
        dismissTimer.current = setTimeout(() => setJob(null), 3000)
        return
      }

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
