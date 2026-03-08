import { useEffect, useRef, type RefObject } from 'react'

/**
 * Focusable element selectors — same list used by most focus-trap libraries.
 * Excludes elements with `tabindex="-1"` (programmatically focusable only).
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(', ')

/**
 * Traps keyboard focus inside `containerRef` when `active` is true.
 *
 * Behaviour:
 * - On activation: saves the currently focused element, moves focus to the
 *   first focusable element inside the container.
 * - While active: intercepts Tab / Shift+Tab to cycle within the container.
 * - On deactivation (cleanup): restores focus to the element that was focused
 *   before the trap was activated.
 *
 * @param containerRef – ref pointing to the dialog / drawer / panel element
 * @param active       – whether the trap should be active right now
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current

    // Remember who had focus before we hijacked it
    previousFocusRef.current = document.activeElement as HTMLElement

    // Move focus into the container immediately
    const initialEls = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
    initialEls[0]?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      const els = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))

      if (els.length === 0) {
        e.preventDefault()
        return
      }

      const first = els[0]
      const last = els[els.length - 1]
      const focused = document.activeElement

      if (e.shiftKey) {
        // Shift+Tab: if on first element (or somehow outside), wrap to last
        if (focused === first || !container.contains(focused)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: if on last element (or somehow outside), wrap to first
        if (focused === last || !container.contains(focused)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to where it was before the trap activated
      previousFocusRef.current?.focus()
    }
    // containerRef is a stable ref object — safe to include without stale-closure risk
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
