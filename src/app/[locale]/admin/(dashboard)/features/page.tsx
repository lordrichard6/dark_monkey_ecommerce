import {
  ShoppingBag,
  Package,
  Star,
  Heart,
  Search,
  Tag,
  Globe,
  Palette,
  ImageIcon,
  CreditCard,
  Truck,
  Users,
  Award,
  Gift,
  Share2,
  Zap,
  ShieldCheck,
  Settings,
  BarChart3,
  FileText,
  Mail,
  Clock,
  Sparkles,
} from 'lucide-react'

type Feature = {
  icon: React.ElementType
  title: string
  description: string
  status: 'live' | 'beta' | 'planned'
}

type FeatureCategory = {
  name: string
  icon: React.ElementType
  features: Feature[]
}

const featureCategories: FeatureCategory[] = [
  {
    name: 'E-commerce Core',
    icon: ShoppingBag,
    features: [
      {
        icon: Package,
        title: 'Product Catalog',
        description: 'Multi-variant products with images, attributes, and inventory management',
        status: 'live',
      },
      {
        icon: Search,
        title: 'Advanced Search',
        description: 'Full-text search with filters (price, category, color, size, stock)',
        status: 'live',
      },
      {
        icon: ShoppingBag,
        title: 'Shopping Cart',
        description: 'Persistent cart with guest and authenticated user support',
        status: 'live',
      },
      {
        icon: CreditCard,
        title: 'Stripe Checkout',
        description: 'Secure payments via Stripe with multi-currency support',
        status: 'live',
      },
      {
        icon: Tag,
        title: 'Discount Codes',
        description: 'Percentage and fixed amount discounts with usage limits',
        status: 'live',
      },
      {
        icon: FileText,
        title: 'Order Management',
        description: 'Complete order lifecycle tracking (pending → paid → shipped → delivered)',
        status: 'live',
      },
    ],
  },
  {
    name: 'Personalization',
    icon: Sparkles,
    features: [
      {
        icon: Palette,
        title: 'Product Customization',
        description: 'Custom text embroidery on select premium products',
        status: 'live',
      },
      {
        icon: Settings,
        title: 'Style Preferences',
        description: 'Save preferred sizes and style tags for personalized recommendations',
        status: 'live',
      },
      {
        icon: Gift,
        title: 'Birthday Rewards',
        description: '15% automatic discount and 500 bonus points on user birthdays',
        status: 'live',
      },
      {
        icon: Sparkles,
        title: 'Product Recommendations',
        description: 'Style-based product matching and bestseller highlighting',
        status: 'live',
      },
    ],
  },
  {
    name: 'Gamification & Engagement',
    icon: Award,
    features: [
      {
        icon: Award,
        title: 'Tier System',
        description: 'Spending-based tiers: Bronze, Silver, Gold, Platinum with exclusive perks',
        status: 'live',
      },
      {
        icon: Zap,
        title: 'Points & Rewards',
        description: 'Earn points on purchases, reviews, referrals. Redeem for discounts',
        status: 'live',
      },
      {
        icon: Award,
        title: 'Achievement Badges',
        description: '14 unlockable achievements based on orders, reviews, spending, and tiers',
        status: 'live',
      },
      {
        icon: Users,
        title: 'Referral Program',
        description: 'Unique referral codes with rewards for both referrer and referee',
        status: 'live',
      },
      {
        icon: BarChart3,
        title: 'Profile Stats Dashboard',
        description: 'Track orders, spending, reviews, wishlist size, and member duration',
        status: 'live',
      },
    ],
  },
  {
    name: 'Social Features',
    icon: Share2,
    features: [
      {
        icon: Star,
        title: 'Product Reviews',
        description: 'Star ratings, comments, and photo uploads with verified purchase badges',
        status: 'live',
      },
      {
        icon: Heart,
        title: 'Wishlist',
        description: 'Save favorite products with public/private sharing options',
        status: 'live',
      },
      {
        icon: Share2,
        title: 'Wishlist Sharing',
        description: 'Share wishlist via link or Web Share API with privacy controls',
        status: 'live',
      },
      {
        icon: ImageIcon,
        title: 'User Avatars',
        description: 'Upload custom avatars with Gravatar fallback and generated initials',
        status: 'live',
      },
    ],
  },
  {
    name: 'Internationalization',
    icon: Globe,
    features: [
      {
        icon: Globe,
        title: 'Multi-language',
        description: 'Full support for English, Portuguese, German, Italian, and French',
        status: 'live',
      },
      {
        icon: CreditCard,
        title: 'Multi-currency',
        description: 'CHF, USD, EUR, GBP with live exchange rate conversion',
        status: 'live',
      },
      {
        icon: Globe,
        title: 'Locale-based Routing',
        description: 'URL-based language switching with persistent user preferences',
        status: 'live',
      },
    ],
  },
  {
    name: 'Content & Marketing',
    icon: FileText,
    features: [
      {
        icon: ImageIcon,
        title: 'Art Gallery',
        description: 'Curated gallery with categories (Digital, Photography, Traditional)',
        status: 'live',
      },
      {
        icon: Package,
        title: 'Product Badges',
        description: 'New, Featured, and Sale badges with automatic date-based "New" detection',
        status: 'live',
      },
      {
        icon: Sparkles,
        title: 'Featured Products',
        description: 'Highlight premium items on homepage with manual curation',
        status: 'live',
      },
      {
        icon: Clock,
        title: 'New Arrivals',
        description: 'Automatic "New" badge for products added within last 3 days',
        status: 'live',
      },
      {
        icon: Zap,
        title: 'Bestseller Tracking',
        description: 'Identify top-selling products with dynamic bestseller badges',
        status: 'live',
      },
      {
        icon: Truck,
        title: 'Trust & Urgency Signals',
        description: 'Stock counters, dispatch timers, and delivery estimates',
        status: 'live',
      },
    ],
  },
  {
    name: 'Admin Tools',
    icon: ShieldCheck,
    features: [
      {
        icon: BarChart3,
        title: 'Admin Dashboard',
        description: 'Real-time stats: revenue, orders, products, conversion rates',
        status: 'live',
      },
      {
        icon: Package,
        title: 'Product Management',
        description: 'CRUD operations for products, variants, images, and inventory',
        status: 'live',
      },
      {
        icon: FileText,
        title: 'Order Management',
        description: 'View, filter, and update order statuses with detailed order views',
        status: 'live',
      },
      {
        icon: Tag,
        title: 'Discount Management',
        description: 'Create and manage discount codes with expiration and usage tracking',
        status: 'live',
      },
      {
        icon: ImageIcon,
        title: 'Gallery Management',
        description: 'Upload and organize artwork with category assignments',
        status: 'live',
      },
      {
        icon: Settings,
        title: 'Role-based Access',
        description: 'Admin-only routes with authentication checks and permission gates',
        status: 'live',
      },
    ],
  },
  {
    name: 'Technical Features',
    icon: Zap,
    features: [
      {
        icon: Zap,
        title: 'Server-side Rendering',
        description: 'Next.js 15 with App Router for optimal performance and SEO',
        status: 'live',
      },
      {
        icon: ShieldCheck,
        title: 'Row Level Security',
        description: 'Database-level security policies for user data protection',
        status: 'live',
      },
      {
        icon: Globe,
        title: 'Edge Caching',
        description: 'React cache() for deduplicating database queries within requests',
        status: 'live',
      },
      {
        icon: CreditCard,
        title: 'Stripe Webhooks',
        description: 'Automated order processing via Stripe payment events',
        status: 'live',
      },
      {
        icon: Mail,
        title: 'Transactional Emails',
        description: 'Order confirmations and notifications via email service',
        status: 'live',
      },
      {
        icon: ImageIcon,
        title: 'Supabase Storage',
        description: 'Scalable file storage for product images, avatars, and review photos',
        status: 'live',
      },
      {
        icon: ShieldCheck,
        title: 'Guest Checkout',
        description: 'Allow purchases without account creation with email-only checkout',
        status: 'live',
      },
    ],
  },
  {
    name: 'User Experience',
    icon: Sparkles,
    features: [
      {
        icon: Globe,
        title: 'Mobile-first Design',
        description: 'Fully responsive UI optimized for mobile, tablet, and desktop',
        status: 'live',
      },
      {
        icon: Zap,
        title: 'Dark Mode',
        description: 'Premium dark theme with zinc palette and amber accents',
        status: 'live',
      },
      {
        icon: Search,
        title: 'Instant Search',
        description: 'Real-time search results with keyboard navigation',
        status: 'live',
      },
      {
        icon: Package,
        title: 'Product Quick View',
        description: 'View product details without leaving the current page',
        status: 'live',
      },
      {
        icon: FileText,
        title: 'Legal Pages',
        description: 'Privacy policy, terms of service, shipping policy, refund policy, FAQ',
        status: 'live',
      },
      {
        icon: Mail,
        title: 'Contact Page',
        description: 'Easy-to-find support contact information',
        status: 'live',
      },
    ],
  },
]

function StatusBadge({ status }: { status: 'live' | 'beta' | 'planned' }) {
  const styles = {
    live: 'bg-green-500/10 text-green-400 border-green-500/20',
    beta: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    planned: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }

  const labels = {
    live: 'Live',
    beta: 'Beta',
    planned: 'Planned',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  )
}

export default function FeaturesPage() {
  const liveCount = featureCategories.reduce(
    (acc, cat) => acc + cat.features.filter((f) => f.status === 'live').length,
    0
  )

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
                  <Sparkles className="h-6 w-6 text-zinc-950" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
                    Platform Features
                  </h1>
                  <p className="text-sm text-zinc-400">
                    Complete feature overview
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-2">
                <div className="text-2xl font-bold text-green-400">{liveCount}</div>
                <div className="text-xs text-zinc-400">Live Features</div>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2">
                <div className="text-2xl font-bold text-zinc-300">
                  {featureCategories.length}
                </div>
                <div className="text-xs text-zinc-400">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {featureCategories.map((category) => (
            <div
              key={category.name}
              className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800">
                  <category.icon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-zinc-50">
                    {category.name}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {category.features.length} feature
                    {category.features.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-sm font-medium text-zinc-400">
                  {category.features.filter((f) => f.status === 'live').length}/
                  {category.features.length} live
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {category.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-800/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 transition group-hover:from-amber-500/20 group-hover:to-amber-600/20">
                        <feature.icon className="h-5 w-5 text-zinc-400 group-hover:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-zinc-50">
                            {feature.title}
                          </h3>
                          <StatusBadge status={feature.status} />
                        </div>
                        <p className="text-sm text-zinc-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="mt-12 rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-amber-500/10 px-4 py-2">
              <Sparkles className="mr-2 h-5 w-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">
                Premium E-commerce Platform
              </span>
            </div>
            <h3 className="mb-2 text-2xl font-bold text-zinc-50">
              Built for Excellence
            </h3>
            <p className="text-zinc-400">
              A comprehensive e-commerce platform with gamification, personalization,
              and premium user experience. Designed for growth and customer engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
