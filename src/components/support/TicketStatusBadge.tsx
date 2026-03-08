import type { TicketStatus } from '@/actions/support'

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  resolved: 'bg-green-500/15 text-green-400 border-green-500/20',
  closed: 'bg-zinc-700/40 text-zinc-400 border-zinc-700/50',
}

const STATUS_DOTS: Record<TicketStatus, string> = {
  open: 'bg-amber-400',
  in_progress: 'bg-blue-400',
  resolved: 'bg-green-400',
  closed: 'bg-zinc-500',
}

type Props = {
  status: TicketStatus
  label: string
}

export function TicketStatusBadge({ status, label }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status]}`} />
      {label}
    </span>
  )
}
