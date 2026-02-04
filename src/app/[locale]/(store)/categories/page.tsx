import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params
  const t = await getTranslations('store')
  return {
    title: t('categoriesTitle'),
    description: t('categoriesMetaDescription'),
  }
}

export default async function CategoriesPage() {
  const supabase = await createClient()
  const t = await getTranslations('store')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-zinc-50 md:text-3xl">
          {t('categoriesTitle')}
        </h1>

        {categories && categories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group block overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm p-6 transition hover:border-white/20"
              >
                <h2 className="text-xl font-semibold text-zinc-50 group-hover:text-white">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="mt-2 text-zinc-400">{category.description}</p>
                )}
                <span className="mt-4 inline-block text-sm font-medium text-zinc-300 group-hover:text-white">
                  {t('shopCategory', { name: category.name })}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 py-24 text-center">
            <p className="text-zinc-500">{t('noCategories')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
