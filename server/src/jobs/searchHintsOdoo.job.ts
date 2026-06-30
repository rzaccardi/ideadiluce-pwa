import { logger } from '../lib/logger.js'
import { odooSearchHintsAvailable } from '../adapters/odoo/odooTopPurchasedSearchHints.js'
import {
  isSearchHintsAutoSyncEnabled,
  searchHintsOdooLimit,
  searchHintsOdooLookbackDays,
} from '../modules/search/search-hints-odoo.config.js'
import { searchHintsAdminService } from '../modules/search/search-hints-admin.service.js'

export async function refreshSearchHintsFromOdooIfStale(
  correlationId = 'search-hints-odoo-job',
): Promise<{
  skipped: boolean
  refreshed: boolean
  reason: string
  hintCount?: number
}> {
  if (!isSearchHintsAutoSyncEnabled()) {
    return { skipped: true, refreshed: false, reason: 'auto_sync_disabled' }
  }

  if (!odooSearchHintsAvailable()) {
    return { skipped: true, refreshed: false, reason: 'odoo_not_configured' }
  }

  const stale = await searchHintsAdminService.isOdooSyncStale()
  if (!stale) {
    return { skipped: true, refreshed: false, reason: 'fresh' }
  }

  try {
    const result = await searchHintsAdminService.applyFromOdoo(
      { correlationId },
      {
        lookbackDays: searchHintsOdooLookbackDays(),
        limit: searchHintsOdooLimit(),
      },
    )
    return {
      skipped: false,
      refreshed: true,
      reason: 'applied',
      hintCount: result.hints.length,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn('search_hints_odoo.refresh_failed', { correlationId, error: message })
    return { skipped: false, refreshed: false, reason: 'error' }
  }
}
