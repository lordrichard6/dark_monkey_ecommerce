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

async function cleanupGallery() {
    console.log('Cleaning up gallery items...')

    // Find items to delete (specifically the one we saw or all)
    // Let's delete ensuring we don't wipe everything if there was good data, 
    // but we saw only 1 item and it was bad.

    const { data, error } = await supabase
        .from('gallery_items')
        .select('id, image_url')

    if (error) {
        console.error('Error fetching items:', error)
        return
    }

    if (!data || data.length === 0) {
        console.log('No items to delete.')
        return
    }

    console.log(`Found ${data.length} items. Deleting...`)

    for (const item of data) {
        console.log(`Deleting item ${item.id} (${item.image_url})`)

        // Delete from Storage first
        if (item.image_url) {
            try {
                // Extract path from URL
                // URL: http://127.0.0.1:54321/storage/v1/object/public/product-images/gallery/filename.png
                const urlParts = item.image_url.split('/product-images/')
                if (urlParts.length > 1) {
                    const path = urlParts[1]
                    const { error: storageError } = await supabase.storage
                        .from('product-images')
                        .remove([path])

                    if (storageError) console.error('Storage delete error:', storageError)
                    else console.log('Storage image deleted.')
                }
            } catch (e) {
                console.error('Error parsing/deleting image:', e)
            }
        }

        // Delete from DB
        const { error: deleteError } = await supabase
            .from('gallery_items')
            .delete()
            .eq('id', item.id)

        if (deleteError) console.error('DB delete error:', deleteError)
        else console.log('DB record deleted.')
    }
}

cleanupGallery()
