import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(url, key)

const sessionId = process.argv[2]

async function check() {
    console.log(`Checking status for session: ${sessionId}`)

    const { data: abandoned, error: abandonedError } = await supabase
        .from('abandoned_checkouts')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .maybeSingle()

    if (abandoned) {
        console.log('Found in abandoned_checkouts:', JSON.stringify(abandoned, null, 2))
    } else {
        console.log('Not found in abandoned_checkouts.')
        if (abandonedError) console.error('Error fetching abandoned:', abandonedError.message)
    }

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .maybeSingle()

    if (order) {
        console.log('Found in orders:', JSON.stringify(order, null, 2))
    } else {
        console.log('Not found in orders.')
        if (orderError) console.error('Error fetching order:', orderError.message)
    }
}

check()
