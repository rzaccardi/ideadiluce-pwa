import { proxy } from 'valtio'
import type { OrdersAdminDetail, OrdersAdminList, OrdersAdminStats, PaidSyncPendingSummary } from '@/types/orders'

export const adminOrdersStore = proxy({
  list: null as OrdersAdminList | null,
  listItems: [] as OrdersAdminList['items'],
  listLoading: false,
  listLoadingMore: false,
  listError: null as string | null,
  stats: null as OrdersAdminStats | null,
  statsLoading: false,
  statsError: null as string | null,
  detail: null as OrdersAdminDetail | null,
  detailId: null as string | null,
  detailLoading: false,
  detailError: null as string | null,
  syncRetryLoading: false,
  syncRetryError: null as string | null,
  paidSyncPending: null as PaidSyncPendingSummary | null,
  paidSyncPendingLoading: false,
})
