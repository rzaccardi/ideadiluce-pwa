import { proxy } from 'valtio'
import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'

export const productStore = proxy({
  product: null as ProductDetailDTO | null,
  relatedProducts: [] as ProductCardDTO[],
  isLoading: false,
  error: null as string | null,
  currentSlug: null as string | null,
  currentLocale: 'IT' as string,
})
