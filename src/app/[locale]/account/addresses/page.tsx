import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { Plus, MapPin, Trash2, Edit } from 'lucide-react'
import { deleteAddress, setDefaultAddress } from '@/actions/addresses'
import { redirect } from 'next/navigation'

export default async function AddressesPage() {
    const t = await getTranslations('account')
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-black py-12">
            <div className="mx-auto max-w-4xl px-4">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link
                            href="/account"
                            className="mb-2 inline-block text-sm text-zinc-400 hover:text-zinc-300"
                        >
                            ← {t('backToAccount')}
                        </Link>
                        <h1 className="text-3xl font-bold text-zinc-50">{t('addresses')}</h1>
                    </div>
                    <Link
                        href="/account/addresses/new"
                        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
                    >
                        <Plus className="h-4 w-4" />
                        {t('addNewAddress')}
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {addresses?.map((address) => (
                        <div
                            key={address.id}
                            className="relative flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700"
                        >
                            <div>
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-zinc-500" />
                                        <span className="font-semibold text-zinc-100">{address.type === 'shipping' ? 'Shipping' : 'Billing'}</span>
                                    </div>
                                    {address.is_default && (
                                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
                                            Default
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1 text-sm text-zinc-400">
                                    <p className="font-medium text-zinc-200">{address.full_name}</p>
                                    <p>{address.line1}</p>
                                    {address.line2 && <p>{address.line2}</p>}
                                    <p>
                                        {address.postal_code} {address.city}
                                    </p>
                                    <p>{address.country}</p>
                                    {address.phone && <p className="mt-2 text-xs">{address.phone}</p>}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-4 border-t border-zinc-800 pt-4">
                                <Link
                                    href={`/account/addresses/${address.id}`}
                                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Link>

                                <form action={async () => {
                                    'use server'
                                    await deleteAddress(address.id)
                                }}>
                                    <button className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-400">
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                </form>

                                {!address.is_default && (
                                    <form action={async () => {
                                        'use server'
                                        await setDefaultAddress(address.id, address.type)
                                    }} className="ml-auto">
                                        <button className="text-xs text-zinc-500 hover:text-white hover:underline">
                                            Set as Default
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    ))}

                    {(!addresses || addresses.length === 0) && (
                        <div className="col-span-full rounded-lg border border-dashed border-zinc-800 p-12 text-center">
                            <p className="text-zinc-500">No addresses found. Add one to speed up checkout.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
