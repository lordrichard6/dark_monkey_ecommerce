'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

type GoogleAnalyticsProps = {
    gaId: string
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (pathname && window.gtag) {
            const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

            // Track page view
            window.gtag('config', gaId, {
                page_path: url,
            })
        }
    }, [pathname, searchParams, gaId])

    return (
        <>
            {/* Google Tag Manager Script */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />

            {/* GA4 Initialization */}
            <Script
                id="google-analytics-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              cookie_flags: 'SameSite=None;Secure',
              anonymize_ip: true,
              allow_google_signals: false,
            });
          `,
                }}
            />
        </>
    )
}
