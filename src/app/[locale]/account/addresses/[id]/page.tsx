import { AddressForm } from '@/components/profile/AddressForm'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditAddressPage({ params }: Props) {
    const { id } = await params
    const t = await getTranslations('account')
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: address } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!address) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-black py-12">
            <div className="mx-auto max-w-2xl px-4">
                <Link
                    href="/account/addresses"
                    className="mb-8 inline-block text-sm text-zinc-400 hover:text-zinc-300"
                >
                    ← {t('backToAddresses')}
                </Link>
                <h1 className="mb-8 text-3xl font-bold text-zinc-50">{t('editAddress')}</h1>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                    <AddressForm addressId={id} initialData={address} />
                </div>
            </div>
        </div>
    )
}
