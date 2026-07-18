import { proxy } from 'valtio'
import type { OrderDetailDTO, OrderDTO, ProductCardDTO } from '@/types/dto'

export const ordersStore = proxy({
  list: null as OrderDTO[] | null,
  isListLoading: false,
  listError: null as string | null,
  detail: null as OrderDetailDTO | null,
  detailId: null as string | null,
  isDetailLoading: false,
  detailError: null as string | null,
  recommendations: [] as ProductCardDTO[],
  recommendationsOrderId: null as string | null,
  recommendationsLoading: false,
  recommendationsError: null as string | null,
})
