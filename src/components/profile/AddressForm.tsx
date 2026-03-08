'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { addAddress, updateAddress } from '@/actions/addresses'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Countries list — ISO 3166-1 alpha-2, sorted by label
const COUNTRIES = [
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
]

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  label: z.string().optional(),
  full_name: z.string().min(1, 'Full name is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  is_default: z.boolean(),
})

type AddressFormData = z.infer<typeof addressSchema>

type Props = {
  addressId?: string
  initialData?: Partial<AddressFormData>
  onSuccess?: () => void
}

const inputClass =
  'mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500'
const labelClass = 'block text-sm font-medium text-zinc-400'
const errorClass = 'mt-1 text-xs text-red-400'

export function AddressForm({ addressId, initialData, onSuccess }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'shipping',
      country: 'PT',
      is_default: false,
      ...initialData,
    },
  })

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true)
    try {
      const result = addressId ? await updateAddress(addressId, data) : await addAddress(data)

      if (!result.ok) throw new Error(result.error)

      toast.success(addressId ? 'Address updated' : 'Address added')

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/account/addresses')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Type Selection */}
      <div>
        <p className={labelClass}>Address Type</p>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              {...register('type')}
              type="radio"
              value="shipping"
              className="h-4 w-4 border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-zinc-300">Shipping</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              {...register('type')}
              type="radio"
              value="billing"
              className="h-4 w-4 border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-zinc-300">Billing</span>
          </label>
        </div>
      </div>

      {/* Label / Nickname */}
      <div>
        <label className={labelClass}>
          Label <span className="text-zinc-600">(optional — e.g. Home, Work, Parents)</span>
        </label>
        <input {...register('label')} placeholder="Home" className={inputClass} />
      </div>

      {/* Full Name */}
      <div>
        <label className={labelClass}>Full Name</label>
        <input {...register('full_name')} className={inputClass} />
        {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
      </div>

      {/* Street Address */}
      <div>
        <label className={labelClass}>Address Line 1</label>
        <input {...register('line1')} className={inputClass} />
        {errors.line1 && <p className={errorClass}>{errors.line1.message}</p>}
      </div>

      <div>
        <label className={labelClass}>
          Address Line 2 <span className="text-zinc-600">(optional)</span>
        </label>
        <input {...register('line2')} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>City</label>
          <input {...register('city')} className={inputClass} />
          {errors.city && <p className={errorClass}>{errors.city.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Postal Code</label>
          <input {...register('postal_code')} className={inputClass} />
          {errors.postal_code && <p className={errorClass}>{errors.postal_code.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Country */}
        <div>
          <label className={labelClass}>Country</label>
          <select {...register('country')} className={inputClass}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {errors.country && <p className={errorClass}>{errors.country.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className={labelClass}>
            Phone <span className="text-zinc-600">(optional)</span>
          </label>
          <input {...register('phone')} type="tel" className={inputClass} />
        </div>
      </div>

      {/* Default Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          {...register('is_default')}
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
        />
        <span className="text-sm text-zinc-300">Set as default for this type</span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-black transition hover:bg-amber-400 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Address'
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/account/addresses')}
          className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
