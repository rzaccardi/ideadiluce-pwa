import { describe, expect, it } from 'vitest'
import {
  CATALOG_INDEX_DETAIL_BATCH_SIZE,
  CATALOG_INDEX_DETAIL_CONCURRENCY,
  CATALOG_INDEX_LIST_PER_PAGE,
  CATALOG_INDEX_REFRESH_HOURS_ROME,
  CATALOG_INDEX_TTL_MS,
} from './odoo-catalog-index.service.js'

describe('catalog index cache policy', () => {
  it('TTL soft è 12 ore', () => {
    expect(CATALOG_INDEX_TTL_MS).toBe(12 * 60 * 60 * 1000)
  })

  it('refresh schedulato ogni 12 ore (03:00 e 15:00)', () => {
    expect([...CATALOG_INDEX_REFRESH_HOURS_ROME]).toEqual([3, 15])
  })

  it('sync paginato: 100 per pagina lista, 20 dettagli per batch, max 2 in volo', () => {
    expect(CATALOG_INDEX_LIST_PER_PAGE).toBe(100)
    expect(CATALOG_INDEX_DETAIL_BATCH_SIZE).toBe(20)
    expect(CATALOG_INDEX_DETAIL_CONCURRENCY).toBe(2)
  })
})
