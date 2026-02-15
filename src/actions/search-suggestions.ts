'use server';

import { createClient } from '@/lib/supabase/server';

export async function getProductSuggestions(query: string) {
    if (!query || query.length < 2) return [];

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('products')
        .select('name, slug, product_images(url)')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .is('deleted_at', null)
        .limit(5);

    if (error) {
        console.error('Autocomplete error:', error);
        return [];
    }

    return data.map(p => ({
        name: p.name,
        slug: p.slug,
        imageUrl: (p.product_images as any)?.[0]?.url || null
    }));
}
