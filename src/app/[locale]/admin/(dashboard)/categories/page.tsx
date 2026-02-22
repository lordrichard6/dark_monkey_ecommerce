import { getCategories } from '@/actions/admin-categories'
import { Link } from '@/i18n/navigation'
import { Plus } from 'lucide-react'
import { AdminCategoriesClient } from './AdminCategoriesClient'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const allCategories = await getCategories()

  // Build hierarchy
  type CategoryWithChildren = (typeof allCategories)[0] & { children: CategoryWithChildren[] }
  const categoryMap = new Map<string, CategoryWithChildren>()
  allCategories.forEach((c) => categoryMap.set(c.id, { ...c, children: [] }))
  const roots: CategoryWithChildren[] = []

  allCategories.forEach((c) => {
    const node = categoryMap.get(c.id)!
    if (c.parent_id && categoryMap.has(c.parent_id)) {
      categoryMap.get(c.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  function flatten(
    nodes: CategoryWithChildren[],
    level = 0
  ): ((typeof allCategories)[0] & { level: number })[] {
    return nodes.flatMap((node) => [{ ...node, level }, ...flatten(node.children, level + 1)])
  }

  const flatList = flatten(roots)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Drag root categories to reorder. Changes save automatically.
          </p>
        </div>
        <Link href="/admin/categories/new">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-amber-500 text-black hover:bg-amber-600 h-9 px-4 py-2">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </button>
        </Link>
      </div>

      <AdminCategoriesClient roots={roots.map((r) => ({ ...r, level: 0 }))} flatList={flatList} />
    </div>
  )
}
