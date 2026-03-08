 
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductMain } from '../product-main'
import type { Variant } from '../add-to-cart-form'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === 'onlyLeft' && params) return `Only ${params.count} left`
    return key
  },
}))

vi.mock('@/components/currency/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'CHF',
    format: (cents: number) => `CHF ${(cents / 100).toFixed(2)}`,
    setCurrency: vi.fn(),
  }),
}))

vi.mock('@/actions/cart', () => ({
  addToCart: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/analytics', () => ({
  trackProductView: vi.fn(),
  trackAddToCart: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Stub heavy child components to keep tests fast and focused
vi.mock('@/components/product/ProductImageGallery', () => ({
  ProductImageGallery: ({ productName }: { productName: string }) => (
    <div data-testid="image-gallery">{productName}</div>
  ),
}))

vi.mock('@/components/reviews/ProductReviews', () => ({
  ProductReviews: () => <div data-testid="product-reviews" />,
}))

vi.mock('@/components/product/ProductStory', () => ({
  ProductStory: () => <div data-testid="product-story" />,
}))

vi.mock('@/components/product/LivePurchaseIndicator', () => ({
  LivePurchaseIndicator: () => <div data-testid="live-purchase-indicator" />,
}))

vi.mock('@/components/product/RecentPurchaseToast', () => ({
  RecentPurchaseToast: () => <div data-testid="recent-purchase-toast" />,
}))

vi.mock('@/components/product/StickyAddToCart', () => ({
  StickyAddToCart: () => <div data-testid="sticky-add-to-cart" />,
}))

vi.mock('@/components/product/TrustBadges', () => ({
  TrustBadges: () => <div data-testid="trust-badges" />,
}))

vi.mock('@/components/product/ProductRatingSummary', () => ({
  ProductRatingSummary: () => <div data-testid="rating-summary" />,
}))

vi.mock('@/components/wishlist/WishlistButton', () => ({
  WishlistButton: () => <div data-testid="wishlist-button" />,
}))

vi.mock('@/components/product/ShareButton', () => ({
  ShareButton: () => <div data-testid="share-button" />,
}))

vi.mock('@/components/product/StockNotificationButton', () => ({
  StockNotificationButton: () => <div data-testid="stock-notification-button" />,
}))

vi.mock('@/components/customization/CustomizationPanel', () => ({
  CustomizationPanel: () => <div data-testid="customization-panel" />,
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseProduct = {
  id: 'prod-1',
  name: 'Dark Monkey Hoodie',
  slug: 'dark-monkey-hoodie',
  description: '<p>A great hoodie</p>',
  categories: { name: 'Hoodies' },
  images: [
    {
      url: 'https://cdn.printful.com/img.jpg',
      alt: null,
      sort_order: 0,
      color: 'Black',
      variant_id: null,
    },
  ],
}

const baseVariant: Variant = {
  id: 'var-1',
  name: 'M / Black',
  price_cents: 4900,
  attributes: { color: 'Black', size: 'M' },
  stock: 10,
}

const baseProps = {
  product: baseProduct,
  images: baseProduct.images,
  variants: [baseVariant],
  reviews: [],
  userReview: null,
  isBestseller: false,
  isInWishlist: false,
  canSubmitReview: false,
  userId: undefined,
  storyContent: null,
  customizationRule: null,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProductMain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product name', () => {
    render(<ProductMain {...baseProps} />)
    const names = screen.getAllByText('Dark Monkey Hoodie')
    expect(names.length).toBeGreaterThan(0)
  })

  it('renders price formatted in currency', () => {
    render(<ProductMain {...baseProps} />)
    // CHF 49.00 — rendered by format(priceCents)
    expect(screen.getAllByText('CHF 49.00').length).toBeGreaterThan(0)
  })

  it('renders "inStock" text when variant has stock', () => {
    render(<ProductMain {...baseProps} />)
    // The stock > 5 branch shows t('inStock') which returns the key 'inStock'
    expect(screen.getAllByText('inStock').length).toBeGreaterThan(0)
  })

  it('renders "Only N left" when stock is low (≤5)', () => {
    const props = {
      ...baseProps,
      variants: [{ ...baseVariant, stock: 3 }],
    }
    render(<ProductMain {...props} />)
    expect(screen.getAllByText('Only 3 left').length).toBeGreaterThan(0)
  })

  it('renders "outOfStock" text when all variants are out of stock', () => {
    const props = {
      ...baseProps,
      variants: [{ ...baseVariant, stock: 0 }],
    }
    render(<ProductMain {...props} />)
    expect(screen.getAllByText('outOfStock').length).toBeGreaterThan(0)
  })

  it('renders without crashing when variants array is empty', () => {
    const props = { ...baseProps, variants: [] }
    expect(() => render(<ProductMain {...props} />)).not.toThrow()
  })

  it('renders without crashing when images array is empty', () => {
    const props = {
      ...baseProps,
      product: { ...baseProduct, images: [] },
      images: [],
    }
    expect(() => render(<ProductMain {...props} />)).not.toThrow()
  })

  it('renders without crashing when description is null', () => {
    const props = {
      ...baseProps,
      product: { ...baseProduct, description: null },
    }
    expect(() => render(<ProductMain {...props} />)).not.toThrow()
  })

  it('renders without crashing when categories is null', () => {
    const props = {
      ...baseProps,
      product: { ...baseProduct, categories: null },
    }
    expect(() => render(<ProductMain {...props} />)).not.toThrow()
  })

  it('renders color swatches when product has multiple colors', () => {
    const props = {
      ...baseProps,
      variants: [
        { ...baseVariant, id: 'var-1', attributes: { color: 'Black', size: 'M' } },
        { ...baseVariant, id: 'var-2', attributes: { color: 'White', size: 'M' }, stock: 5 },
      ],
    }
    render(<ProductMain {...props} />)
    // Color buttons are rendered — check for aria-pressed attributes
    const colorButtons = document.querySelectorAll('[aria-pressed]')
    expect(colorButtons.length).toBeGreaterThan(1)
  })

  it('does not render mobile color swatch section when only one color', () => {
    render(<ProductMain {...baseProps} />)
    // ProductMain mobile section uses colorItems.length > 1 guard:
    // when there's only 1 color, the ".flex.flex-col.gap-1.mt-1" swatch container is absent
    const mobileColorSection = document.querySelector('.flex.flex-col.gap-1.mt-1')
    expect(mobileColorSection).toBeNull()
  })

  it('renders stock notification button when out of stock', () => {
    const props = {
      ...baseProps,
      variants: [{ ...baseVariant, stock: 0 }],
    }
    render(<ProductMain {...props} />)
    // Both mobile section and AddToCartForm (desktop) may render StockNotificationButton
    const buttons = screen.getAllByTestId('stock-notification-button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders product description HTML', () => {
    const props = {
      ...baseProps,
      product: { ...baseProduct, description: '<p>Custom description text</p>' },
    }
    render(<ProductMain {...props} />)
    // The description is rendered with dangerouslySetInnerHTML
    expect(document.body.innerHTML).toContain('Custom description text')
  })

  it('renders image gallery with product name', () => {
    render(<ProductMain {...baseProps} />)
    // The mocked gallery renders the product name
    const galleries = screen.getAllByTestId('image-gallery')
    expect(galleries.length).toBeGreaterThan(0)
    expect(galleries[0].textContent).toBe('Dark Monkey Hoodie')
  })

  it('renders trust badges', () => {
    render(<ProductMain {...baseProps} />)
    expect(screen.getByTestId('trust-badges')).toBeDefined()
  })

  it('renders reviews section', () => {
    render(<ProductMain {...baseProps} />)
    expect(screen.getByTestId('product-reviews')).toBeDefined()
  })

  it('renders category name when available', () => {
    render(<ProductMain {...baseProps} />)
    const categories = screen.getAllByText('Hoodies')
    expect(categories.length).toBeGreaterThan(0)
  })
})
