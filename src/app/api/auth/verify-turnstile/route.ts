import { NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const rl = await rateLimit(getClientIp(request.headers), 'auth')
  if (!rl.success) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 })
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY

    // If no secret key is provided, bypass only in development
    if (!secretKey) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          '[verify-turnstile] CRITICAL: TURNSTILE_SECRET_KEY is not set in production. ' +
            'CAPTCHA verification is broken. Set the env var in Vercel.'
        )
        return NextResponse.json(
          { success: false, error: 'CAPTCHA verification unavailable' },
          { status: 500 }
        )
      }
      console.warn('[verify-turnstile] TURNSTILE_SECRET_KEY not found. Bypassing in development.')
      return NextResponse.json({ success: true })
    }

    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    })

    const outcome = await result.json()

    if (outcome.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 403 })
    }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
