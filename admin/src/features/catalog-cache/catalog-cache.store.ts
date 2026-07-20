import { proxy } from 'valtio'

export type CatalogCacheLocaleStatus = {
  locale: string
  count: number
  details: number
  categories: number
  brands: number
  syncedAt: string | null
  stale: boolean
}

export type CatalogCacheStatus = {
  configured: boolean
  ttlMs: number
  syncing: boolean
  syncStartedAt: string | null
  lastSyncFinishedAt: string | null
  lastSyncError: string | null
  lastSyncLocales: Array<{
    locale: string
    count: number
    details: number
    syncedAt: string
  }> | null
  locales: CatalogCacheLocaleStatus[]
}

export const catalogCacheStore = proxy({
  status: null as CatalogCacheStatus | null,
  isLoading: false,
  isSyncing: false,
  error: null as string | null,
})
