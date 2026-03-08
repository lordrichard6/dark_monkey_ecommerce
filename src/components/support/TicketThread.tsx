import type { TicketMessage } from '@/actions/support'

type Props = {
  messages: TicketMessage[]
  youLabel: string
  adminLabel: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TicketThread({ messages, youLabel, adminLabel }: Props) {
  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.is_admin_reply
                ? 'rounded-tl-none bg-zinc-800 text-zinc-100'
                : 'rounded-tr-none bg-amber-500/15 text-zinc-100 border border-amber-500/20'
            }`}
          >
            <p
              className={`mb-1 text-xs font-medium ${msg.is_admin_reply ? 'text-amber-400' : 'text-zinc-400'}`}
            >
              {msg.is_admin_reply ? adminLabel : youLabel}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
            <p className="mt-2 text-right text-[10px] text-zinc-500">
              {formatDate(msg.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
