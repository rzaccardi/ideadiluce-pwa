import { proxy } from 'valtio'
import type { RestockAdminDetail, RestockAdminList } from '@/types/restock'

export const adminRestockStore = proxy({
  list: null as RestockAdminList | null,
  listItems: [] as RestockAdminList['items'],
  listLoading: false,
  listLoadingMore: false,
  listError: null as string | null,
  detail: null as RestockAdminDetail | null,
  detailId: null as string | null,
  detailLoading: false,
  detailError: null as string | null,
})
