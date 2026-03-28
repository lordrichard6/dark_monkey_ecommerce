import type { Metadata } from 'next'
import { ConfirmClient } from './confirm-client'

export const metadata: Metadata = {
  title: 'Verifying your link…',
  robots: { index: false, follow: false },
}

export default function ConfirmPage() {
  return <ConfirmClient />
}
