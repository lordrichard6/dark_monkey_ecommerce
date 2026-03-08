import { InstallPrompt } from '@/components/pwa/InstallPrompt'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <InstallPrompt />
    </>
  )
}
