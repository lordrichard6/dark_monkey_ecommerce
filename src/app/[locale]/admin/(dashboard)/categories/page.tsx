import { getCategories } from '@/actions/admin-categories'
import { Link } from '@/i18n/navigation'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { deleteCategory } from '@/actions/admin-categories'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
    const allCategories = await getCategories()

    // Build hierarchy
    type CategoryWithChildren = typeof allCategories[0] & { children: CategoryWithChildren[] }
    const categoryMap = new Map<string, CategoryWithChildren>()
    allCategories.forEach(c => categoryMap.set(c.id, { ...c, children: [] }))
    const roots: CategoryWithChildren[] = []

    // Sort to ensure consistent order before building tree (though sort_order helps)

    allCategories.forEach(c => {
        const node = categoryMap.get(c.id)!
        if (c.parent_id && categoryMap.has(c.parent_id)) {
            categoryMap.get(c.parent_id)!.children.push(node)
        } else {
            roots.push(node)
        }
    })

    // Flatten for display
    function flatten(nodes: CategoryWithChildren[], level = 0): (typeof allCategories[0] & { level: number })[] {
        return nodes.flatMap(node => [
            { ...node, level },
            ...flatten(node.children, level + 1)
        ])
    }

    const categories = flatten(roots)

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                <Link href="/admin/categories/new">
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-amber-500 text-black hover:bg-amber-600 h-9 px-4 py-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </button>
                </Link>
            </div>

            <div className="rounded-lg border border-zinc-800">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/80">
                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Slug</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Sort Order</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/50">
                                <td className="px-4 py-3 font-medium text-zinc-50">
                                    <div style={{ paddingLeft: `${category.level * 24}px` }} className="flex items-center">
                                        {category.level > 0 && <span className="text-zinc-600 mr-2">└</span>}
                                        {category.name}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-zinc-400">{category.slug}</td>
                                <td className="px-4 py-3 text-sm text-zinc-400">{category.sort_order}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link href={`/admin/categories/${category.id}`}>
                                            <button className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </Link>
                                        <form action={async () => {
                                            'use server'
                                            await deleteCategory(category.id)
                                        }}>
                                            <button className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="mb-4 rounded-full bg-zinc-900 p-4 ring-1 ring-zinc-800">
                                            <Plus className="h-6 w-6 text-zinc-500" />
                                        </div>
                                        <h3 className="text-lg font-medium text-zinc-200">No categories found</h3>
                                        <p className="mt-1 max-w-sm text-sm text-zinc-500">
                                            Create your first category to get started.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
