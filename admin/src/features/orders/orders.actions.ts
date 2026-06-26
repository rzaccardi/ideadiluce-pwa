import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import { retryOdooSyncQueueItemById } from '@/features/odoo'
import type { OrdersAdminDetail, OrdersAdminList, OrdersAdminStats, PaidSyncPendingSummary } from '@/types/orders'
import { adminOrdersStore } from './orders.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchAdminOrdersList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    adminOrdersStore.listLoadingMore = true
  } else {
    adminOrdersStore.listLoading = true
    adminOrdersStore.listItems = []
  }
  adminOrdersStore.listError = null
  try {
    const data = await adminApi<OrdersAdminList>(`/admin/orders?${query}`)
    adminOrdersStore.list = data
    if (append) {
      const seen = new Set(adminOrdersStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          adminOrdersStore.listItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      adminOrdersStore.listItems = [...data.items]
    }
  } catch (e) {
    adminOrdersStore.listError = errMessage(e)
    if (!append) {
      adminOrdersStore.list = null
      adminOrdersStore.listItems = []
    }
  } finally {
    adminOrdersStore.listLoading = false
    adminOrdersStore.listLoadingMore = false
  }
}

export function fetchAdminOrdersListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:orders:list:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchAdminOrdersList(query, options))
}

export function resetAdminOrdersList() {
  adminOrdersStore.list = null
  adminOrdersStore.listItems = []
  adminOrdersStore.listError = null
  adminOrdersStore.listLoading = false
  adminOrdersStore.listLoadingMore = false
}

async function loadOrdersStats(periodDays: number) {
  adminOrdersStore.statsLoading = true
  adminOrdersStore.statsError = null
  try {
    adminOrdersStore.stats = await adminApi<OrdersAdminStats>(
      `/admin/orders/stats?days=${periodDays}`,
    )
  } catch (e) {
    adminOrdersStore.statsError = errMessage(e)
    adminOrdersStore.stats = null
  } finally {
    adminOrdersStore.statsLoading = false
  }
}

export function fetchAdminOrdersStats(periodDays: number) {
  return dedupeAsync(`admin:orders:stats:${periodDays}`, () => loadOrdersStats(periodDays))
}

export async function fetchAdminOrderDetail(id: string) {
  adminOrdersStore.detailLoading = true
  adminOrdersStore.detailError = null
  adminOrdersStore.detailId = id
  try {
    adminOrdersStore.detail = await adminApi<OrdersAdminDetail>(`/admin/orders/${id}`)
  } catch (e) {
    adminOrdersStore.detail = null
    adminOrdersStore.detailError = errMessage(e)
  } finally {
    adminOrdersStore.detailLoading = false
  }
}

export function resetAdminOrderDetail() {
  adminOrdersStore.detail = null
  adminOrdersStore.detailId = null
  adminOrdersStore.detailError = null
  adminOrdersStore.detailLoading = false
  adminOrdersStore.syncRetryLoading = false
  adminOrdersStore.syncRetryError = null
}

export async function retryOrderSyncById(orderId: string) {
  adminOrdersStore.syncRetryLoading = true
  adminOrdersStore.syncRetryError = null
  try {
    await adminApi(`/admin/orders/${orderId}/retry-sync`, { method: 'POST' })
    await fetchAdminOrderDetail(orderId)
  } catch (e) {
    adminOrdersStore.syncRetryError = errMessage(e)
  } finally {
    adminOrdersStore.syncRetryLoading = false
  }
}

export async function retryOdooSyncQueueItem(queueId: string, orderId: string) {
  adminOrdersStore.syncRetryLoading = true
  adminOrdersStore.syncRetryError = null
  try {
    await retryOdooSyncQueueItemById(queueId)
    await fetchAdminOrderDetail(orderId)
  } catch (e) {
    adminOrdersStore.syncRetryError = errMessage(e)
  } finally {
    adminOrdersStore.syncRetryLoading = false
  }
}

export async function fetchPaidSyncPending() {
  adminOrdersStore.paidSyncPendingLoading = true
  try {
    adminOrdersStore.paidSyncPending = await adminApi<PaidSyncPendingSummary>(
      '/admin/orders/paid-sync-pending',
    )
  } catch {
    adminOrdersStore.paidSyncPending = null
  } finally {
    adminOrdersStore.paidSyncPendingLoading = false
  }
}
