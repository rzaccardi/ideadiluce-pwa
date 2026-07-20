import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import { catalogCacheStore, type CatalogCacheStatus } from './catalog-cache.store'

function errMessage(e: unknown) {
  return String(e)
}

async function loadCatalogCacheStatus() {
  catalogCacheStore.isLoading = true
  catalogCacheStore.error = null
  try {
    catalogCacheStore.status = await adminApi<CatalogCacheStatus>('/admin/catalog-cache')
    catalogCacheStore.isSyncing = catalogCacheStore.status.syncing
  } catch (e) {
    catalogCacheStore.error = errMessage(e)
    catalogCacheStore.status = null
  } finally {
    catalogCacheStore.isLoading = false
  }
}

export function fetchCatalogCacheStatus() {
  return dedupeAsync('admin:catalog-cache', loadCatalogCacheStatus)
}

export async function refreshCatalogCacheStatus() {
  return loadCatalogCacheStatus()
}

export async function startCatalogCacheSync() {
  catalogCacheStore.isSyncing = true
  catalogCacheStore.error = null
  try {
    catalogCacheStore.status = await adminApi<CatalogCacheStatus>('/admin/catalog-cache/sync', {
      method: 'POST',
    })
    catalogCacheStore.isSyncing = catalogCacheStore.status.syncing
  } catch (e) {
    catalogCacheStore.error = errMessage(e)
    catalogCacheStore.isSyncing = false
    await loadCatalogCacheStatus()
    throw e
  }
}
