'use client'

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="gradient-orb gradient-orb-purple-1" />
      <div className="gradient-orb gradient-orb-purple-2" />
      <div className="gradient-orb gradient-orb-orange-1" />
      <div className="gradient-orb gradient-orb-orange-2" />
      <div className="gradient-orb gradient-orb-green-1" />
      <div className="gradient-orb gradient-orb-green-2" />
    </div>
  )
}
