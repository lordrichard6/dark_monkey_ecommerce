import Link from 'next/link'
import { CreateDiscountForm } from './create-discount-form'

export default function AdminNewDiscountPage() {
  return (
    <div className="p-8">
      <Link href="/admin/discounts" className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-300">
        ← Back to discounts
      </Link>
      <h1 className="text-2xl font-bold text-zinc-50">New discount</h1>
      <CreateDiscountForm />
    </div>
  )
}
