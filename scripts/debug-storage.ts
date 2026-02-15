import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listGalleryFiles() {
    console.log('Listing files in product-images/gallery/...')

    const { data, error } = await supabase
        .storage
        .from('product-images')
        .list('gallery', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        })

    if (error) {
        console.error('Error listing files:', error)
        return
    }

    if (!data || data.length === 0) {
        console.log('No files found in gallery folder.')
        return
    }

    console.log(`Found ${data.length} files:`)
    data.forEach((file) => {
        console.log(`- ${file.name} (${file.metadata?.size} bytes) - Created: ${file.created_at}`)
    })
}

listGalleryFiles()
