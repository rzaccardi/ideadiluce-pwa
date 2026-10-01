import { describe, expect, it } from 'vitest'
import { catalogFacetsFetchKey } from './catalog.actions'

describe('catalogFacetsFetchKey', () => {
  it('usa solo q, world e locale (i filtri strutturati non entrano nella chiave)', () => {
    expect(
      catalogFacetsFetchKey({ q: 'lampada', world: 'design', locale: 'IT' }),
    ).toBe('lampada|design|IT')
    expect(catalogFacetsFetchKey({ locale: 'EN' })).toBe('||EN')
    expect(
      catalogFacetsFetchKey({ q: undefined, world: 'technical', locale: 'IT' }),
    ).toBe('|technical|IT')
  })

  it('distingue world e q così un cambio filtro strutturato non genera una chiave diversa', () => {
    const base = catalogFacetsFetchKey({ q: '', world: 'design', locale: 'IT' })
    // Stessa chiave attesa quando cambiano solo category/brand/attacco (non in input).
    expect(catalogFacetsFetchKey({ world: 'design', locale: 'IT' })).toBe(base)
    expect(catalogFacetsFetchKey({ q: 'led', world: 'design', locale: 'IT' })).not.toBe(base)
    expect(catalogFacetsFetchKey({ world: 'technical', locale: 'IT' })).not.toBe(base)
  })
})
