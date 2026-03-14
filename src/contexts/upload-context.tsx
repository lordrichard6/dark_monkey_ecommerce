'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { uploadProductImage } from '@/actions/admin-products'

type UploadStatus = 'uploading' | 'done' | 'error'

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
  dismiss: () => void
}

const UploadContext = createContext<UploadContextValue | null>(null)

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [job, setJob] = useState<UploadJob | null>(null)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startUpload = useCallback(
    async (productId: string, files: File[], color?: string | null) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)

      const newJob: UploadJob = {
        productId,
        files,
        color: color ?? null,
        done: 0,
        total: files.length,
        status: 'uploading',
        errors: [],
      }
      setJob(newJob)

      const errors: string[] = []
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        const result = await uploadProductImage(productId, formData, color ?? undefined)
        if (!result.ok) errors.push(`${files[i].name}: ${result.error}`)
        setJob((prev) => (prev ? { ...prev, done: i + 1, errors: [...errors] } : prev))
      }

      const finalStatus: UploadStatus = errors.length ? 'error' : 'done'
      setJob((prev) => (prev ? { ...prev, status: finalStatus, errors } : prev))

      // Auto-dismiss after 4s if successful
      if (!errors.length) {
        dismissTimer.current = setTimeout(() => setJob(null), 4000)
      }
    },
    []
  )

  const dismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    setJob(null)
  }, [])

  return (
    <UploadContext.Provider value={{ job, startUpload, dismiss }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used inside UploadProvider')
  return ctx
}
