import Link from 'next/link'

export function AdminNotConfigured() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-200/90">
      <h2 className="font-semibold">Admin client not configured</h2>
      <p className="mt-2 text-sm">
        Add <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to your
        <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs"> .env.local</code> file.
      </p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-200/80">
        <li>Local: run <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-xs">supabase status</code> and copy the Secret key</li>
        <li>Cloud: Supabase Dashboard → Settings → API → service_role key</li>
      </ul>
      <p className="mt-3 text-sm">Restart the dev server after adding the variable.</p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm text-amber-400 underline-offset-4 hover:text-amber-300 hover:underline"
      >
        ← Back to store
      </Link>
    </div>
  )
}
