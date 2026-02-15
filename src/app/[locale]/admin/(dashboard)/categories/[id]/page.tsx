import { getCategory, getCategories } from '@/actions/admin-categories'
import { CategoryForm } from './category-form'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ id: string }>
}

export default async function AdminCategoryPage({ params }: Props) {
    // Await params before accessing properties
    const { id } = await params
    const isNew = id === 'new'
    let category = null

    if (!isNew) {
        category = await getCategory(id)
        if (!category) {
            notFound()
        }
    }

    const categories = await getCategories()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    {isNew ? 'Create Category' : 'Edit Category'}
                </h1>
            </div>
            <CategoryForm category={category} categories={categories} />
        </div>
    )
}
