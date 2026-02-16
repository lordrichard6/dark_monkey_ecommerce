import { AddressForm } from '@/components/profile/AddressForm'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NewAddressPage() {
    const t = await getTranslations('account')

    return (
        <div className="min-h-screen bg-black py-12">
            <div className="mx-auto max-w-2xl px-4">
                <Link
                    href="/account/addresses"
                    className="mb-8 inline-block text-sm text-zinc-400 hover:text-zinc-300"
                >
                    ← {t('backToAddresses')}
                </Link>
                <h1 className="mb-8 text-3xl font-bold text-zinc-50">{t('addNewAddress')}</h1>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                    <AddressForm />
                </div>
            </div>
        </div>
    )
}
