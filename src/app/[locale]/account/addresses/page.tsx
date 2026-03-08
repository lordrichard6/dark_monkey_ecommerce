import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AddressCard } from '@/components/account/AddressCard'

export default async function AddressesPage() {
  const t = await getTranslations('account')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch addresses + order counts in parallel
  const [{ data: addresses }, { data: orderRows }] = await Promise.all([
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('shipping_address_id')
      .eq('user_id', user.id)
      .not('shipping_address_id', 'is', null),
  ])

  // Build a map: address_id → order count
  const orderCountByAddress = (orderRows ?? []).reduce<Record<string, number>>((acc, row) => {
    if (row.shipping_address_id) {
      acc[row.shipping_address_id] = (acc[row.shipping_address_id] ?? 0) + 1
    }
    return acc
  }, {})

  const addressCount = addresses?.length ?? 0

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/account"
              className="mb-2 inline-block text-sm text-zinc-400 hover:text-zinc-300"
            >
              {t('backToAccount')}
            </Link>
            <h1 className="text-3xl font-bold text-zinc-50">
              {t('addresses')}
              {addressCount > 0 && (
                <span className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-400">
                  {addressCount}
                </span>
              )}
            </h1>
          </div>
          <Link
            href="/account/addresses/new"
            className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            {t('addNewAddress')}
          </Link>
        </div>

        {/* Address Grid */}
        {addressCount > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {addresses!.map((address) => (
              <AddressCard
                key={address.id}
                address={{
                  ...address,
                  order_count: orderCountByAddress[address.id] ?? 0,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-800 p-16 text-center">
            <p className="text-zinc-500">No addresses saved yet.</p>
            <p className="mt-1 text-sm text-zinc-600">Add one to speed up checkout.</p>
            <Link
              href="/account/addresses/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              Add first address
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
