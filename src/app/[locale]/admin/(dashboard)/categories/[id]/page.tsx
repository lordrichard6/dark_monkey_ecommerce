import { getCategory, getCategories } from '@/actions/admin-categories'
import { CategoryForm } from './category-form'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminCategoryPage({ params }: Props) {
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
    <div className="flex-1 space-y-4 p-4 pt-4 sm:p-8 sm:pt-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/categories">
          <button className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isNew ? 'Create Category' : 'Edit Category'}
        </h1>
      </div>

      <CategoryForm category={category} categories={categories} />
    </div>
  )
}
