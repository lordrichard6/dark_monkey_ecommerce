import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'pt', 'de', 'it', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true,
})
