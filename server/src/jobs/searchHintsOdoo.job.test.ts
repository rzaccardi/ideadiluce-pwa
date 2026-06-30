import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../adapters/odoo/odooTopPurchasedSearchHints.js', () => ({
  odooSearchHintsAvailable: vi.fn(() => true),
}))

vi.mock('../modules/search/search-hints-odoo.config.js', () => ({
  isSearchHintsAutoSyncEnabled: vi.fn(() => true),
  searchHintsOdooLimit: vi.fn(() => 8),
  searchHintsOdooLookbackDays: vi.fn(() => 90),
}))

vi.mock('../modules/search/search-hints-admin.service.js', () => ({
  searchHintsAdminService: {
    isOdooSyncStale: vi.fn(),
    applyFromOdoo: vi.fn(),
  },
}))

import { odooSearchHintsAvailable } from '../adapters/odoo/odooTopPurchasedSearchHints.js'
import { isSearchHintsAutoSyncEnabled } from '../modules/search/search-hints-odoo.config.js'
import { searchHintsAdminService } from '../modules/search/search-hints-admin.service.js'
import { refreshSearchHintsFromOdooIfStale } from './searchHintsOdoo.job.js'

describe('refreshSearchHintsFromOdooIfStale', () => {
  beforeEach(() => {
    vi.mocked(isSearchHintsAutoSyncEnabled).mockReturnValue(true)
    vi.mocked(odooSearchHintsAvailable).mockReturnValue(true)
    vi.mocked(searchHintsAdminService.isOdooSyncStale).mockResolvedValue(false)
    vi.mocked(searchHintsAdminService.applyFromOdoo).mockResolvedValue({
      lookbackDays: 90,
      limit: 8,
      hints: ['GU10'],
      suggestions: [],
      updatedLocales: ['IT'],
      updatedAt: '2026-06-30T12:00:00.000Z',
    })
  })

  it('salta se auto-sync disattivato', async () => {
    vi.mocked(isSearchHintsAutoSyncEnabled).mockReturnValue(false)
    const result = await refreshSearchHintsFromOdooIfStale()
    expect(result).toMatchObject({ skipped: true, reason: 'auto_sync_disabled' })
  })

  it('salta se i dati sono ancora freschi', async () => {
    const result = await refreshSearchHintsFromOdooIfStale()
    expect(result).toMatchObject({ skipped: true, reason: 'fresh' })
    expect(searchHintsAdminService.applyFromOdoo).not.toHaveBeenCalled()
  })

  it('applica se i dati sono stale', async () => {
    vi.mocked(searchHintsAdminService.isOdooSyncStale).mockResolvedValue(true)
    const result = await refreshSearchHintsFromOdooIfStale('job-test')
    expect(result).toMatchObject({ refreshed: true, reason: 'applied', hintCount: 1 })
    expect(searchHintsAdminService.applyFromOdoo).toHaveBeenCalledWith(
      { correlationId: 'job-test' },
      { lookbackDays: 90, limit: 8 },
    )
  })
})
