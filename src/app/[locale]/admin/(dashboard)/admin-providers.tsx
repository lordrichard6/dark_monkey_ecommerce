'use client'

import { UploadProvider } from '@/contexts/upload-context'
import { GlobalUploadIndicator } from '@/components/admin/GlobalUploadIndicator'

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <UploadProvider>
      {children}
      <GlobalUploadIndicator />
    </UploadProvider>
  )
}
