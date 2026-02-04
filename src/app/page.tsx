import { redirect } from 'next/navigation'

/**
 * Root path has no content; all routes are under [locale].
 * Redirect to default locale so GET / always works (proxy may also redirect when it runs).
 */
export default function RootPage() {
  redirect('/en')
}
