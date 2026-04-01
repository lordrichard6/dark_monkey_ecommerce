import { createClient } from '@/lib/supabase/server'
import { fetchHomeProducts } from '@/actions/products'
import { NewArrivals } from './NewArrivals'

export async function NewArrivalsSection() {
  const supabase = await createClient()

  const [products, categoriesData] = await Promise.all([
    fetchHomeProducts({ sort: 'newest', limit: 10 }),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  // Build category tree
  const categoriesMap = new Map()
  const rootCategories: { id: string; name: string; slug: string }[] = []

  if (categoriesData.data) {
    // First pass: create nodes
    categoriesData.data.forEach((cat) => {
      categoriesMap.set(cat.id, { ...cat, subcategories: [] })
    })

    // Second pass: build tree
    categoriesData.data.forEach((cat) => {
      if (cat.parent_id) {
        const parent = categoriesMap.get(cat.parent_id)
        if (parent) {
          parent.subcategories.push(categoriesMap.get(cat.id))
        }
      } else {
        rootCategories.push(categoriesMap.get(cat.id))
      }
    })
  }

  return <NewArrivals products={products} categories={rootCategories} />
}
