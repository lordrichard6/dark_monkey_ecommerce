import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Pacifico } from 'next/font/google'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { SITE_URL, DEFAULT_DESCRIPTION, TWITTER_HANDLE } from '@/lib/site-config'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

const pacifico = Pacifico({
  weight: '400',
  variable: '--font-pacifico',
  subsets: ['latin'],
  display: 'swap',
})

const SITE_NAME = 'DarkMonkey'
const DEFAULT_TITLE = 'DarkMonkey — Premium streetwear, printed in Switzerland'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'DarkMonkey — Premium quality e-commerce',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: TWITTER_HANDLE,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.webp', sizes: 'any' },
    ],
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // next-intl middleware sets x-next-intl-locale on every request.
  // Reading it here lets us set the correct html[lang] without touching
  // the route params, which keeps the root layout signature valid for Next.js.
  const headersList = await headers()
  const lang = headersList.get('x-next-intl-locale') ?? 'en'
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Preconnect to image origins so the first product image lands ~100ms faster. */}
        <link
          rel="preconnect"
          href="https://ehkwnyiktjsmegzxbpph.supabase.co"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://files.cdn.printful.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ehkwnyiktjsmegzxbpph.supabase.co" />
        <link rel="dns-prefetch" href="https://files.cdn.printful.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </Suspense>
        <ServiceWorkerRegister />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
