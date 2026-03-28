import type { Metadata } from 'next'

// Account pages are private — block all search engine indexing.
// robots.txt already disallows /account/, but this meta tag is the belt-and-suspenders
// defence for crawlers that ignore robots.txt.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
