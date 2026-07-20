import { describe, expect, it } from 'vitest'
import { CATALOG_INDEX_TTL_MS } from './odoo-catalog-index.service.js'

describe('catalog index cache policy', () => {
  it('TTL soft è 24 ore', () => {
    expect(CATALOG_INDEX_TTL_MS).toBe(24 * 60 * 60 * 1000)
  })
})
