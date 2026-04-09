import { createClient } from '@/lib/supabase/server'
import type { HomeProduct } from '@/actions/products'
import { NewArrivals } from './NewArrivals'

interface Props {
  products: HomeProduct[]
}

export async function NewArrivalsSection({ products }: Props) {
  const supabase = await createClient()

  const { data: categoriesData } = await supabase.from('categories').select('*').order('sort_order')

  // Build category tree
  const categoriesMap = new Map()
  const rootCategories: { id: string; name: string; slug: string }[] = []

  if (categoriesData) {
    // First pass: create nodes
    categoriesData.forEach((cat) => {
      categoriesMap.set(cat.id, { ...cat, subcategories: [] })
    })

    // Second pass: build tree
    categoriesData.forEach((cat) => {
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
