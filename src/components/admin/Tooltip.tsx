'use client'

type TooltipProps = {
  content: string
  children: React.ReactNode
  /** Default: 'center'. Controls horizontal alignment of the tooltip relative to the trigger. */
  align?: 'left' | 'center' | 'right'
  /** Default: 'top'. Controls whether the tooltip appears above or below. */
  side?: 'top' | 'bottom'
  /** Max width in px. Default: 220 */
  width?: number
}

export function Tooltip({
  content,
  children,
  align = 'center',
  side = 'top',
  width = 220,
}: TooltipProps) {
  const alignClass =
    align === 'left'
      ? 'left-0 -translate-x-0'
      : align === 'right'
        ? 'right-0 translate-x-0'
        : 'left-1/2 -translate-x-1/2'

  const posClass = side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'

  const arrowClass = side === 'top' ? 'top-full border-t-zinc-700' : 'bottom-full border-b-zinc-700'

  const arrowAlignClass =
    align === 'left' ? 'left-4' : align === 'right' ? 'right-4' : 'left-1/2 -translate-x-1/2'

  return (
    <div className="group/tip relative inline-flex">
      {children}
      <div
        className={`pointer-events-none absolute ${posClass} ${alignClass} z-[400] rounded-lg border border-zinc-700 bg-zinc-800/95 px-3 py-2 text-xs leading-relaxed text-zinc-300 shadow-xl backdrop-blur-sm opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100`}
        style={{ width }}
        role="tooltip"
      >
        {content}
        {/* Arrow */}
        <span className={`absolute ${arrowAlignClass} ${arrowClass} border-4 border-transparent`} />
      </div>
    </div>
  )
}
