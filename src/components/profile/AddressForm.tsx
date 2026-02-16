'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { addAddress, updateAddress } from '@/actions/addresses'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const addressSchema = z.object({
    type: z.enum(['shipping', 'billing']),
    full_name: z.string().min(1, 'Full name is required'),
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    postal_code: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().optional(),
    is_default: z.boolean().default(false),
})

type AddressFormData = z.infer<typeof addressSchema>

type Props = {
    addressId?: string
    initialData?: AddressFormData
    onSuccess?: () => void
}

export function AddressForm({ addressId, initialData, onSuccess }: Props) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: initialData || {
            type: 'shipping',
            country: 'PT',
            is_default: false,
        },
    })

    const onSubmit = async (data: AddressFormData) => {
        setIsSubmitting(true)
        try {
            const result = addressId
                ? await updateAddress(addressId, data)
                : await addAddress(data)

            if (!result.ok) {
                throw new Error(result.error)
            }

            toast.success(addressId ? 'Address updated' : 'Address added')
            router.refresh()
            if (onSuccess) onSuccess()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Type Selection */}
            <div className="flex gap-4">
                <label className="flex items-center gap-2">
                    <input
                        {...register('type')}
                        type="radio"
                        value="shipping"
                        className="h-4 w-4 border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-zinc-300">Shipping</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        {...register('type')}
                        type="radio"
                        value="billing"
                        className="h-4 w-4 border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-zinc-300">Billing</span>
                </label>
            </div>

            {/* Full Name */}
            <div>
                <label className="block text-sm font-medium text-zinc-400">Full Name</label>
                <input
                    {...register('full_name')}
                    className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {errors.full_name && (
                    <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>
                )}
            </div>

            {/* Street Address */}
            <div>
                <label className="block text-sm font-medium text-zinc-400">Address Line 1</label>
                <input
                    {...register('line1')}
                    className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {errors.line1 && (
                    <p className="mt-1 text-xs text-red-400">{errors.line1.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-400">Address Line 2 (Optional)</label>
                <input
                    {...register('line2')}
                    className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400">City</label>
                    <input
                        {...register('city')}
                        className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {errors.city && (
                        <p className="mt-1 text-xs text-red-400">{errors.city.message}</p>
                    )}
                </div>

                {/* Postal Code */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Postal Code</label>
                    <input
                        {...register('postal_code')}
                        className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {errors.postal_code && (
                        <p className="mt-1 text-xs text-red-400">{errors.postal_code.message}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Country */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Country</label>
                    <select
                        {...register('country')}
                        className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                        <option value="PT">Portugal</option>
                        <option value="CH">Switzerland</option>
                        <option value="FR">France</option>
                        <option value="ES">Spain</option>
                        <option value="DE">Germany</option>
                        {/* Add more as needed */}
                    </select>
                    {errors.country && (
                        <p className="mt-1 text-xs text-red-400">{errors.country.message}</p>
                    )}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Phone (Optional)</label>
                    <input
                        {...register('phone')}
                        className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                </div>
            </div>

            {/* Default Checkbox */}
            <label className="flex items-center gap-2">
                <input
                    {...register('is_default')}
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-zinc-300">Set as default for this type</span>
            </label>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition hover:bg-amber-400 disabled:opacity-50"
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
        </form>
    )
}
