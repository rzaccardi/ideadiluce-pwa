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

export type CatalogCacheProgress = {
  locale: string
  phase: 'list' | 'details' | 'promote'
  nextListPage: number
  listTotalPages: number | null
  entryCount: number
  detailCount: number
  failedDetailIds: number
  startedAt: string
  updatedAt: string
  resumed: boolean
}

export type CatalogCacheHistoryLocale = {
  locale: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  count?: number
  details?: number
  listPages?: number
  resumed?: boolean
  error?: string
}

export type CatalogCacheHistoryEntry = {
  startedAt: string
  finishedAt: string | null
  status: 'running' | 'completed' | 'failed' | 'interrupted'
  reason: string
  locales: CatalogCacheHistoryLocale[]
}

export type CatalogCacheStatus = {
  configured: boolean
  ttlMs: number
  refreshHoursRome?: number[]
  refreshTimezone?: string
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
  progress?: CatalogCacheProgress[]
  history?: CatalogCacheHistoryEntry[]
  locales: CatalogCacheLocaleStatus[]
}

export const catalogCacheStore = proxy({
  status: null as CatalogCacheStatus | null,
  isLoading: false,
  isSyncing: false,
  error: null as string | null,
})
