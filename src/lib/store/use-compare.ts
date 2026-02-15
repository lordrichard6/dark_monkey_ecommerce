import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types'

interface CompareState {
    products: Product[]
    addProduct: (product: Product) => void
    removeProduct: (productId: string) => void
    clearProducts: () => void
    isInCompare: (productId: string) => boolean
}

export const useCompare = create<CompareState>()(
    persist(
        (set, get) => ({
            products: [],
            addProduct: (product) => {
                const { products } = get()
                if (products.some((p) => p.id === product.id)) return
                if (products.length >= 3) {
                    // Could trigger a toast here if we had a toast provider easily accessible
                    return
                }
                set({ products: [...products, product] })
            },
            removeProduct: (productId) => {
                set((state) => ({
                    products: state.products.filter((p) => p.id !== productId),
                }))
            },
            clearProducts: () => set({ products: [] }),
            isInCompare: (productId) => {
                return get().products.some((p) => p.id === productId)
            },
        }),
        {
            name: 'dark-monkey-compare',
        }
    )
)
