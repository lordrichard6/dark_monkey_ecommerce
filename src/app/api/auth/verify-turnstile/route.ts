import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { token } = await request.json()

        if (!token) {
            return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 })
        }

        const secretKey = process.env.TURNSTILE_SECRET_KEY

        // If no secret key is provided (development), simulate success
        if (!secretKey) {
            console.warn('TURNSTILE_SECRET_KEY not found. Simulating success.')
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
