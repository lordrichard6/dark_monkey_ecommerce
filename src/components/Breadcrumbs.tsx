'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { useTranslations } from 'next-intl'

type BreadcrumbItem = {
    label: string
    href: string
    active?: boolean
}

type Props = {
    items?: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: Props) {
    const t = useTranslations('common')
    const pathname = usePathname()

    // Auto-generate items if not provided
    const generateItems = () => {
        const paths = pathname.split('/').filter(Boolean)
        // Remove locale if present (first segment)
        const filteredPaths = paths.length > 0 && ['en', 'pt', 'de', 'fr', 'it'].includes(paths[0])
            ? paths.slice(1)
            : paths

        const breadcrumbs: BreadcrumbItem[] = [
            { label: t('shop'), href: '/' }
        ]

        let currentPath = ''
        filteredPaths.forEach((path, index) => {
            currentPath += `/${path}`
            const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ')
            breadcrumbs.push({
                label,
                href: currentPath,
                active: index === filteredPaths.length - 1
            })
        })

        return breadcrumbs
    }

    const breadcrumbItems = items || generateItems()

    if (breadcrumbItems.length <= 1) return null

    // JSON-LD for Search Engines
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            item: `${process.env.NEXT_PUBLIC_SITE_URL || ''}${item.href === '/' ? '' : item.href}`
        }))
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 overflow-x-auto py-2 text-xs font-medium text-zinc-500 scrollbar-hide">
                {breadcrumbItems.map((item, index) => (
                    <div key={item.href} className="flex items-center gap-2 shrink-0">
                        {index > 0 && <ChevronRight className="h-3 w-3 text-zinc-700" />}
                        {item.active ? (
                            <span className="text-zinc-300 font-bold">{item.label}</span>
                        ) : (
                            <Link
                                href={item.href as '/'}
                                className="hover:text-zinc-100 transition-colors whitespace-nowrap"
                            >
                                {index === 0 ? (
                                    <Home className="h-3.5 w-3.5" />
                                ) : (
                                    item.label
                                )}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>
        </>
    )
}
