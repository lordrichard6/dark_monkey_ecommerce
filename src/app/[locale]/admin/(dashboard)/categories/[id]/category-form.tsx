'use client'

import { upsertCategory, type Category, type ActionState } from '@/actions/admin-categories'
import { useRouter } from '@/i18n/navigation';
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import clsx from 'clsx'

interface CategoryFormProps {
    category?: Category | null
}

export function CategoryForm({ category }: CategoryFormProps) {
    const router = useRouter()
    const [state, action, isPending] = useActionState(upsertCategory, { ok: true } as ActionState)

    useEffect(() => {
        if (state.ok && !state.error && !isPending && state !== undefined && (state as any).ok === true) {
            // toast.success('Category saved') // moved to onSubmit wrapper for immediate feedback if optimistic
        } else if (state.error) {
            toast.error(state.error)
        }
    }, [state, isPending])

    const handleSubmit = async (formData: FormData) => {
        const result = await upsertCategory({ ok: true }, formData)
        if (result.ok) {
            toast.success('Category saved')
            router.push('/admin/categories')
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl">
            <div className="p-6">
                <form action={handleSubmit} className="space-y-6">
                    <input type="hidden" name="id" value={category?.id ?? ''} />

                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            defaultValue={category?.name}
                            placeholder="e.g. Hoodies"
                            required
                            className="flex h-10 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="slug" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Slug
                        </label>
                        <input
                            id="slug"
                            name="slug"
                            defaultValue={category?.slug}
                            placeholder="e.g. hoodies"
                            required
                            className="flex h-10 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="sort_order" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Sort Order
                        </label>
                        <input
                            id="sort_order"
                            name="sort_order"
                            type="number"
                            defaultValue={category?.sort_order ?? 0}
                            required
                            className="flex h-10 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            defaultValue={category?.description ?? ''}
                            placeholder="Category description..."
                            rows={4}
                            className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/10 bg-transparent hover:bg-white/10 h-10 px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2"
                        >
                            {isPending ? 'Saving...' : 'Save Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
