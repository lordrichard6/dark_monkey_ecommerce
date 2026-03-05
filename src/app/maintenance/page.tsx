import { Wrench, Clock } from 'lucide-react'

/**
 * Maintenance page — shown by middleware when NEXT_PUBLIC_MAINTENANCE_MODE=true.
 * Lives outside [locale] so it has no i18n dependency and loads fast.
 *
 * To enable: set NEXT_PUBLIC_MAINTENANCE_MODE=true in Vercel and
 * add a middleware rule that redirects all public routes here.
 */
export default function MaintenancePage() {
  return (
    <html lang="en">
      <body className="bg-black">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <Wrench className="w-20 h-20 text-amber-500" strokeWidth={1.5} />
                <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-1">
                  <Clock className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">We&apos;ll be right back</h1>

            <p className="text-zinc-400 mb-6 leading-relaxed">
              Dark Monkey is undergoing scheduled maintenance. We&apos;re working hard to improve
              your experience and will be back shortly.
            </p>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 py-4">
              <p className="text-sm text-zinc-500">
                Follow us on social media for real-time updates.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
