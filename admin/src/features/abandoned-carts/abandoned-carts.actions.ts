import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type { AbandonedCartsAdminDetail, AbandonedCartsAdminList } from '@/types/abandoned-carts'
import { adminAbandonedCartsStore } from './abandoned-carts.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchAdminAbandonedCartsList(
  query: string,
  options?: { append?: boolean },
) {
  if (options?.append) {
    adminAbandonedCartsStore.listLoadingMore = true
  } else {
    adminAbandonedCartsStore.listLoading = true
    adminAbandonedCartsStore.listItems = []
  }
  adminAbandonedCartsStore.listError = null
  try {
    const data = await adminApi<AbandonedCartsAdminList>(`/admin/abandoned-carts?${query}`)
    adminAbandonedCartsStore.list = data
    if (options?.append && data.items.length > 0) {
      const seen = new Set(adminAbandonedCartsStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) adminAbandonedCartsStore.listItems.push(item)
      }
    } else {
      adminAbandonedCartsStore.listItems = [...data.items]
    }
  } catch (e) {
    adminAbandonedCartsStore.listError = errMessage(e)
    if (!options?.append) {
      adminAbandonedCartsStore.list = null
      adminAbandonedCartsStore.listItems = []
    }
  } finally {
    adminAbandonedCartsStore.listLoading = false
    adminAbandonedCartsStore.listLoadingMore = false
  }
}

export function fetchAdminAbandonedCartsListDeduped(
  query: string,
  options?: { append?: boolean },
) {
  const key = `admin:abandoned-carts:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchAdminAbandonedCartsList(query, options))
}

export async function fetchAdminAbandonedCartDetail(id: string) {
  adminAbandonedCartsStore.detailLoading = true
  adminAbandonedCartsStore.detailError = null
  adminAbandonedCartsStore.detailId = id
  try {
    adminAbandonedCartsStore.detail = await adminApi<AbandonedCartsAdminDetail>(
      `/admin/abandoned-carts/${id}`,
    )
  } catch (e) {
    adminAbandonedCartsStore.detailError = errMessage(e)
    adminAbandonedCartsStore.detail = null
  } finally {
    adminAbandonedCartsStore.detailLoading = false
  }
}

export function resetAdminAbandonedCartDetail() {
  adminAbandonedCartsStore.detail = null
  adminAbandonedCartsStore.detailId = null
  adminAbandonedCartsStore.detailError = null
}
