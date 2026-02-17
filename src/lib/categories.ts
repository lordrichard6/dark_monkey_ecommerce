export type Category = {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  parentId?: string | null
  sortOrder: number
  subcategories?: Category[]
}

export const CATEGORIES: Category[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: "Men's clothing",
    slug: 'mens-clothing',
    imageUrl: '/images/hero_bg.webp', // Temporary placeholder
    sortOrder: 1,
    subcategories: [
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'T-shirts',
        slug: 'mens-t-shirts',
        sortOrder: 1,
        parentId: '550e8400-e29b-41d4-a716-446655440001',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'Hoodies',
        slug: 'mens-hoodies',
        sortOrder: 2,
        parentId: '550e8400-e29b-41d4-a716-446655440001',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: 'Pants',
        slug: 'mens-pants',
        sortOrder: 3,
        parentId: '550e8400-e29b-41d4-a716-446655440001',
      },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: "Women's clothing",
    slug: 'womens-clothing',
    imageUrl: '/images/hero_bg.webp', // Temporary placeholder
    sortOrder: 2,
    subcategories: [
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        name: 'T-shirts',
        slug: 'womens-t-shirts',
        sortOrder: 1,
        parentId: '550e8400-e29b-41d4-a716-446655440002',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440022',
        name: 'Hoodies',
        slug: 'womens-hoodies',
        sortOrder: 2,
        parentId: '550e8400-e29b-41d4-a716-446655440002',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440023',
        name: 'Dresses',
        slug: 'womens-dresses',
        sortOrder: 3,
        parentId: '550e8400-e29b-41d4-a716-446655440002',
      },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: "Kids' & youth clothing",
    slug: 'kids-youth-clothing',
    imageUrl: '/images/hero_bg.webp', // Temporary placeholder
    sortOrder: 3,
    subcategories: [
      {
        id: '550e8400-e29b-41d4-a716-446655440031',
        name: 'T-shirts',
        slug: 'kids-t-shirts',
        sortOrder: 1,
        parentId: '550e8400-e29b-41d4-a716-446655440003',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440032',
        name: 'Hoodies',
        slug: 'kids-hoodies',
        sortOrder: 2,
        parentId: '550e8400-e29b-41d4-a716-446655440003',
      },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Hats',
    slug: 'hats',
    imageUrl: '/images/hero_bg.webp', // Temporary placeholder
    sortOrder: 4,
    subcategories: [
      {
        id: '550e8400-e29b-41d4-a716-446655440041',
        name: 'Caps',
        slug: 'caps',
        sortOrder: 1,
        parentId: '550e8400-e29b-41d4-a716-446655440004',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440042',
        name: 'Beanies',
        slug: 'beanies',
        sortOrder: 2,
        parentId: '550e8400-e29b-41d4-a716-446655440004',
      },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Accessories',
    slug: 'accessories',
    imageUrl: '/images/hero_bg.webp', // Temporary placeholder
    sortOrder: 5,
    subcategories: [
      {
        id: '550e8400-e29b-41d4-a716-446655440051',
        name: 'Bags',
        slug: 'bags',
        sortOrder: 1,
        parentId: '550e8400-e29b-41d4-a716-446655440005',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440052',
        name: 'Phone Cases',
        slug: 'phone-cases',
        sortOrder: 2,
        parentId: '550e8400-e29b-41d4-a716-446655440005',
      },
    ],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Home & living',
    slug: 'home-living',
    imageUrl: '/images/hero_bg.webp', // Temporary placeholder
    sortOrder: 6,
    subcategories: [
      {
        id: '550e8400-e29b-41d4-a716-446655440061',
        name: 'Mugs',
        slug: 'mugs',
        sortOrder: 1,
        parentId: '550e8400-e29b-41d4-a716-446655440006',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440062',
        name: 'Posters',
        slug: 'posters',
        sortOrder: 2,
        parentId: '550e8400-e29b-41d4-a716-446655440006',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440063',
        name: 'Pillows',
        slug: 'pillows',
        sortOrder: 3,
        parentId: '550e8400-e29b-41d4-a716-446655440006',
      },
    ],
  },
]

export const ALL_CATEGORIES = CATEGORIES.flatMap((cat) => [cat, ...(cat.subcategories || [])])

export function getCategoryBySlug(slug: string) {
  return ALL_CATEGORIES.find((c) => c.slug === slug)
}

export function getCategoryById(id: string) {
  return ALL_CATEGORIES.find((c) => c.id === id)
}
