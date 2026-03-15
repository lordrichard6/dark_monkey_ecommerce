'use client'

import { CheckCircle2, X, AlertCircle, Loader2, Ban } from 'lucide-react'
import { useUpload } from '@/contexts/upload-context'

export function GlobalUploadIndicator() {
  const { job, cancel, dismiss } = useUpload()

  if (!job) return null

  const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0
  const isUploading = job.status === 'uploading'
  const isDone = job.status === 'done'
  const isError = job.status === 'error'
  const isCancelled = job.status === 'cancelled'

  return (
    <div className="fixed bottom-6 right-6 z-[300] w-72 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60">
      {/* Top progress bar */}
      <div className="h-1 w-full bg-zinc-800">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            isError
              ? 'bg-red-500'
              : isDone
                ? 'bg-emerald-500'
                : isCancelled
                  ? 'bg-zinc-500'
                  : 'bg-amber-500'
          }`}
          style={{ width: `${isDone || isError || isCancelled ? 100 : pct}%` }}
        />
      </div>

      <div className="flex items-start gap-3 px-4 py-3">
        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          {isUploading && <Loader2 className="h-4 w-4 animate-spin text-amber-400" />}
          {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {isError && <AlertCircle className="h-4 w-4 text-red-400" />}
          {isCancelled && <Ban className="h-4 w-4 text-zinc-500" />}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          {isUploading && (
            <>
              <p className="text-xs font-medium text-zinc-200">
                Uploading {job.done} of {job.total} photo{job.total !== 1 ? 's' : ''}…
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Converting to WebP · {pct}%</p>
            </>
          )}
          {isDone && (
            <p className="text-xs font-medium text-zinc-200">
              {job.total} photo{job.total !== 1 ? 's' : ''} uploaded successfully
            </p>
          )}
          {isError && (
            <>
              <p className="text-xs font-medium text-zinc-200">
                {job.errors.length === job.total ? 'Upload failed' : 'Upload finished with errors'}
              </p>
              <ul className="mt-1 space-y-0.5">
                {job.errors.map((err, i) => (
                  <li key={i} className="truncate text-[11px] text-red-400" title={err}>
                    {err}
                  </li>
                ))}
              </ul>
            </>
          )}
          {isCancelled && (
            <p className="text-xs font-medium text-zinc-400">
              Upload cancelled · {job.done} of {job.total} done
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {isUploading && (
            <button
              type="button"
              onClick={cancel}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400"
              aria-label="Cancel upload"
            >
              Cancel
            </button>
          )}
          {!isUploading && (
            <button
              type="button"
              onClick={dismiss}
              className="rounded p-0.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
