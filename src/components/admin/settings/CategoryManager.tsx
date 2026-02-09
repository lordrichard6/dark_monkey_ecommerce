'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Save, X, FolderTree } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Category {
    id: string
    name: string
    slug: string
    parent_id: string | null
    sort_order: number
}

interface CategoryManagerProps {
    initialCategories: Category[]
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [isAdding, setIsAdding] = useState(false)
    const [newName, setNewName] = useState('')
    const [newSlug, setNewSlug] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const supabase = createClient()

    async function handleAdd() {
        if (!newName || !newSlug) return
        setIsLoading(true)

        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([{
                    name: newName,
                    slug: newSlug,
                    sort_order: categories.length
                }])
                .select()
                .single()

            if (error) throw error

            setCategories([...categories, data])
            setNewName('')
            setNewSlug('')
            setIsAdding(false)
            toast.success('Category added')
        } catch (err: any) {
            toast.error(err.message || 'Failed to add category')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure? Products in this category may become uncategorized.')) return
        setIsLoading(true)

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id)

            if (error) throw error

            setCategories(categories.filter(c => c.id !== id))
            toast.success('Category deleted')
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete category')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80">
                <p className="text-sm text-zinc-400">{categories.length} categories defined</p>
                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Category
                    </button>
                ) : (
                    <button
                        onClick={() => setIsAdding(false)}
                        className="text-sm text-zinc-400 hover:text-zinc-300"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <div className="divide-y divide-zinc-800">
                {isAdding && (
                    <div className="p-4 bg-amber-500/5 border-b border-amber-500/20">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => {
                                        setNewName(e.target.value)
                                        if (!newSlug) setNewSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''))
                                    }}
                                    placeholder="e.g. T-Shirts"
                                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Slug</label>
                                <input
                                    type="text"
                                    value={newSlug}
                                    onChange={(e) => setNewSlug(e.target.value)}
                                    placeholder="e.g. t-shirts"
                                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                disabled={isLoading || !newName || !newSlug}
                                onClick={handleAdd}
                                className="inline-flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {isLoading ? 'Saving...' : 'Save Category'}
                            </button>
                        </div>
                    </div>
                )}

                {categories.map((category) => (
                    <div key={category.id} className="group flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                <GripVertical className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-100">{category.name}</p>
                                <p className="text-xs text-zinc-500">{category.slug}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(category.id)}
                            disabled={isLoading}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {categories.length === 0 && !isAdding && (
                    <div className="p-12 text-center">
                        <FolderTree className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500">No categories found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
