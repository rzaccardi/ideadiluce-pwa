import { proxy } from 'valtio'
import type { AbandonedCartsAdminDetail, AbandonedCartsAdminList } from '@/types/abandoned-carts'

export const adminAbandonedCartsStore = proxy({
  list: null as AbandonedCartsAdminList | null,
  listItems: [] as AbandonedCartsAdminList['items'],
  listLoading: false,
  listLoadingMore: false,
  listError: null as string | null,
  detail: null as AbandonedCartsAdminDetail | null,
  detailId: null as string | null,
  detailLoading: false,
  detailError: null as string | null,
})
