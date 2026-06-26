import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type { RestockAdminDetail, RestockAdminList, RestockAdminPatchInput } from '@/types/restock'
import { adminRestockStore } from './restock.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchAdminRestockList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    adminRestockStore.listLoadingMore = true
  } else {
    adminRestockStore.listLoading = true
    adminRestockStore.listItems = []
  }
  adminRestockStore.listError = null
  try {
    const data = await adminApi<RestockAdminList>(`/admin/customers/restock-requests?${query}`)
    adminRestockStore.list = data
    if (append) {
      const seen = new Set(adminRestockStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          adminRestockStore.listItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      adminRestockStore.listItems = [...data.items]
    }
  } catch (e) {
    adminRestockStore.listError = errMessage(e)
    if (!append) {
      adminRestockStore.list = null
      adminRestockStore.listItems = []
    }
  } finally {
    adminRestockStore.listLoading = false
    adminRestockStore.listLoadingMore = false
  }
}

export function fetchAdminRestockListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:restock:list:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchAdminRestockList(query, options))
}

export async function fetchAdminRestockDetail(id: string) {
  adminRestockStore.detailLoading = true
  adminRestockStore.detailError = null
  adminRestockStore.detailId = id
  try {
    adminRestockStore.detail = await adminApi<RestockAdminDetail>(
      `/admin/customers/restock-requests/${id}`,
    )
  } catch (e) {
    adminRestockStore.detailError = errMessage(e)
    adminRestockStore.detail = null
  } finally {
    adminRestockStore.detailLoading = false
  }
}

export function resetAdminRestockDetail() {
  adminRestockStore.detail = null
  adminRestockStore.detailId = null
  adminRestockStore.detailError = null
}

export async function patchAdminRestock(id: string, body: RestockAdminPatchInput) {
  adminRestockStore.detailLoading = true
  adminRestockStore.detailError = null
  try {
    const updated = await adminApi<RestockAdminDetail>(
      `/admin/customers/restock-requests/${id}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    )
    adminRestockStore.detail = updated
    const idx = adminRestockStore.listItems.findIndex((i) => i.id === id)
    if (idx >= 0) {
      adminRestockStore.listItems[idx] = { ...adminRestockStore.listItems[idx], ...updated }
    }
    return updated
  } catch (e) {
    adminRestockStore.detailError = errMessage(e)
    throw e
  } finally {
    adminRestockStore.detailLoading = false
  }
}
