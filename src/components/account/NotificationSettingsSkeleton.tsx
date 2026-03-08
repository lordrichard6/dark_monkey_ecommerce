export function NotificationSettingsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-9 w-9 rounded-lg bg-white/5" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-white/5" />
              <div className="h-3 w-56 rounded bg-white/5" />
            </div>
          </div>
          <div className="h-9 w-20 flex-shrink-0 rounded-lg bg-white/5" />
        </div>
      </div>
      <div className="h-12 rounded-xl border border-white/5 bg-white/[0.02]" />
    </div>
  )
}
