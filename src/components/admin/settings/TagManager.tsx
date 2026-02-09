'use client'

import { useState } from 'react'
import { Plus, Trash2, Tag as TagIcon, Save, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Tag {
    id: string
    name: string
    slug: string
}

interface TagManagerProps {
    initialTags: Tag[]
}

export function TagManager({ initialTags }: TagManagerProps) {
    const [tags, setTags] = useState<Tag[]>(initialTags)
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
                .from('tags')
                .insert([{
                    name: newName,
                    slug: newSlug
                }])
                .select()
                .single()

            if (error) throw error

            setTags([...tags, data])
            setNewName('')
            setNewSlug('')
            setIsAdding(false)
            toast.success('Tag added')
        } catch (err: any) {
            toast.error(err.message || 'Failed to add tag')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure? This will remove the tag from all products.')) return
        setIsLoading(true)

        try {
            const { error } = await supabase
                .from('tags')
                .delete()
                .eq('id', id)

            if (error) throw error

            setTags(tags.filter(t => t.id !== id))
            toast.success('Tag deleted')
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete tag')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80">
                <p className="text-sm text-zinc-400">{tags.length} tags defined</p>
                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Tag
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
                    <div className="p-4 bg-emerald-500/5 border-b border-emerald-500/20">
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
                                    placeholder="e.g. New Arrival"
                                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Slug</label>
                                <input
                                    type="text"
                                    value={newSlug}
                                    onChange={(e) => setNewSlug(e.target.value)}
                                    placeholder="e.g. new-arrival"
                                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
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
                                {isLoading ? 'Saving...' : 'Save Tag'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <div
                            key={tag.id}
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-300 group hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                        >
                            <TagIcon className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{tag.name}</span>
                            <button
                                onClick={() => handleDelete(tag.id)}
                                disabled={isLoading}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}

                    {tags.length === 0 && !isAdding && (
                        <div className="py-8 w-full text-center">
                            <TagIcon className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                            <p className="text-zinc-500">No tags found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
