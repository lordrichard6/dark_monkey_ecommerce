'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCart } from './CartProvider'
import { updateCartItem, removeFromCart } from '@/actions/cart'
import { useRouter } from 'next/navigation'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function CartDrawer() {
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')
  const { cart, isOpen, closeCart } = useCart()
  const router = useRouter()
  const totalCents = cart.items.reduce((s, i) => s + i.priceCents * i.quantity, 0)
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  async function handleUpdate(
    variantId: string,
    quantity: number,
    config?: Record<string, unknown>
  ) {
    await updateCartItem(variantId, quantity, config)
    router.refresh()
  }

  async function handleRemove(variantId: string, config?: Record<string, unknown>) {
    await removeFromCart(variantId, config)
    router.refresh()
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={closeCart} aria-hidden="true" />
      )}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md transform border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
              <Image
                src="/logo.webp"
                alt=""
                width={32}
                height={32}
                className="rounded-full"
                unoptimized
              />
              {tCommon('cart')} ({itemCount} {itemCount === 1 ? t('item') : t('items')})
            </h2>
            <button
              onClick={closeCart}
              className="rounded p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              aria-label={t('closeCart')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.items.length === 0 ? (
              <p className="py-12 text-center text-zinc-500">{t('yourCartEmpty')}</p>
            ) : (
              <ul className="space-y-4">
                {cart.items.map((item, idx) => (
                  <li
                    key={`${item.variantId}-${idx}-${JSON.stringify(item.config ?? {})}`}
                    className="flex gap-4 border-b border-zinc-800 pb-4"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-zinc-800 bg-zinc-900">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="80px"
                          unoptimized={
                            item.imageUrl?.endsWith('.svg') ||
                            item.imageUrl?.includes('picsum.photos')
                          }
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.productSlug}`}
                        onClick={closeCart}
                        className="font-medium text-zinc-50 hover:underline"
                      >
                        {item.productName}
                      </Link>
                      {item.variantName && (
                        <p className="text-sm text-zinc-500">{item.variantName}</p>
                      )}
                      {item.config && Object.keys(item.config).length > 0 && (
                        <p className="text-xs text-amber-400/90">
                          Custom:{' '}
                          {Object.entries(item.config)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdate(item.variantId, parseInt(e.target.value, 10), item.config)
                          }
                          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemove(item.variantId, item.config)}
                          className="text-sm text-zinc-500 underline hover:text-red-400"
                        >
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-zinc-50">
                        {formatPrice(item.priceCents * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="border-t border-zinc-800 p-4">
              <div className="flex justify-between text-lg font-semibold text-zinc-50">
                <span>{t('total')}</span>
                <span>{formatPrice(totalCents)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-4 block rounded-lg bg-white py-3 text-center text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                {tCommon('checkout')}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
