import { proxy } from 'valtio'
import type { CartDTO, CartStockInsufficientDTO, ProductCardDTO } from '@/types/dto'

export const cartStore = proxy({
  cart: null as CartDTO | null,
  recommendations: [] as ProductCardDTO[],
  isRecommendationsLoading: false,
  isLoading: false,
  error: null as string | null,
  recommendationsError: null as string | null,
  stockInsufficient: [] as CartStockInsufficientDTO[],
  /** Mostra avviso dopo svuotamento automatico per scadenza riserva. */
  reservationExpiredNotice: false,
})
