'use client'

import { useState, useRef, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { type Category } from '@/actions/admin-categories'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

type NavCategory = Category & { subcategories: Category[] }

type Props = {
  categories: NavCategory[]
}

export function CategoryMegaMenu({ categories }: Props) {
  const t = useTranslations('common')
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 300)
  }

  return (
    <div
      className="relative h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={`flex h-full items-center gap-1.5 px-4 text-sm font-medium transition-colors hover:text-white ${open ? 'text-white' : 'text-zinc-400'}`}
      >
        {t('shop')}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 w-[800px] -translate-x-12 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-8 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-3 gap-12">
              {categories.slice(0, 6).map((category) => (
                <div key={category.id} className="flex flex-col gap-4">
                  <Link
                    href={`/categories/${category.slug}`}
                    onClick={() => setOpen(false)}
                    className="text-sm font-bold uppercase tracking-wider text-white hover:text-amber-400"
                  >
                    {category.name}
                  </Link>
                  <div className="flex flex-col gap-2">
                    {category.subcategories?.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/categories/${sub.slug}`}
                        onClick={() => setOpen(false)}
                        className="text-xs text-zinc-400 transition-colors hover:text-white"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Featured section in mega menu */}
            <div className="mt-10 border-t border-white/5 pt-8">
              <div className="grid grid-cols-2 gap-8">
                <Link
                  href="/products"
                  className="group relative h-32 overflow-hidden rounded-xl bg-zinc-900 border border-white/5 p-6 transition-all hover:border-amber-500/30"
                >
                  <div className="relative z-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                      {t('featured')}
                    </span>
                    <h4 className="mt-1 text-lg font-bold text-white">{t('seasonDrops')}</h4>
                    <p className="mt-1 text-xs text-zinc-400">Exclusive limited time collections</p>
                  </div>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
                <Link
                  href="/art"
                  className="group relative h-32 overflow-hidden rounded-xl bg-zinc-900 border border-white/5 p-6 transition-all hover:border-purple-500/30"
                >
                  <div className="relative z-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-500">
                      {t('creative')}
                    </span>
                    <h4 className="mt-1 text-lg font-bold text-white">{t('artGallery')}</h4>
                    <p className="mt-1 text-xs text-zinc-400">Digital art and collectibles</p>
                  </div>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
