import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { subscription, userAgent } = body

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
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

        // Check if subscription already exists
        const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('subscription->>endpoint', subscription.endpoint)
            .single()

        if (existing) {
            // Update existing subscription
            const { error: updateError } = await supabase
                .from('push_subscriptions')
                .update({
                    subscription,
                    user_agent: userAgent,
                    is_active: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)

            if (updateError) {
                console.error('Failed to update subscription:', updateError)
                return NextResponse.json(
                    { error: 'Failed to update subscription' },
                    { status: 500 }
                )
            }
        } else {
            // Create new subscription
            const { error: insertError } = await supabase
                .from('push_subscriptions')
                .insert({
                    user_id: user.id,
                    subscription,
                    user_agent: userAgent,
                    is_active: true,
                })

            if (insertError) {
                console.error('Failed to save subscription:', insertError)
                return NextResponse.json(
                    { error: 'Failed to save subscription' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Subscribe error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
