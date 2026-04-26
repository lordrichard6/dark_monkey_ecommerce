/**
 * Global ambient orbs.
 *
 * Cut from 6 → 3 orbs after audit. Animated 90px-blurred 50-60vmax radial
 * gradients are GPU-expensive (composited paint every frame at full viewport
 * size); the duplicates were doubling that cost without visible benefit. One
 * orb per brand color is plenty for ambient atmosphere on non-hero pages.
 * The hero adds its own scoped orbs locally for brand-specific color.
 */
export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="gradient-orb gradient-orb-purple-1" />
      <div className="gradient-orb gradient-orb-orange-1" />
      <div className="gradient-orb gradient-orb-green-1" />
    </div>
  )
}
