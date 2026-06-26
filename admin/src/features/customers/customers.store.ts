import { proxy } from 'valtio'
import type {
  CustomersAdminAbandonedList,
  CustomersAdminDetail,
  CustomersAdminList,
  CustomersAdminListItem,
} from '@/types/customers'

export const adminCustomersStore = proxy({
  list: null as CustomersAdminList | null,
  listItems: [] as CustomersAdminListItem[],
  listLoading: false,
  listLoadingMore: false,
  listError: null as string | null,

  abandonedList: null as CustomersAdminAbandonedList | null,
  abandonedItems: [] as CustomersAdminAbandonedList['items'],
  abandonedLoading: false,
  abandonedLoadingMore: false,
  abandonedError: null as string | null,

  detail: null as CustomersAdminDetail | null,
  detailId: null as string | null,
  detailLoading: false,
  detailError: null as string | null,
})
