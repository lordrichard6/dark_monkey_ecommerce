import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? 'https://d1456b0aac077a9a70b2dde9aba9bb37@o4510900578680832.ingest.de.sentry.io/4510900580581456',
  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',
  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,
  // Capture replays only on errors
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
