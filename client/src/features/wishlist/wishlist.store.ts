import { proxy } from 'valtio'
import type { ProductCardDTO, WishlistItemDTO } from '@/types/dto'

export type WishlistProductEntry = {
  itemId: string
  productRef: string
  variantRef: string | null
  product: ProductCardDTO | null
  unavailable: boolean
}

export const wishlistStore = proxy({
  items: [] as WishlistItemDTO[],
  /** Una voce per ogni preferito (disponibili e non). */
  productEntries: [] as WishlistProductEntry[],
  /** true dopo il primo fetch riuscito (anche lista vuota). */
  hydrated: false,
  isLoading: false,
  isProductsLoading: false,
  error: null as string | null,
  productsError: null as string | null,
})
