import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type {
  OdooPaginated,
  OdooPricelist,
  OdooQuotationDetail,
  OdooSaleDocument,
  OdooStatus,
  OdooSyncQueueItem,
  OdooSyncQueueList,
} from '@/types/odoo'
import { odooStore } from './odoo.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchOdooStatus() {
  return adminApi<OdooStatus>('/admin/odoo/status')
}

export async function fetchOdooOrders(query: string) {
  return adminApi<OdooPaginated<OdooSaleDocument>>(`/admin/odoo/orders?${query}`)
}

export async function fetchOdooQuotations(query: string) {
  return adminApi<OdooPaginated<OdooSaleDocument>>(`/admin/odoo/quotations?${query}`)
}

export async function fetchOdooQuotationDetail(id: number) {
  return adminApi<OdooQuotationDetail>(`/admin/odoo/quotations/${id}`)
}

export async function fetchOdooPricelists(query: string) {
  return adminApi<OdooPaginated<OdooPricelist>>(`/admin/odoo/pricelists?${query}`)
}

export async function fetchOdooSyncQueue(query: string) {
  return adminApi<OdooSyncQueueList>(`/admin/odoo/sync-queue?${query}`)
}

export async function retryOdooSyncQueueItemById(queueId: string) {
  return adminApi<OdooSyncQueueItem>(`/admin/odoo/sync-queue/${queueId}/retry`, { method: 'POST' })
}

export async function fetchOdooQuotationsList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    odooStore.quotationsListLoadingMore = true
  } else {
    odooStore.quotationsListLoading = true
    odooStore.quotationsListItems = []
  }
  odooStore.quotationsListError = null
  try {
    const data = await fetchOdooQuotations(query)
    odooStore.quotationsList = data
    if (append) {
      const seen = new Set(odooStore.quotationsListItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          odooStore.quotationsListItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      odooStore.quotationsListItems = [...data.items]
    }
  } catch (e) {
    odooStore.quotationsListError = errMessage(e)
    if (!append) {
      odooStore.quotationsList = null
      odooStore.quotationsListItems = []
    }
  } finally {
    odooStore.quotationsListLoading = false
    odooStore.quotationsListLoadingMore = false
  }
}

export function fetchOdooQuotationsListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:odoo:quotations:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchOdooQuotationsList(query, options))
}

export async function fetchOdooQuotationDetailIntoStore(id: number) {
  odooStore.quotationDetailLoading = true
  odooStore.quotationDetailError = null
  odooStore.quotationDetailId = id
  try {
    odooStore.quotationDetail = await fetchOdooQuotationDetail(id)
  } catch (e) {
    odooStore.quotationDetailError = errMessage(e)
    odooStore.quotationDetail = null
  } finally {
    odooStore.quotationDetailLoading = false
  }
}

export function resetOdooQuotationDetail() {
  odooStore.quotationDetail = null
  odooStore.quotationDetailId = null
  odooStore.quotationDetailError = null
}

export async function fetchOdooPricelistsList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    odooStore.pricelistsListLoadingMore = true
  } else {
    odooStore.pricelistsListLoading = true
    odooStore.pricelistsListItems = []
  }
  odooStore.pricelistsListError = null
  try {
    const data = await fetchOdooPricelists(query)
    odooStore.pricelistsList = data
    if (append) {
      const seen = new Set(odooStore.pricelistsListItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          odooStore.pricelistsListItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      odooStore.pricelistsListItems = [...data.items]
    }
  } catch (e) {
    odooStore.pricelistsListError = errMessage(e)
    if (!append) {
      odooStore.pricelistsList = null
      odooStore.pricelistsListItems = []
    }
  } finally {
    odooStore.pricelistsListLoading = false
    odooStore.pricelistsListLoadingMore = false
  }
}

export function fetchOdooPricelistsListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:odoo:pricelists:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchOdooPricelistsList(query, options))
}

export async function fetchOdooSyncQueueList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    odooStore.syncQueueListLoadingMore = true
  } else {
    odooStore.syncQueueListLoading = true
    odooStore.syncQueueListItems = []
  }
  odooStore.syncQueueListError = null
  try {
    const data = await fetchOdooSyncQueue(query)
    odooStore.syncQueueList = data
    if (append) {
      const seen = new Set(odooStore.syncQueueListItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          odooStore.syncQueueListItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      odooStore.syncQueueListItems = [...data.items]
    }
  } catch (e) {
    odooStore.syncQueueListError = errMessage(e)
    if (!append) {
      odooStore.syncQueueList = null
      odooStore.syncQueueListItems = []
    }
  } finally {
    odooStore.syncQueueListLoading = false
    odooStore.syncQueueListLoadingMore = false
  }
}

export function fetchOdooSyncQueueListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:odoo:sync-queue:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchOdooSyncQueueList(query, options))
}

export async function retryOdooSyncQueueItem(queueId: string, listQuery: string) {
  odooStore.syncQueueRetryingId = queueId
  odooStore.syncQueueListError = null
  try {
    await retryOdooSyncQueueItemById(queueId)
    await fetchOdooSyncQueueList(listQuery)
  } catch (e) {
    odooStore.syncQueueListError = errMessage(e)
  } finally {
    odooStore.syncQueueRetryingId = null
  }
}
