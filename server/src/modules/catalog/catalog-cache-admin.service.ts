import { isOdooCatalogConfigured } from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { HUB_LOCALES, type HubLocale } from '../../lib/hub-locale.js'
import { logger } from '../../lib/logger.js'
import { AppError } from '../../types/errors.js'
import {
  CATALOG_INDEX_REFRESH_HOURS_ROME,
  CATALOG_INDEX_REFRESH_TZ,
  CATALOG_INDEX_TTL_MS,
  getCatalogIndexSyncHistory,
  getCatalogIndexSyncProgress,
  getOdooCatalogIndexMeta,
  hydrateOdooCatalogIndexFromDisk,
  syncAllOdooCatalogIndexes,
} from './odoo-catalog-index.service.js'
import type {
  CatalogIndexSyncHistoryEntry,
  CatalogIndexSyncProgressDTO,
} from './odoo-catalog-index-checkpoint.js'

export type CatalogCacheLocaleStatus = {
  locale: HubLocale
  count: number
  details: number
  categories: number
  brands: number
  syncedAt: string | null
  stale: boolean
}

export type CatalogCacheStatusDTO = {
  configured: boolean
  ttlMs: number
  refreshHoursRome: number[]
  refreshTimezone: string
  syncing: boolean
  syncStartedAt: string | null
  lastSyncFinishedAt: string | null
  lastSyncError: string | null
  lastSyncLocales: Array<{
    locale: HubLocale
    count: number
    details: number
    syncedAt: string
  }> | null
  progress: CatalogIndexSyncProgressDTO[]
  history: CatalogIndexSyncHistoryEntry[]
  locales: CatalogCacheLocaleStatus[]
}

type SyncRunState = {
  syncing: boolean
  syncStartedAt: string | null
  lastSyncFinishedAt: string | null
  lastSyncError: string | null
  lastSyncLocales: CatalogCacheStatusDTO['lastSyncLocales']
}

const syncState: SyncRunState = {
  syncing: false,
  syncStartedAt: null,
  lastSyncFinishedAt: null,
  lastSyncError: null,
  lastSyncLocales: null,
}

async function buildStatus(): Promise<CatalogCacheStatusDTO> {
  await hydrateOdooCatalogIndexFromDisk()
  const progress = await getCatalogIndexSyncProgress()
  return {
    configured: isOdooCatalogConfigured(),
    ttlMs: CATALOG_INDEX_TTL_MS,
    refreshHoursRome: [...CATALOG_INDEX_REFRESH_HOURS_ROME],
    refreshTimezone: CATALOG_INDEX_REFRESH_TZ,
    syncing: syncState.syncing || progress.length > 0,
    syncStartedAt: syncState.syncStartedAt,
    lastSyncFinishedAt: syncState.lastSyncFinishedAt,
    lastSyncError: syncState.lastSyncError,
    lastSyncLocales: syncState.lastSyncLocales,
    progress,
    history: await getCatalogIndexSyncHistory(),
    locales: HUB_LOCALES.map((locale) => {
      const meta = getOdooCatalogIndexMeta(locale)
      return { locale, ...meta }
    }),
  }
}

async function runSyncInBackground(reason: string) {
  try {
    const result = await syncAllOdooCatalogIndexes({ force: true, reason })
    syncState.lastSyncLocales = result.locales
    syncState.lastSyncFinishedAt = new Date().toISOString()
    syncState.lastSyncError = null
    logger.info('catalog_cache.admin_sync', { reason, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    syncState.lastSyncError = message.slice(0, 2000)
    syncState.lastSyncFinishedAt = new Date().toISOString()
    logger.warn('catalog_cache.admin_sync_failed', { reason, err: message })
  } finally {
    syncState.syncing = false
  }
}

export const catalogCacheAdminService = {
  async getStatus(): Promise<CatalogCacheStatusDTO> {
    return buildStatus()
  },

  async startSync(): Promise<CatalogCacheStatusDTO> {
    if (!isOdooCatalogConfigured()) {
      throw new AppError(
        'ODOO_CATALOG_NOT_CONFIGURED',
        'OdooCatalog not configured',
        'Integrazione catalogo OdooCatalog non configurata.',
        400,
        false,
      )
    }
    if (syncState.syncing) {
      throw new AppError(
        'CATALOG_CACHE_SYNC_IN_PROGRESS',
        'Catalog cache sync already running',
        'Sync cache già in corso.',
        409,
        true,
      )
    }
    syncState.syncing = true
    syncState.syncStartedAt = new Date().toISOString()
    syncState.lastSyncError = null
    void runSyncInBackground('admin_manual')
    return buildStatus()
  },
}
