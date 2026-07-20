import { describe, expect, it } from 'vitest'
import {
  isCatalogSearchQueryPresent,
  resolveCatalogListPageSize,
  sanitizeCatalogSearchQuery,
} from './catalog-search-guard.js'

describe('sanitizeCatalogSearchQuery', () => {
  it('restituisce undefined per stringhe vuote', () => {
    expect(sanitizeCatalogSearchQuery('   ')).toBeUndefined()
    expect(sanitizeCatalogSearchQuery(undefined)).toBeUndefined()
  })

  it('normalizza e tronca la query', () => {
    expect(sanitizeCatalogSearchQuery('  GU10\u0001  2700K  ')).toBe('GU10 2700K')
    expect(sanitizeCatalogSearchQuery('x'.repeat(200))?.length).toBe(120)
  })
})

describe('isCatalogSearchQueryPresent', () => {
  it('rileva presenza query valida', () => {
    expect(isCatalogSearchQueryPresent('E27')).toBe(true)
    expect(isCatalogSearchQueryPresent('  ')).toBe(false)
  })
})

describe('resolveCatalogListPageSize', () => {
  it('limita pageSize per suggest con q', () => {
    expect(resolveCatalogListPageSize(6, true)).toBe(6)
    expect(resolveCatalogListPageSize(12, true)).toBe(8)
    expect(resolveCatalogListPageSize(24, true)).toBe(24)
    expect(resolveCatalogListPageSize(24, false)).toBe(24)
    expect(resolveCatalogListPageSize(100, false)).toBe(100)
    expect(resolveCatalogListPageSize(200, false)).toBe(100)
  })
})
