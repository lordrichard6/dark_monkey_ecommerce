import { getCategories } from '@/actions/admin-categories'
import { Link } from '@/i18n/routing'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { deleteCategory } from '@/actions/admin-categories'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
    const categories = await getCategories()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                <Link href="/admin/categories/new">
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-9 px-4 py-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </button>
                </Link>
            </div>

            <div className="rounded-md border border-white/10 bg-black/60 backdrop-blur-xl">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b border-white/10 transition-colors hover:bg-white/5 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Slug</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Sort Order</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {categories.map((category) => (
                                <tr key={category.id} className="border-b border-white/10 transition-colors hover:bg-white/5 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle font-medium">{category.name}</td>
                                    <td className="p-4 align-middle">{category.slug}</td>
                                    <td className="p-4 align-middle">{category.sort_order}</td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/admin/categories/${category.id}`}>
                                                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-white/10 hover:text-accent-foreground h-9 w-9">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            </Link>
                                            <form action={async () => {
                                                'use server'
                                                await deleteCategory(category.id)
                                            }}>
                                                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-white/10 hover:text-accent-foreground h-9 w-9 text-red-500 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="h-24 text-center">
                                        No categories found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
