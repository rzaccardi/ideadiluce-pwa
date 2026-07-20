import { describe, expect, it } from 'vitest'
import type { ProductCardDTO } from '@/types/dto'
import {
  buildCatalogApiQuery,
  filterProductsBySpec,
  productMatchesSpecFilter,
  resolveEffectiveCatalogCategory,
} from './catalog-filters'

function product(partial: Partial<ProductCardDTO> & Pick<ProductCardDTO, 'name'>): ProductCardDTO {
  return {
    id: partial.id ?? '1',
    slug: partial.slug ?? 'test',
    name: partial.name,
    priceCents: partial.priceCents ?? 1000,
    currency: partial.currency ?? 'EUR',
    imageUrl: partial.imageUrl ?? null,
    shortDescription: partial.shortDescription,
    specTags: partial.specTags,
    categorySlug: partial.categorySlug,
  }
}

describe('buildCatalogApiQuery', () => {
  it('restituisce solo testo libero', () => {
    expect(buildCatalogApiQuery('lampadina')).toBe('lampadina')
    expect(buildCatalogApiQuery('  ')).toBeUndefined()
  })
})

describe('filterProductsBySpec', () => {
  it('filtra per attacco GU10 su specTags', () => {
    const items = [
      product({ name: 'Lampada arredo', specTags: ['E27'] }),
      product({ id: '2', slug: 'gu10', name: 'Lampadina GU10', specTags: ['GU10', '5W'] }),
    ]
    expect(filterProductsBySpec(items, { attacco: 'GU10' })).toHaveLength(1)
    expect(filterProductsBySpec(items, { attacco: 'GU10' })[0]?.name).toContain('GU10')
  })

  it('filtra per Kelvin', () => {
    const items = [
      product({ name: 'Lampadina calda', specTags: ['2700K'] }),
      product({ id: '2', slug: 'fredda', name: 'Lampadina fredda', specTags: ['4000K'] }),
    ]
    expect(filterProductsBySpec(items, { colorTemp: '4000K' })).toHaveLength(1)
  })

  it('accetta GU5.3 con varianti nel filtro', () => {
    const items = [product({ name: 'Faretto MR16', specTags: ['GU5.3'] })]
    expect(productMatchesSpecFilter(items[0]!, { attacco: 'GU5.3' })).toBe(true)
    expect(productMatchesSpecFilter(items[0]!, { attacco: 'GU5-3' })).toBe(true)
  })
})

describe('resolveEffectiveCatalogCategory', () => {
  it('forza tecnico con world=technical', () => {
    expect(
      resolveEffectiveCatalogCategory({ worldTab: 'technical' }),
    ).toBe('tecnico')
  })

  it('forza arredo con world=design', () => {
    expect(
      resolveEffectiveCatalogCategory({ worldTab: 'design' }),
    ).toBe('arredo')
  })

  it('usa categoria tecnica quando c’è filtro attacco', () => {
    expect(
      resolveEffectiveCatalogCategory({ worldTab: 'all', attacco: 'GU10' }),
    ).toBe('tecnico')
  })
})
