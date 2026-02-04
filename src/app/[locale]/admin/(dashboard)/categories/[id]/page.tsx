import { getCategory } from '@/actions/admin-categories'
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

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">
                {isNew ? 'Create Category' : 'Edit Category'}
            </h1>
            <CategoryForm category={category} />
        </div>
    )
}
