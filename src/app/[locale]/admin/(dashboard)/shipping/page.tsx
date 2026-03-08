import { Truck } from 'lucide-react'
import { getShippingZones, getFreeShippingThreshold } from '@/actions/admin-shipping'
import { ShippingEditor } from './shipping-editor'

export default async function AdminShippingPage() {
  const [zones, threshold] = await Promise.all([getShippingZones(), getFreeShippingThreshold()])

  return (
    <div className="p-8">
      <div className="flex items-center gap-3">
        <Truck className="h-6 w-6 text-zinc-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Shipping Rates</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Set per-zone rates and the free shipping threshold. Changes apply immediately to all new
            checkouts.
          </p>
        </div>
      </div>

      <div className="mt-8 max-w-xl">
        <ShippingEditor zones={zones} threshold={threshold} />
      </div>
    </div>
  )
}
