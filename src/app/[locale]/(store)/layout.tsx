import { Suspense } from 'react'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { RecentActivityStrip } from '@/components/RecentActivityStrip'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <RecentActivityStrip />
      </Suspense>
      <InstallPrompt />
    </>
  )
}
