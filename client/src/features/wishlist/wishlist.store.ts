import { proxy } from 'valtio'
import type { WishlistItemDTO } from '@/types/dto'

export const wishlistStore = proxy({
  items: [] as WishlistItemDTO[],
  isLoading: false,
  error: null as string | null,
})
