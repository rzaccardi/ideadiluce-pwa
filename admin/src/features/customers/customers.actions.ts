import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type {
  CustomersAdminAbandonedList,
  CustomersAdminDetail,
  CustomersAdminList,
} from '@/types/customers'
import { adminCustomersStore } from './customers.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchAdminCustomersList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    adminCustomersStore.listLoadingMore = true
  } else {
    adminCustomersStore.listLoading = true
    adminCustomersStore.listItems = []
  }
  adminCustomersStore.listError = null
  try {
    const data = await adminApi<CustomersAdminList>(`/admin/customers?${query}`)
    adminCustomersStore.list = data
    if (append) {
      const seen = new Set(adminCustomersStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          adminCustomersStore.listItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      adminCustomersStore.listItems = [...data.items]
    }
  } catch (e) {
    adminCustomersStore.listError = errMessage(e)
    if (!append) {
      adminCustomersStore.list = null
      adminCustomersStore.listItems = []
    }
  } finally {
    adminCustomersStore.listLoading = false
    adminCustomersStore.listLoadingMore = false
  }
}

export function fetchAdminCustomersListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:customers:list:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchAdminCustomersList(query, options))
}

export function resetAdminCustomersList() {
  adminCustomersStore.list = null
  adminCustomersStore.listItems = []
  adminCustomersStore.listError = null
  adminCustomersStore.listLoading = false
  adminCustomersStore.listLoadingMore = false
}

export async function fetchAdminAbandonedEvents(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    adminCustomersStore.abandonedLoadingMore = true
  } else {
    adminCustomersStore.abandonedLoading = true
    adminCustomersStore.abandonedItems = []
  }
  adminCustomersStore.abandonedError = null
  try {
    const data = await adminApi<CustomersAdminAbandonedList>(
      `/admin/customers/abandoned-events?${query}`,
    )
    adminCustomersStore.abandonedList = data
    if (append) {
      const seen = new Set(adminCustomersStore.abandonedItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          adminCustomersStore.abandonedItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      adminCustomersStore.abandonedItems = [...data.items]
    }
  } catch (e) {
    adminCustomersStore.abandonedError = errMessage(e)
    if (!append) {
      adminCustomersStore.abandonedList = null
      adminCustomersStore.abandonedItems = []
    }
  } finally {
    adminCustomersStore.abandonedLoading = false
    adminCustomersStore.abandonedLoadingMore = false
  }
}

export function fetchAdminAbandonedEventsDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:customers:abandoned:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchAdminAbandonedEvents(query, options))
}

export async function fetchAdminCustomerDetail(id: string) {
  adminCustomersStore.detailLoading = true
  adminCustomersStore.detailError = null
  adminCustomersStore.detailId = id
  try {
    adminCustomersStore.detail = await adminApi<CustomersAdminDetail>(`/admin/customers/${id}`)
  } catch (e) {
    adminCustomersStore.detail = null
    adminCustomersStore.detailError = errMessage(e)
  } finally {
    adminCustomersStore.detailLoading = false
  }
}

export function resetAdminCustomerDetail() {
  adminCustomersStore.detail = null
  adminCustomersStore.detailId = null
  adminCustomersStore.detailError = null
  adminCustomersStore.detailLoading = false
}

export type ImpersonateCustomerResult = {
  url: string
  expiresAt: string
}

export async function impersonateAdminCustomer(customerId: string): Promise<ImpersonateCustomerResult> {
  return adminApi<ImpersonateCustomerResult>(`/admin/customers/${customerId}/impersonate`, {
    method: 'POST',
  })
}
