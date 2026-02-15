import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    const { error: newsletterError } = await supabase.from('newsletter_subs').select('id').limit(1)
    const newsletterExists = !newsletterError || newsletterError.code !== 'PGRST205'

    const { error: viewsError } = await supabase.from('product_views').select('id').limit(1)
    const viewsExists = !viewsError || viewsError.code !== 'PGRST205'

    const { error: announcementsError } = await supabase.from('announcements').select('id').limit(1)
    const announcementsExists = !announcementsError || announcementsError.code !== 'PGRST205'

    console.log(JSON.stringify({ newsletterExists, viewsExists, announcementsExists }))
}

check()
