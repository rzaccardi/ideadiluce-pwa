import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../adapters/odoo/odooTopPurchasedSearchHints.js', () => ({
  fetchTopPurchasedSearchHints: vi.fn(),
  odooSearchHintsAvailable: vi.fn(() => true),
}))

vi.mock('../site/site.repository.js', () => ({
  siteRepository: {
    findByKeyLocale: vi.fn(),
  },
}))

vi.mock('../site/site.service.js', () => ({
  siteService: {
    saveAdminPage: vi.fn(),
  },
}))

import { fetchTopPurchasedSearchHints, odooSearchHintsAvailable } from '../../adapters/odoo/odooTopPurchasedSearchHints.js'
import { siteRepository } from '../site/site.repository.js'
import { siteService } from '../site/site.service.js'
import { searchHintsAdminService } from './search-hints-admin.service.js'

const ctx = { correlationId: 'test-corr' }

const suggestions = [
  {
    query: 'TLB 322805',
    productTemplateId: 501,
    productName: 'Lampadina GU10',
    defaultCode: 'TLB 322805',
    totalQuantity: 12,
  },
  {
    query: 'Artemide Eclisse',
    productTemplateId: 502,
    productName: 'Artemide Eclisse',
    defaultCode: null,
    totalQuantity: 8,
  },
]

describe('searchHintsAdminService', () => {
  beforeEach(() => {
    vi.mocked(odooSearchHintsAvailable).mockReturnValue(true)
    vi.mocked(fetchTopPurchasedSearchHints).mockReset()
    vi.mocked(fetchTopPurchasedSearchHints).mockResolvedValue(suggestions)
    vi.mocked(siteRepository.findByKeyLocale).mockResolvedValue(null)
    vi.mocked(siteService.saveAdminPage).mockReset()
    vi.mocked(siteService.saveAdminPage).mockResolvedValue({
      pageKey: 'home',
      locale: 'IT',
      published: true,
      content: {},
      updatedAt: '2026-06-30T10:00:00.000Z',
      hasCustomContent: true,
      translatableStringCount: 10,
    })
  })

  it('previewFromOdoo restituisce suggerimenti e hint correnti', async () => {
    const result = await searchHintsAdminService.previewFromOdoo(ctx, { lookbackDays: 90, limit: 8 })

    expect(result.odooConfigured).toBe(true)
    expect(result.suggestions).toEqual(suggestions)
    expect(result.currentHints).toContain('R7s 118mm')
    expect(fetchTopPurchasedSearchHints).toHaveBeenCalledWith(ctx, { lookbackDays: 90, limit: 8 })
  })

  it('previewFromOdoo fallisce se Odoo non è configurato', async () => {
    vi.mocked(odooSearchHintsAvailable).mockReturnValue(false)

    await expect(
      searchHintsAdminService.previewFromOdoo(ctx, { lookbackDays: 90, limit: 8 }),
    ).rejects.toMatchObject({ code: 'ODOO_NOT_CONFIGURED' })
  })

  it('applyFromOdoo salva le query nella Home per tutte le lingue', async () => {
    const result = await searchHintsAdminService.applyFromOdoo(ctx, { lookbackDays: 90, limit: 8 })

    expect(result.hints).toEqual(['TLB 322805', 'Artemide Eclisse'])
    expect(result.updatedLocales).toEqual(['IT', 'EN', 'ES', 'FR', 'DE'])
    expect(siteService.saveAdminPage).toHaveBeenCalledTimes(5)
    expect(siteService.saveAdminPage).toHaveBeenCalledWith(
      'home',
      'IT',
      expect.objectContaining({
        search: expect.objectContaining({
          hints: ['TLB 322805', 'Artemide Eclisse'],
          hintsOdooSyncedAt: expect.any(String),
        }),
      }),
      true,
    )
    expect(result.updatedAt).toBe('2026-06-30T10:00:00.000Z')
  })

  it('applyFromOdoo fallisce senza prodotti nel periodo', async () => {
    vi.mocked(fetchTopPurchasedSearchHints).mockResolvedValue([])

    await expect(
      searchHintsAdminService.applyFromOdoo(ctx, { lookbackDays: 90, limit: 8 }),
    ).rejects.toMatchObject({ code: 'SEARCH_HINTS_EMPTY' })
    expect(siteService.saveAdminPage).not.toHaveBeenCalled()
  })
})
