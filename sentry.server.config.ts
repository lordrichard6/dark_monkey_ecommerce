import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? 'https://d1456b0aac077a9a70b2dde9aba9bb37@o4510900578680832.ingest.de.sentry.io/4510900580581456',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
})
