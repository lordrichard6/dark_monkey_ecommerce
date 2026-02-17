import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  weight: "400",
  variable: "--font-pacifico",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'
const SITE_NAME = 'DarkMonkey'
const DEFAULT_TITLE = 'DarkMonkey — Premium quality e-commerce'
const DEFAULT_DESCRIPTION = 'Premium gamified e-commerce — commerce, customization, progression'

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
    site: '@darkmonkey',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
  );
}
