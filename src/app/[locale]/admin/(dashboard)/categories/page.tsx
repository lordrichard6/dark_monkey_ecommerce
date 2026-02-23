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
    <div className="flex-1 space-y-4 p-4 pt-4 sm:p-8 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">Categories</h1>
          <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">
            Drag root categories to reorder. Changes save automatically.
          </p>
        </div>
        <Link href="/admin/categories/new" className="shrink-0">
          <button className="inline-flex items-center justify-center rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:px-4">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Category</span>
          </button>
        </Link>
      </div>

      <AdminCategoriesClient roots={roots.map((r) => ({ ...r, level: 0 }))} flatList={flatList} />
    </div>
  )
}
