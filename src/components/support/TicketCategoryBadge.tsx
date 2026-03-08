import type { TicketCategory } from '@/actions/support'

const CATEGORY_STYLES: Record<TicketCategory, string> = {
  order_issue: 'bg-red-500/10 text-red-400',
  complaint: 'bg-orange-500/10 text-orange-400',
  suggestion: 'bg-purple-500/10 text-purple-400',
  question: 'bg-sky-500/10 text-sky-400',
}

type Props = {
  category: TicketCategory
  label: string
}

export function TicketCategoryBadge({ category, label }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[category]}`}
    >
      {label}
    </span>
  )
}
