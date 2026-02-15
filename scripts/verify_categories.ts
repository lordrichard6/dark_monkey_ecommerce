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

async function verify() {
    // 1. Create Parent
    const { data: parent, error: parentError } = await supabase
        .from('categories')
        .insert({
            name: 'Test Parent',
            slug: 'test-parent-' + Date.now(),
            sort_order: 0
        })
        .select()
        .single()

    if (parentError) {
        console.error('Parent creation failed:', parentError)
        return
    }
    console.log('Parent created:', parent.id)

    // 2. Create Child
    const { data: child, error: childError } = await supabase
        .from('categories')
        .insert({
            name: 'Test Child',
            slug: 'test-child-' + Date.now(),
            parent_id: parent.id,
            sort_order: 0
        })
        .select()
        .single()

    if (childError) {
        console.error('Child creation failed:', childError)
        return
    }
    console.log('Child created:', child.id, 'Parent:', child.parent_id)

    // 3. Verify Relationship
    if (child.parent_id === parent.id) {
        console.log('SUCCESS: Parent-Child relationship verified.')
    } else {
        console.error('FAILURE: Parent ID mismatch.')
    }

    // Cleanup
    await supabase.from('categories').delete().eq('id', child.id)
    await supabase.from('categories').delete().eq('id', parent.id)
}

verify()
