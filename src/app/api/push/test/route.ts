import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendTestNotification } from '@/lib/send-push-notification'

/**
 * API route to send a test push notification
 * Useful for testing the push notification system
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Send test notification
        await sendTestNotification(user.id)

        return NextResponse.json({
            success: true,
            message: 'Test notification sent!',
        })
    } catch (error) {
        console.error('Test notification error:', error)
        return NextResponse.json(
            { error: 'Failed to send test notification' },
            { status: 500 }
        )
    }
}
