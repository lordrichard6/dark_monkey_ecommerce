import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'DarkMonkey — Premium quality e-commerce'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, #16a34a22 0%, #000000 70%)',
          }}
        />

        {/* Brand name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          DARK
          <span style={{ color: '#16a34a' }}>MONKEY</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: '#a1a1aa',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Premium Gamified E-commerce
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            width: 120,
            height: 3,
            background: '#16a34a',
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
