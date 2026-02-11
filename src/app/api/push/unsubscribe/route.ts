import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { endpoint } = body

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Mark subscription as inactive
        const { error } = await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('subscription->>endpoint', endpoint)

        if (error) {
            console.error('Failed to unsubscribe:', error)
            return NextResponse.json(
                { error: 'Failed to unsubscribe' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unsubscribe error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
