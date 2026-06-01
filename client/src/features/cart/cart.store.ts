import { proxy } from 'valtio'
import type { CartDTO, ProductCardDTO } from '@/types/dto'

export const cartStore = proxy({
  cart: null as CartDTO | null,
  recommendations: [] as ProductCardDTO[],
  isRecommendationsLoading: false,
  isLoading: false,
  error: null as string | null,
  recommendationsError: null as string | null,
})
