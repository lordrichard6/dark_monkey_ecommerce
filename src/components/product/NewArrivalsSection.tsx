import { getCachedAllCategories } from '@/lib/supabase/server'
import type { HomeProduct } from '@/actions/products'
import { NewArrivals } from './NewArrivals'

interface Props {
  products: HomeProduct[]
}

type CategoryNode = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  subcategories: CategoryNode[]
}

export async function NewArrivalsSection({ products }: Props) {
  // Cached across the request — coalesces with CategoryStrip's category fetch.
  const categoriesData = await getCachedAllCategories()

  // Build category tree from the flat list
  const categoriesMap = new Map<string, CategoryNode>()
  const rootCategories: CategoryNode[] = []

  for (const cat of categoriesData) {
    categoriesMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id,
      subcategories: [],
    })
  }

  for (const cat of categoriesData) {
    const node = categoriesMap.get(cat.id)
    if (!node) continue
    if (cat.parent_id) {
      const parent = categoriesMap.get(cat.parent_id)
      if (parent) parent.subcategories.push(node)
    } else {
      rootCategories.push(node)
    }
  }

  return <NewArrivals products={products} categories={rootCategories} />
}
