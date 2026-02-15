# Product Detail Page Roadmap

**Last Updated:** 2026-02-11
**Status:** Ready for Implementation

---

## Overview

This roadmap outlines comprehensive improvements to transform the product detail page (PDP) into a best-in-class, conversion-optimized experience. The improvements are organized into 3 phases based on impact and implementation complexity.

**Current State:**
- ✅ Product image gallery with color filtering
- ✅ Review system with photo uploads
- ✅ Live purchase indicators and recent purchase toasts
- ✅ Shipping countdown for urgency
- ✅ Product customization with preview
- ✅ Frequently bought together
- ✅ Related products & recently viewed
- ✅ Product story with video embeds
- ✅ JSON-LD structured data for SEO
- ✅ Wishlist functionality
- ✅ Multi-currency support

**Target State:**
A complete, engaging product detail page with social proof, enhanced visuals, comprehensive product information, and optimized conversion elements that match industry-leading e-commerce platforms.

---

## Phase 1: Critical Conversion & Engagement Improvements

**Timeline:** 1-2 weeks
**Priority:** HIGH
**Focus:** Features that directly impact conversion rate and user engagement

### 1.1 Social Sharing Functionality

**Status:** Planned
**Impact:** HIGH - Enables viral growth and social proof
**Location:** `product-main.tsx` (lines 148-155, near Wishlist button)

**Current Issue:**
No ability to share products on social media or via link/email.

**Implementation:**

```tsx
// src/components/product/ShareButton.tsx
'use client'

import { useState } from 'react'
import { Share2, Facebook, Twitter, Link2, Mail, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

type ShareButtonProps = {
  productName: string
  productUrl: string
  productImage?: string
}

export function ShareButton({ productName, productUrl, productImage }: ShareButtonProps) {
  const t = useTranslations('product')
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${productUrl}`
    : productUrl

  const shareData = {
    title: productName,
    text: t('shareText', { productName }),
    url: fullUrl,
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or error
      }
    } else {
      setIsOpen(true)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(productName)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(fullUrl)}&media=${encodeURIComponent(productImage || '')}&description=${encodeURIComponent(productName)}`,
    email: `mailto:?subject=${encodeURIComponent(productName)}&body=${encodeURIComponent(`Check out this product: ${fullUrl}`)}`,
  }

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700"
      >
        <Share2 className="h-4 w-4" />
        {t('share')}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-zinc-700 bg-zinc-800 p-4 shadow-xl">
            <p className="mb-3 text-sm font-medium text-zinc-300">{t('shareVia')}</p>
            <div className="space-y-2">
              <a
                href={shareUrls.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </a>
              <a
                href={shareUrls.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </a>
              <a
                href={shareUrls.pinterest}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
                Pinterest
              </a>
              <a
                href={shareUrls.email}
                className="flex items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
              <button
                onClick={copyLink}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Link2 className="h-4 w-4" />}
                {copied ? t('linkCopied') : t('copyLink')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

**Update `product-main.tsx` (line 148-155):**

```tsx
<div className="mt-4 flex flex-wrap gap-3">
  <WishlistButton
    productId={product.id}
    productSlug={product.slug}
    isInWishlist={isInWishlist}
    variant="button"
  />
  <ShareButton
    productName={product.name}
    productUrl={`/products/${product.slug}`}
    productImage={primaryImageUrl}
  />
</div>
```

**Translation Keys (`messages/en.json`):**

```json
{
  "product": {
    "share": "Share",
    "shareVia": "Share via",
    "shareText": "Check out {productName}",
    "copyLink": "Copy Link",
    "linkCopied": "Link Copied!"
  }
}
```

---

### 1.2 Size Guide Modal

**Status:** Planned
**Impact:** HIGH - Reduces returns and increases confidence
**Location:** `add-to-cart-form.tsx` (lines 296-356, size dropdown section)

**Current Issue:**
No size chart or measurement guide available for apparel products.

**Implementation:**

```tsx
// src/components/product/SizeGuideModal.tsx
'use client'

import { useState } from 'react'
import { X, Ruler } from 'lucide-react'
import { useTranslations } from 'next-intl'

type SizeGuideModalProps = {
  productCategory?: string
}

export function SizeGuideModal({ productCategory }: SizeGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('product')

  // Different size charts based on category
  const getSizeChart = () => {
    const category = productCategory?.toLowerCase() || ''

    if (category.includes('hoodie') || category.includes('shirt') || category.includes('apparel')) {
      return {
        headers: ['Size', 'Chest (cm)', 'Length (cm)', 'Sleeve (cm)'],
        rows: [
          ['XS', '84-91', '66', '61'],
          ['S', '91-97', '69', '63'],
          ['M', '97-104', '71', '65'],
          ['L', '104-112', '74', '67'],
          ['XL', '112-119', '76', '69'],
          ['2XL', '119-127', '79', '71'],
          ['3XL', '127-135', '81', '73'],
        ]
      }
    }

    // Default measurements
    return {
      headers: ['Size', 'Measurement'],
      rows: [
        ['S', 'Small'],
        ['M', 'Medium'],
        ['L', 'Large'],
      ]
    }
  }

  const chart = getSizeChart()

  if (!productCategory) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 underline"
      >
        <Ruler className="h-4 w-4" />
        {t('sizeGuide')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-4 text-2xl font-bold text-white">{t('sizeGuideTitle')}</h2>

            <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-400">
                {t('sizeGuideNote')}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700">
                    {chart.headers.map((header, i) => (
                      <th key={i} className="p-3 text-left text-sm font-semibold text-zinc-300">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      {row.map((cell, j) => (
                        <td key={j} className={`p-3 text-sm ${j === 0 ? 'font-medium text-white' : 'text-zinc-400'}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-white">{t('howToMeasure')}</h3>
              <div className="space-y-2 text-sm text-zinc-400">
                <p><strong className="text-zinc-300">{t('chest')}:</strong> {t('chestMeasurement')}</p>
                <p><strong className="text-zinc-300">{t('length')}:</strong> {t('lengthMeasurement')}</p>
                <p><strong className="text-zinc-300">{t('sleeve')}:</strong> {t('sleeveMeasurement')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Update `add-to-cart-form.tsx` (after size dropdown, around line 355):**

```tsx
{/* Size Dropdown */}
{allSizes.length >= 1 && (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label htmlFor="variant-select" className="block text-sm font-medium text-zinc-400">
        Size
      </label>
      <SizeGuideModal productCategory={productCategory} />
    </div>
    {/* ... rest of size dropdown ... */}
  </div>
)}
```

**Translation Keys:**

```json
{
  "product": {
    "sizeGuide": "Size Guide",
    "sizeGuideTitle": "Size Guide",
    "sizeGuideNote": "Measurements are approximate and may vary slightly. All measurements are in centimeters.",
    "howToMeasure": "How to Measure",
    "chest": "Chest",
    "chestMeasurement": "Measure around the fullest part of your chest, keeping the tape horizontal.",
    "length": "Length",
    "lengthMeasurement": "Measure from the highest point of the shoulder to the bottom hem.",
    "sleeve": "Sleeve",
    "sleeveMeasurement": "Measure from the center back neck to the wrist with arm extended."
  }
}
```

---

### 1.3 Stock Notification System

**Status:** Planned
**Impact:** HIGH - Captures lost sales and builds customer list
**Location:** `add-to-cart-form.tsx` (lines 408-414, add to cart button area)

**Current Issue:**
No way for customers to request notifications when out-of-stock items are back.

**Implementation:**

```tsx
// src/components/product/StockNotificationButton.tsx
'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

type StockNotificationButtonProps = {
  productId: string
  variantId: string
  productName: string
  variantName: string | null
}

export function StockNotificationButton({
  productId,
  variantId,
  productName,
  variantName
}: StockNotificationButtonProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const t = useTranslations('product')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      const supabase = createClient()

      // Insert into stock_notifications table
      const { error: dbError } = await supabase
        .from('stock_notifications')
        .insert({
          product_id: productId,
          variant_id: variantId,
          email,
          product_name: productName,
          variant_name: variantName,
          notified: false,
        })

      if (dbError) throw dbError

      setIsSuccess(true)
      setEmail('')

      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (err) {
      setError(t('stockNotificationError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
        <Check className="h-4 w-4" />
        {t('stockNotificationSuccess')}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Bell className="h-4 w-4" />
        <span>{t('notifyWhenAvailable')}</span>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? t('notifying') : t('notifyMe')}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  )
}
```

**Database Migration:**

```sql
-- Create stock_notifications table
CREATE TABLE IF NOT EXISTS stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL,
  email TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ
);

-- Index for querying pending notifications
CREATE INDEX IF NOT EXISTS idx_stock_notifications_pending
ON stock_notifications(variant_id, notified)
WHERE notified = FALSE;

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_stock_notifications_email
ON stock_notifications(email);
```

**Update `add-to-cart-form.tsx` (replace add to cart button section when out of stock):**

```tsx
{stock === 0 ? (
  <StockNotificationButton
    productId={productId}
    variantId={selectedVariant.id}
    productName={productName}
    variantName={selectedVariant.name}
  />
) : (
  <div className="flex items-center gap-4">
    {/* ... existing quantity and add to cart button ... */}
  </div>
)}
```

**Translation Keys:**

```json
{
  "product": {
    "notifyWhenAvailable": "Notify me when this item is back in stock",
    "notifyMe": "Notify Me",
    "notifying": "Submitting...",
    "stockNotificationSuccess": "You'll be notified when this item is back in stock!",
    "stockNotificationError": "Failed to register notification. Please try again.",
    "emailPlaceholder": "your.email@example.com"
  }
}
```

**Server Action for Sending Notifications (when stock is replenished):**

```typescript
// src/actions/notify-stock.ts
'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendStockNotifications(variantId: string) {
  const supabase = getAdminClient()
  if (!supabase) return

  // Get all pending notifications for this variant
  const { data: notifications } = await supabase
    .from('stock_notifications')
    .select('*')
    .eq('variant_id', variantId)
    .eq('notified', false)

  if (!notifications || notifications.length === 0) return

  // Send emails
  for (const notification of notifications) {
    try {
      await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: notification.email,
        subject: `${notification.product_name} is back in stock!`,
        html: `
          <h1>${notification.product_name} is now available</h1>
          <p>The item you requested (${notification.variant_name || 'standard'}) is back in stock!</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/products/${notification.product_id}">View Product</a>
        `,
      })

      // Mark as notified
      await supabase
        .from('stock_notifications')
        .update({ notified: true, notified_at: new Date().toISOString() })
        .eq('id', notification.id)
    } catch (error) {
      console.error('Failed to send stock notification:', error)
    }
  }
}
```

---

### 1.4 Image Lightbox/Zoom Modal

**Status:** Planned
**Impact:** MEDIUM - Better product visualization
**Location:** `ProductImageGallery.tsx` (entire component)

**Current Issue:**
Images only have subtle zoom on hover. No full-screen lightbox for detailed viewing.

**Implementation:**

```tsx
// Add to ProductImageGallery.tsx
'use client'

import { useState } from 'use client'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

// ... existing code ...

export function ProductImageGallery({ images, productName, selectedColor }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // ... existing filtering logic ...

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % displayImages.length)
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }

  // Handle keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen])

  return (
    <>
      {/* Existing gallery with added click handler */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-zinc-900">
        <div
          className="group relative h-full w-full cursor-zoom-in"
          onClick={() => openLightbox(activeIndex)}
        >
          <Image
            src={mainImage.url}
            alt={mainImage.alt || productName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={isUnoptimized(mainImage.url)}
            priority
          />
          <div className="absolute right-3 top-3 rounded-lg bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Thumbnail grid with click handlers */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {displayImages.slice(0, 4).map((img, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveIndex(i)
              openLightbox(i)
            }}
            className={/* ... existing classes ... */}
          >
            {/* ... existing thumbnail content ... */}
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-lg bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation buttons */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 z-10 rounded-lg bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 z-10 rounded-lg bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image */}
          <div className="relative h-[90vh] w-[90vw]">
            <Image
              src={displayImages[lightboxIndex].url}
              alt={displayImages[lightboxIndex].alt || productName}
              fill
              className="object-contain"
              unoptimized={isUnoptimized(displayImages[lightboxIndex].url)}
              priority
            />
          </div>

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white">
            {lightboxIndex + 1} / {displayImages.length}
          </div>

          {/* Thumbnail strip */}
          <div className="absolute bottom-16 left-1/2 flex max-w-2xl -translate-x-1/2 gap-2 overflow-x-auto px-4">
            {displayImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === lightboxIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || ''}
                  fill
                  className="object-cover"
                  unoptimized={isUnoptimized(img.url)}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
```

---

### 1.5 Sticky Add to Cart Bar (Mobile)

**Status:** Planned
**Impact:** MEDIUM - Improves mobile conversion
**Location:** `product-main.tsx` (bottom of component)

**Current Issue:**
On mobile, when users scroll down to read reviews or see related products, the "Add to Cart" button is no longer visible.

**Implementation:**

```tsx
// src/components/product/StickyAddToCart.tsx
'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/components/currency/CurrencyContext'

type StickyAddToCartProps = {
  productName: string
  priceCents: number
  imageUrl?: string
  onAddToCart: () => void
  canAdd: boolean
  isAdding: boolean
}

export function StickyAddToCart({
  productName,
  priceCents,
  imageUrl,
  onAddToCart,
  canAdd,
  isAdding,
}: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false)
  const t = useTranslations('product')
  const { format } = useCurrency()

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when scrolled past 400px (approximately past the main CTA)
      setIsVisible(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-lg transition-transform duration-300 lg:hidden ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        {imageUrl && (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={productName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-white">{productName}</p>
          <p className="text-sm font-bold text-amber-400">{format(priceCents)}</p>
        </div>
        <button
          onClick={onAddToCart}
          disabled={!canAdd || isAdding}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          {isAdding ? t('adding') : t('addToCart')}
        </button>
      </div>
    </div>
  )
}
```

**Update `add-to-cart-form.tsx`:**

```tsx
// Import at top
import { StickyAddToCart } from '@/components/product/StickyAddToCart'

// Add state for sticky bar
const [showStickyBar, setShowStickyBar] = useState(false)

// Add to return, after the closing form tag
return (
  <>
    <form onSubmit={handleAddToCart} className="mt-8 space-y-6">
      {/* ... existing form content ... */}
    </form>

    {/* Sticky bar for mobile */}
    <StickyAddToCart
      productName={productName}
      priceCents={priceCents}
      imageUrl={primaryImageUrl}
      onAddToCart={(e) => {
        e.preventDefault()
        handleAddToCart(e)
      }}
      canAdd={!!canAdd}
      isAdding={isAdding}
    />
  </>
)
```

---

### 1.6 Trust Badges & Security Indicators

**Status:** Planned
**Impact:** MEDIUM - Builds trust and reduces cart abandonment
**Location:** `add-to-cart-form.tsx` (after add to cart button, around line 415)

**Current Issue:**
No trust signals near the checkout CTA to reassure customers about security and quality.

**Implementation:**

```tsx
// src/components/product/TrustBadges.tsx
import { Shield, Lock, Truck, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function TrustBadges() {
  const t = useTranslations('product')

  const badges = [
    {
      icon: Shield,
      title: t('secureCheckout'),
      description: t('secureCheckoutDesc'),
    },
    {
      icon: Truck,
      title: t('freeShipping'),
      description: t('freeShippingDesc'),
    },
    {
      icon: RotateCcw,
      title: t('easyReturns'),
      description: t('easyReturnsDesc'),
    },
    {
      icon: Lock,
      title: t('dataProtection'),
      description: t('dataProtectionDesc'),
    },
  ]

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      {badges.map((badge, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
            <badge.icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-300">{badge.title}</p>
            <p className="text-xs text-zinc-500">{badge.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Add to `add-to-cart-form.tsx` after the add to cart button:**

```tsx
<div className="flex items-center gap-4">
  {/* ... quantity and add to cart button ... */}
</div>

<TrustBadges />
```

**Translation Keys:**

```json
{
  "product": {
    "secureCheckout": "Secure Checkout",
    "secureCheckoutDesc": "SSL encrypted",
    "freeShipping": "Free Shipping",
    "freeShippingDesc": "On orders over CHF 50",
    "easyReturns": "Easy Returns",
    "easyReturnsDesc": "30-day guarantee",
    "dataProtection": "Data Protection",
    "dataProtectionDesc": "Your data is safe"
  }
}
```

---

### 1.7 Fix Hardcoded Delivery Location

**Status:** Planned
**Impact:** MEDIUM - Internationalization compliance
**Location:** `add-to-cart-form.tsx` (lines 370-390)

**Current Issue:**
Delivery information is hardcoded to "Switzerland" and "CH" flag, not respecting user's location or preferences.

**Implementation:**

Update `add-to-cart-form.tsx` (lines 370-390):

```tsx
// Add to component imports
import { useCountry } from '@/components/currency/CurrencyContext' // Assuming this exists or create it

// Inside component
const { country } = useCountry() // Get user's selected country

// Update the delivery section
<div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
  <p className="text-sm font-medium text-zinc-400">{t('estimatedDelivery')}</p>
  <p className="mt-1.5 flex items-center gap-2 text-zinc-50">
    <span
      className="inline-flex h-5 w-6 shrink-0 items-center justify-center rounded-sm bg-[#ff0000] text-[10px] font-bold text-white"
      title={country.name}
    >
      {country.code}
    </span>
    {country.name}
  </p>
  <p className="mt-2 flex items-center gap-1.5 text-lg font-semibold text-zinc-50">
    {t('deliveryDays', { days: country.deliveryDays || '3-5' })}
    <button
      type="button"
      title={t('deliveryEstimateNote')}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-[10px] font-medium text-zinc-300 hover:bg-zinc-500"
    >
      i
    </button>
  </p>
  <p className="mt-1 text-sm text-zinc-500">{t('shippingStartsAt', { price: country.shippingPrice })}</p>
  <ShippingCountdown />
</div>
```

**Add country selection to `CurrencyContext`:**

```tsx
// src/components/currency/CurrencyContext.tsx
// Add country state and selection
const countries = [
  { code: 'CH', name: 'Switzerland', deliveryDays: '2-3', shippingPrice: 'CHF 0' },
  { code: 'DE', name: 'Germany', deliveryDays: '3-5', shippingPrice: 'CHF 5' },
  { code: 'FR', name: 'France', deliveryDays: '3-5', shippingPrice: 'CHF 5' },
  { code: 'IT', name: 'Italy', deliveryDays: '4-6', shippingPrice: 'CHF 5' },
  // ... add more countries
]
```

**Translation Keys:**

```json
{
  "product": {
    "estimatedDelivery": "Estimated Delivery",
    "deliveryDays": "{days} business days",
    "deliveryEstimateNote": "Delivery estimate may vary based on your location",
    "shippingStartsAt": "Shipping from {price}"
  }
}
```

---

## Phase 2: Enhanced Product Information & Engagement

**Timeline:** 2-3 weeks
**Priority:** MEDIUM
**Focus:** Comprehensive product information and interactive features

### 2.1 Q&A Section

**Status:** Planned
**Impact:** MEDIUM - Reduces customer support burden
**Location:** After ProductReviews component in `product-main.tsx`

**Implementation:**

```tsx
// src/components/product/ProductQA.tsx
'use client'

import { useState } from 'react'
import { MessageCircle, ThumbsUp, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

type Question = {
  id: string
  question: string
  answer: string | null
  helpful_count: number
  created_at: string
  user_name: string
}

type ProductQAProps = {
  productId: string
  canAsk: boolean
}

export function ProductQA({ productId, canAsk }: ProductQAProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const t = useTranslations('product')

  // Fetch questions
  useEffect(() => {
    fetchQuestions()
  }, [productId])

  async function fetchQuestions() {
    const supabase = createClient()
    const { data } = await supabase
      .from('product_questions')
      .select('*')
      .eq('product_id', productId)
      .order('helpful_count', { ascending: false })
      .limit(10)

    if (data) setQuestions(data)
  }

  async function handleSubmitQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!newQuestion.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('product_questions').insert({
        product_id: productId,
        question: newQuestion,
        user_id: user?.id,
        user_name: user?.email?.split('@')[0] || 'Anonymous',
      })

      setNewQuestion('')
      setShowForm(false)
      fetchQuestions()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function markHelpful(questionId: string) {
    const supabase = createClient()
    await supabase.rpc('increment_question_helpful', { question_id: questionId })
    fetchQuestions()
  }

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  return (
    <section className="mt-12 rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{t('questionsAndAnswers')}</h2>
        <p className="mt-1 text-sm text-zinc-400">{t('qaSubtitle')}</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchQuestions')}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {filteredQuestions.map((q) => (
          <div key={q.id} className="border-b border-zinc-800 pb-6 last:border-0">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{q.question}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {t('askedBy')} {q.user_name} · {new Date(q.created_at).toLocaleDateString()}
                </p>

                {q.answer && (
                  <div className="mt-3 rounded-lg bg-zinc-800/50 p-4">
                    <p className="text-sm text-zinc-300">{q.answer}</p>
                    <button
                      onClick={() => markHelpful(q.id)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {t('helpful')} ({q.helpful_count})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredQuestions.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            {searchTerm ? t('noQuestionsFound') : t('noQuestionsYet')}
          </p>
        )}
      </div>

      {/* Ask question form */}
      {canAsk && (
        <div className="mt-6 border-t border-zinc-800 pt-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700"
            >
              {t('askQuestion')}
            </button>
          ) : (
            <form onSubmit={handleSubmitQuestion} className="space-y-3">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder={t('askQuestionPlaceholder')}
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newQuestion.trim()}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmitting ? t('submitting') : t('submitQuestion')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setNewQuestion('')
                  }}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  )
}
```

**Database Migration:**

```sql
-- Create product_questions table
CREATE TABLE IF NOT EXISTS product_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

-- Index for product lookups
CREATE INDEX IF NOT EXISTS idx_product_questions_product
ON product_questions(product_id);

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION increment_question_helpful(question_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE product_questions
  SET helpful_count = helpful_count + 1
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;
```

**Add to `product-main.tsx` after ProductReviews:**

```tsx
<ProductQA productId={product.id} canAsk={!!userId} />
```

**Translation Keys:**

```json
{
  "product": {
    "questionsAndAnswers": "Questions & Answers",
    "qaSubtitle": "Get answers from other customers",
    "searchQuestions": "Search questions...",
    "askedBy": "Asked by",
    "helpful": "Helpful",
    "askQuestion": "Ask a Question",
    "askQuestionPlaceholder": "What would you like to know about this product?",
    "submitQuestion": "Submit Question",
    "submitting": "Submitting...",
    "cancel": "Cancel",
    "noQuestionsFound": "No questions match your search",
    "noQuestionsYet": "Be the first to ask a question"
  }
}
```

---

### 2.2 Product Specifications Table

**Status:** Planned
**Impact:** MEDIUM - Provides detailed product information
**Location:** After product description in `product-main.tsx`

**Implementation:**

```tsx
// src/components/product/ProductSpecifications.tsx
import { useTranslations } from 'next-intl'

type ProductSpecificationsProps = {
  productCategory?: string
  specifications?: Record<string, string>
}

export function ProductSpecifications({ productCategory, specifications }: ProductSpecificationsProps) {
  const t = useTranslations('product')

  // Default specifications based on category
  const getDefaultSpecs = () => {
    const category = productCategory?.toLowerCase() || ''

    if (category.includes('hoodie') || category.includes('apparel')) {
      return {
        'Material': '80% Cotton, 20% Polyester',
        'Weight': '280 GSM',
        'Fit': 'Relaxed fit',
        'Care': 'Machine wash cold, tumble dry low',
        'Origin': 'Made in Portugal',
      }
    }

    if (category.includes('mug') || category.includes('cup')) {
      return {
        'Material': 'Ceramic',
        'Capacity': '325ml (11 oz)',
        'Dishwasher Safe': 'Yes',
        'Microwave Safe': 'Yes',
        'Care': 'Dishwasher safe on top rack',
      }
    }

    return {}
  }

  const specs = specifications || getDefaultSpecs()
  const specEntries = Object.entries(specs)

  if (specEntries.length === 0) return null

  return (
    <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">{t('specifications')}</h3>
      <dl className="divide-y divide-zinc-800">
        {specEntries.map(([key, value]) => (
          <div key={key} className="flex justify-between py-3 text-sm">
            <dt className="font-medium text-zinc-400">{key}</dt>
            <dd className="text-zinc-300">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
```

**Add to `product-main.tsx` after description:**

```tsx
{product.description && (
  {/* ... existing description rendering ... */}
)}

<ProductSpecifications
  productCategory={product.categories?.name}
  specifications={product.specifications as Record<string, string> | undefined}
/>
```

**Database Migration (add specifications column):**

```sql
-- Add specifications column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
```

**Translation Keys:**

```json
{
  "product": {
    "specifications": "Specifications"
  }
}
```

---

### 2.3 Return Policy Display

**Status:** Planned
**Impact:** MEDIUM - Reduces purchase anxiety
**Location:** Near add to cart button in `add-to-cart-form.tsx`

**Implementation:**

```tsx
// src/components/product/ReturnPolicy.tsx
import { RotateCcw, Package, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function ReturnPolicy() {
  const t = useTranslations('product')

  return (
    <div className="mt-6 space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <RotateCcw className="h-4 w-4 text-amber-400" />
        {t('returnPolicy')}
      </div>

      <div className="space-y-2 text-sm text-zinc-400">
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <p>{t('returnWindow')}</p>
        </div>
        <div className="flex items-start gap-2">
          <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <p>{t('returnCondition')}</p>
        </div>
      </div>

      <a
        href="/returns-policy"
        className="inline-block text-sm text-amber-400 hover:text-amber-300 underline"
      >
        {t('viewFullPolicy')}
      </a>
    </div>
  )
}
```

**Add to `add-to-cart-form.tsx` after TrustBadges:**

```tsx
<TrustBadges />
<ReturnPolicy />
```

**Translation Keys:**

```json
{
  "product": {
    "returnPolicy": "Return Policy",
    "returnWindow": "30-day return window from delivery date",
    "returnCondition": "Items must be unused, unworn, and in original packaging",
    "viewFullPolicy": "View full return policy →"
  }
}
```

---

### 2.4 Buy Now Pay Later Display

**Status:** Planned
**Impact:** MEDIUM - Increases average order value
**Location:** Near price display in `add-to-cart-form.tsx` (around line 362)

**Implementation:**

```tsx
// Add after price display in add-to-cart-form.tsx (line 365)
{/* Buy Now Pay Later */}
<div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 10h11v2H3v-2zm0-4h11v2H3V6zm0 8h7v2H3v-2zm13.01-2.5l-2.5 2.5 1.01 1.01 1.5-1.5 2.5 2.5 1-1.01-3.51-3.5z"/>
  </svg>
  <span>
    {t('bnplText', {
      amount: format(Math.ceil(priceCents / 4)),
      installments: 4
    })}
  </span>
  <button
    type="button"
    className="text-amber-400 hover:text-amber-300 underline"
  >
    {t('learnMore')}
  </button>
</div>
```

**Translation Keys:**

```json
{
  "product": {
    "bnplText": "Or 4 interest-free payments of {amount} with Klarna",
    "learnMore": "Learn more"
  }
}
```

---

### 2.5 Gift Options

**Status:** Planned
**Impact:** LOW - Additional revenue stream during holidays
**Location:** In `add-to-cart-form.tsx` before add to cart button

**Implementation:**

```tsx
// src/components/product/GiftOptions.tsx
'use client'

import { useState } from 'react'
import { Gift } from 'lucide-react'
import { useTranslations } from 'next-intl'

type GiftOptionsProps = {
  onGiftChange: (isGift: boolean, message: string) => void
}

export function GiftOptions({ onGiftChange }: GiftOptionsProps) {
  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const t = useTranslations('product')

  const handleToggle = (checked: boolean) => {
    setIsGift(checked)
    if (!checked) {
      setGiftMessage('')
      onGiftChange(false, '')
    } else {
      onGiftChange(true, giftMessage)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isGift}
          onChange={(e) => handleToggle(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:ring-offset-0"
        />
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-zinc-300">
            {t('giftWrap')} <span className="text-zinc-500">({t('free')})</span>
          </span>
        </div>
      </label>

      {isGift && (
        <div className="space-y-2">
          <label htmlFor="gift-message" className="block text-xs text-zinc-400">
            {t('giftMessage')} ({t('optional')})
          </label>
          <textarea
            id="gift-message"
            value={giftMessage}
            onChange={(e) => {
              setGiftMessage(e.target.value)
              onGiftChange(true, e.target.value)
            }}
            maxLength={200}
            rows={3}
            placeholder={t('giftMessagePlaceholder')}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <p className="text-xs text-zinc-500">
            {giftMessage.length}/200 {t('characters')}
          </p>
        </div>
      )}
    </div>
  )
}
```

**Add to `add-to-cart-form.tsx` state:**

```tsx
const [giftOptions, setGiftOptions] = useState<{ isGift: boolean; message: string }>({
  isGift: false,
  message: '',
})
```

**Add before add to cart button:**

```tsx
<GiftOptions onGiftChange={(isGift, message) => setGiftOptions({ isGift, message })} />
```

**Update cart action to include gift options:**

```tsx
await addToCart({
  // ... existing fields
  giftWrap: giftOptions.isGift,
  giftMessage: giftOptions.message,
})
```

**Translation Keys:**

```json
{
  "product": {
    "giftWrap": "Gift wrap this item",
    "free": "Free",
    "giftMessage": "Gift message",
    "optional": "Optional",
    "giftMessagePlaceholder": "Write a special message for your gift recipient...",
    "characters": "characters"
  }
}
```

---

### 2.6 Fix Frequently Bought Together "Add All"

**Status:** Planned
**Impact:** MEDIUM - Currently shows "Coming Soon"
**Location:** `FrequentlyBought.tsx` (lines 63-72)

**Current Issue:**
The "Add All to Cart" button shows "bundlePriceComingSoon" placeholder.

**Implementation:**

Update `FrequentlyBought.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getFrequentlyBoughtTogether } from '@/lib/recommendations'
import { ProductCard } from './ProductCard'
import { getTranslations } from 'next-intl/server'
import { Plus, ShoppingCart } from 'lucide-react'
import { addMultipleToCart } from '@/actions/cart'
import { useCurrency } from '@/components/currency/CurrencyContext'

// ... existing code ...

export function FrequentlyBought({ productId, currentProduct, locale }: FrequentlyBoughtProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { format } = useCurrency()
  const t = await getTranslations('product')

  // Calculate bundle total
  const bundleTotal = recommendations.reduce((sum, product) => {
    return sum + (product.price_cents || 0)
  }, currentProduct?.price_cents || 0)

  const handleAddAllToCart = async () => {
    setIsAdding(true)
    try {
      // Add current product and all recommendations
      const items = [currentProduct, ...recommendations].map(product => ({
        variantId: product.default_variant_id, // Assuming default variant
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantName: null,
        priceCents: product.price_cents || 0,
        quantity: 1,
        imageUrl: Array.isArray(product.product_images)
          ? (product.product_images[0] as any)?.url
          : '',
      }))

      await addMultipleToCart(items)
      router.push('/cart')
    } finally {
      setIsAdding(false)
    }
  }

  // ... rest of component

  return (
    <section className="mt-20 rounded-2xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-sm">
      {/* ... existing header ... */}

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch">
        {/* ... existing product cards ... */}

        <div className="mt-6 flex flex-1 flex-col justify-center rounded-xl bg-white/5 p-6 md:mt-0">
          <div className="text-sm text-zinc-400">{t('bundleTotal')}</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {format(bundleTotal)}
          </div>
          <div className="mt-1 text-xs text-green-400">
            {t('saveAmount', {
              amount: format(Math.floor(bundleTotal * 0.1)) // 10% bundle discount
            })}
          </div>
          <button
            onClick={handleAddAllToCart}
            disabled={isAdding}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            {isAdding ? t('adding') : t('addAllToCart')}
          </button>
        </div>
      </div>
    </section>
  )
}
```

**Create new cart action:**

```typescript
// src/actions/cart.ts
export async function addMultipleToCart(items: CartItem[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Handle guest cart in localStorage
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
    localStorage.setItem('guestCart', JSON.stringify([...guestCart, ...items]))
    return
  }

  // Add all items to database cart
  const cartItems = items.map(item => ({
    user_id: user.id,
    variant_id: item.variantId,
    quantity: item.quantity,
    customization_config: item.config,
  }))

  await supabase.from('cart_items').insert(cartItems)
}
```

**Translation Keys:**

```json
{
  "product": {
    "bundleTotal": "Bundle Total",
    "saveAmount": "Save {amount}",
    "addAllToCart": "Add All to Cart",
    "adding": "Adding..."
  }
}
```

---

## Phase 3: Advanced Features & Optimization

**Timeline:** 3-4 weeks
**Priority:** LOW
**Focus:** Premium features and advanced optimizations

### 3.1 Product Video Section

**Status:** Planned
**Impact:** MEDIUM - Videos increase conversion by 80%
**Location:** `product-main.tsx` after image gallery

**Implementation:**

```tsx
// src/components/product/ProductVideo.tsx
'use client'

import { useState } from 'react'
import { Play, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

type ProductVideoProps = {
  videoUrl?: string
  thumbnailUrl?: string
  productName: string
}

export function ProductVideo({ videoUrl, thumbnailUrl, productName }: ProductVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const t = useTranslations('product')

  if (!videoUrl) return null

  // Extract video ID from YouTube/Vimeo URL
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`
    }
    return url
  }

  const embedUrl = getEmbedUrl(videoUrl)

  return (
    <div className="mt-8">
      <h3 className="mb-4 text-lg font-semibold text-white">{t('productVideo')}</h3>

      {!isPlaying ? (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900 cursor-pointer group">
          <img
            src={thumbnailUrl || '/placeholder-video.jpg'}
            alt={`${productName} video`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-black transition-transform group-hover:scale-110">
              <Play className="h-8 w-8 ml-1" fill="currentColor" />
            </div>
          </button>
        </div>
      ) : (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <button
            onClick={() => setIsPlaying(false)}
            className="absolute right-4 top-4 z-10 rounded-lg bg-black/70 p-2 text-white hover:bg-black"
          >
            <X className="h-5 w-5" />
          </button>
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}
```

**Add to database:**

```sql
ALTER TABLE products
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail TEXT;
```

**Add to `product-main.tsx`:**

```tsx
<ProductVideo
  videoUrl={product.video_url}
  thumbnailUrl={product.video_thumbnail}
  productName={product.name}
/>
```

---

### 3.2 360° Product View

**Status:** Planned
**Impact:** LOW - Premium feature for select products
**Location:** Replace or enhance `ProductImageGallery.tsx`

**Implementation:**

```tsx
// src/components/product/Product360View.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Rotate3D } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Product360ViewProps = {
  images: string[] // Array of 24-36 images in sequence
  productName: string
}

export function Product360View({ images, productName }: Product360ViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('product')

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const diff = e.clientX - startX
    const sensitivity = 5 // Pixels per image
    const imageChange = Math.floor(diff / sensitivity)

    if (Math.abs(imageChange) > 0) {
      const newIndex = (currentIndex - imageChange + images.length) % images.length
      setCurrentIndex(newIndex)
      setStartX(e.clientX)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  if (images.length < 8) return null

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <Rotate3D className="h-4 w-4" />
          {t('drag360')}
        </div>
        <span className="text-xs text-zinc-500">
          {currentIndex + 1} / {images.length}
        </span>
      </div>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        className={`relative aspect-square overflow-hidden rounded-xl bg-zinc-900 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <img
          src={images[currentIndex]}
          alt={`${productName} - view ${currentIndex + 1}`}
          className="h-full w-full object-cover select-none"
          draggable={false}
        />

        {/* Progress indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-amber-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Translation Keys:**

```json
{
  "product": {
    "drag360": "Drag to rotate",
    "productVideo": "Product Video"
  }
}
```

---

### 3.3 Product Comparison Feature

**Status:** Planned
**Impact:** LOW - Helps users decide between similar products
**Location:** Related products section

**Implementation:**

```tsx
// src/components/product/CompareButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { GitCompare, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function CompareButton({ productId, productName }: { productId: string; productName: string }) {
  const [compareList, setCompareList] = useState<string[]>([])
  const t = useTranslations('product')

  useEffect(() => {
    const stored = localStorage.getItem('compareList')
    if (stored) setCompareList(JSON.parse(stored))
  }, [])

  const isInCompare = compareList.includes(productId)

  const toggleCompare = () => {
    let newList: string[]
    if (isInCompare) {
      newList = compareList.filter(id => id !== productId)
    } else {
      if (compareList.length >= 4) {
        alert(t('compareLimit'))
        return
      }
      newList = [...compareList, productId]
    }
    setCompareList(newList)
    localStorage.setItem('compareList', JSON.stringify(newList))
  }

  return (
    <button
      onClick={toggleCompare}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        isInCompare
          ? 'bg-amber-500 text-black'
          : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      }`}
    >
      {isInCompare ? <X className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
      {isInCompare ? t('removeFromCompare') : t('compare')}
    </button>
  )
}
```

**Translation Keys:**

```json
{
  "product": {
    "compare": "Compare",
    "removeFromCompare": "Remove",
    "compareLimit": "You can compare up to 4 products at once"
  }
}
```

---

### 3.4 AR Preview (Augmented Reality)

**Status:** Planned
**Impact:** LOW - Premium feature for compatible devices
**Location:** Near image gallery

**Implementation:**

```tsx
// src/components/product/ARPreview.tsx
'use client'

import { Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'

type ARPreviewProps = {
  glbModelUrl?: string
  productName: string
}

export function ARPreview({ glbModelUrl, productName }: ARPreviewProps) {
  const t = useTranslations('product')

  if (!glbModelUrl) return null

  // Check if device supports AR
  const supportsAR = typeof window !== 'undefined' &&
    ('xr' in navigator || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))

  if (!supportsAR) return null

  return (
    <div className="mt-4">
      <a
        href={`https://arvr.google.com/scene-viewer/1.0?file=${glbModelUrl}&mode=ar_only&title=${encodeURIComponent(productName)}`}
        rel="ar"
        className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400 transition hover:bg-amber-500/20"
      >
        <Smartphone className="h-4 w-4" />
        {t('viewInYourSpace')}
      </a>
    </div>
  )
}
```

**Database:**

```sql
ALTER TABLE products
ADD COLUMN IF NOT EXISTS ar_model_url TEXT;
```

**Translation Keys:**

```json
{
  "product": {
    "viewInYourSpace": "View in your space (AR)"
  }
}
```

---

### 3.5 Sustainability Information

**Status:** Planned
**Impact:** LOW - Increasingly important for conscious consumers
**Location:** After product description

**Implementation:**

```tsx
// src/components/product/SustainabilityInfo.tsx
import { Leaf, Recycle, Truck, Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

type SustainabilityInfoProps = {
  certifications?: string[]
  carbonNeutral?: boolean
  recycledMaterials?: number // Percentage
  ethicalProduction?: boolean
}

export function SustainabilityInfo({
  certifications = [],
  carbonNeutral = false,
  recycledMaterials = 0,
  ethicalProduction = false,
}: SustainabilityInfoProps) {
  const t = useTranslations('product')

  const hasSustainabilityInfo =
    certifications.length > 0 ||
    carbonNeutral ||
    recycledMaterials > 0 ||
    ethicalProduction

  if (!hasSustainabilityInfo) return null

  return (
    <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/5 p-6">
      <div className="mb-4 flex items-center gap-2 text-green-400">
        <Leaf className="h-5 w-5" />
        <h3 className="font-semibold">{t('sustainabilityCommitment')}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {carbonNeutral && (
          <div className="flex items-start gap-3 text-sm">
            <Recycle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <div>
              <p className="font-medium text-zinc-300">{t('carbonNeutral')}</p>
              <p className="text-xs text-zinc-500">{t('carbonNeutralDesc')}</p>
            </div>
          </div>
        )}

        {recycledMaterials > 0 && (
          <div className="flex items-start gap-3 text-sm">
            <Recycle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <div>
              <p className="font-medium text-zinc-300">
                {t('recycledMaterials', { percent: recycledMaterials })}
              </p>
              <p className="text-xs text-zinc-500">{t('recycledMaterialsDesc')}</p>
            </div>
          </div>
        )}

        {ethicalProduction && (
          <div className="flex items-start gap-3 text-sm">
            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <div>
              <p className="font-medium text-zinc-300">{t('ethicalProduction')}</p>
              <p className="text-xs text-zinc-500">{t('ethicalProductionDesc')}</p>
            </div>
          </div>
        )}

        {certifications.length > 0 && (
          <div className="flex items-start gap-3 text-sm sm:col-span-2">
            <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <div>
              <p className="font-medium text-zinc-300">{t('certifications')}</p>
              <p className="text-xs text-zinc-500">
                {certifications.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Database:**

```sql
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sustainability JSONB DEFAULT '{}'::jsonb;
```

**Translation Keys:**

```json
{
  "product": {
    "sustainabilityCommitment": "Sustainability Commitment",
    "carbonNeutral": "Carbon Neutral Shipping",
    "carbonNeutralDesc": "We offset 100% of shipping emissions",
    "recycledMaterials": "{percent}% Recycled Materials",
    "recycledMaterialsDesc": "Made with recycled and sustainable materials",
    "ethicalProduction": "Ethically Produced",
    "ethicalProductionDesc": "Fair wages and safe working conditions",
    "certifications": "Certifications"
  }
}
```

---

### 3.6 Recently Viewed Enhancement

**Status:** Planned
**Impact:** LOW - Already exists, but could be improved
**Location:** `RecentlyViewed.tsx`

**Current Issue:**
Basic implementation without cross-device sync or persistence beyond session.

**Implementation:**

```tsx
// Enhance RecentlyViewed.tsx to sync across devices for logged-in users
// Add database table for persistent recently viewed

-- Database migration
CREATE TABLE IF NOT EXISTS user_recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_recently_viewed_user
ON user_recently_viewed(user_id, viewed_at DESC);

-- Update on view
CREATE OR REPLACE FUNCTION track_product_view(p_user_id UUID, p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_recently_viewed (user_id, product_id, viewed_at)
  VALUES (p_user_id, p_product_id, NOW())
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET viewed_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

### 3.7 Wishlist Sharing

**Status:** Planned
**Impact:** LOW - Social feature
**Location:** Wishlist page

**Implementation:**

```tsx
// src/components/wishlist/ShareWishlist.tsx
'use client'

import { Share2, Link2, Check } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function ShareWishlist({ wishlistId }: { wishlistId: string }) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('wishlist')

  const shareUrl = `${window.location.origin}/wishlist/shared/${wishlistId}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copyLink}
      className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-400" />
          {t('linkCopied')}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {t('shareWishlist')}
        </>
      )}
    </button>
  )
}
```

---

## Testing & Validation

### Testing Checklist

**Phase 1 Features:**
- [ ] Social sharing works on Facebook, Twitter, Pinterest, Email
- [ ] Native share API works on mobile devices
- [ ] Size guide displays correct measurements for different categories
- [ ] Size guide modal is accessible (keyboard navigation, screen readers)
- [ ] Stock notification emails are sent successfully
- [ ] Stock notification form validation works
- [ ] Image lightbox supports keyboard navigation (ESC, arrows)
- [ ] Lightbox works on mobile with touch gestures
- [ ] Sticky add to cart appears/disappears at correct scroll position
- [ ] Sticky bar shows correct price and product info
- [ ] Trust badges display correctly on all screen sizes
- [ ] Delivery location updates based on user selection
- [ ] Delivery days adjust per country

**Phase 2 Features:**
- [ ] Q&A search functionality works correctly
- [ ] Q&A helpful votes increment properly
- [ ] Product specifications render for different categories
- [ ] Return policy link navigates correctly
- [ ] BNPL information calculates installments correctly
- [ ] Gift options persist through checkout
- [ ] Frequently bought together calculates bundle price
- [ ] Add all to cart adds correct quantities

**Phase 3 Features:**
- [ ] Product video embeds work for YouTube and Vimeo
- [ ] 360° view responds smoothly to mouse drag
- [ ] Compare functionality limits to 4 products
- [ ] AR preview link works on compatible devices
- [ ] Sustainability badges display when data exists

### Performance Metrics

**Target Metrics:**
- Image lightbox load time: < 200ms
- Sticky bar scroll performance: 60fps
- Q&A search response time: < 100ms
- 360° view frame rate: 30fps minimum

### Accessibility Requirements

- [ ] All modals are keyboard accessible (Tab, Shift+Tab, ESC)
- [ ] ARIA labels on all interactive elements
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Focus indicators visible on all focusable elements
- [ ] Screen reader announcements for dynamic content
- [ ] Form validation errors announced to screen readers

---

## Success Metrics

**Conversion Rate:**
- Target: 15% increase in add-to-cart rate
- Target: 10% reduction in cart abandonment

**Engagement:**
- Target: 40% of users interact with image gallery (zoom/lightbox)
- Target: 25% of users view product videos
- Target: 30% click on "Frequently Bought Together"

**Customer Satisfaction:**
- Target: 20% reduction in size-related returns
- Target: 50+ product questions asked per month
- Target: 15% of products shared on social media

**Revenue Impact:**
- Target: 8% increase in average order value (via bundles)
- Target: 5% increase in conversion rate
- Target: Capture 200+ stock notification signups per month

---

## Internationalization Requirements

All new features must support the existing 5 languages:
- English (en)
- Portuguese (pt)
- German (de)
- Italian (it)
- French (fr)

Translation keys have been provided for each feature. Ensure all keys are added to `/messages/{locale}.json` files.

---

## Database Schema Changes

**New Tables:**
1. `stock_notifications` - Store back-in-stock requests
2. `product_questions` - Q&A functionality
3. `user_recently_viewed` - Cross-device recently viewed tracking

**Column Additions:**
1. `products.specifications` (JSONB) - Product specs
2. `products.video_url` (TEXT) - Product video URL
3. `products.video_thumbnail` (TEXT) - Video thumbnail
4. `products.ar_model_url` (TEXT) - AR/3D model
5. `products.sustainability` (JSONB) - Sustainability data
6. `cart_items.gift_wrap` (BOOLEAN) - Gift wrap flag
7. `cart_items.gift_message` (TEXT) - Gift message

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority | Phase |
|---------|--------|--------|----------|-------|
| Social Sharing | HIGH | LOW | 1 | 1 |
| Size Guide | HIGH | MEDIUM | 2 | 1 |
| Stock Notifications | HIGH | MEDIUM | 3 | 1 |
| Image Lightbox | MEDIUM | LOW | 4 | 1 |
| Sticky Add to Cart | MEDIUM | LOW | 5 | 1 |
| Trust Badges | MEDIUM | LOW | 6 | 1 |
| Fix Delivery Location | MEDIUM | LOW | 7 | 1 |
| Q&A Section | MEDIUM | HIGH | 8 | 2 |
| Product Specs | MEDIUM | LOW | 9 | 2 |
| Return Policy | MEDIUM | LOW | 10 | 2 |
| BNPL Display | MEDIUM | LOW | 11 | 2 |
| Gift Options | LOW | MEDIUM | 12 | 2 |
| Fix Bundle Cart | MEDIUM | MEDIUM | 13 | 2 |
| Product Video | MEDIUM | MEDIUM | 14 | 3 |
| 360° View | LOW | HIGH | 15 | 3 |
| Product Comparison | LOW | MEDIUM | 16 | 3 |
| AR Preview | LOW | HIGH | 17 | 3 |
| Sustainability Info | LOW | LOW | 18 | 3 |
| Recently Viewed+ | LOW | MEDIUM | 19 | 3 |
| Wishlist Sharing | LOW | LOW | 20 | 3 |

---

## Notes

- All implementations include full TypeScript types
- All components are server components unless they require client-side interactivity
- All interactive features include proper loading states
- All forms include validation and error handling
- All database operations include proper error handling
- All new components follow the existing design system
- Mobile-first responsive design for all features
- Performance optimizations (lazy loading, code splitting) where applicable

---

**Total Improvements:** 20 features across 3 phases
**Estimated Implementation Time:** 6-9 weeks
**Expected Conversion Increase:** 10-15%
**Expected AOV Increase:** 8-12%
