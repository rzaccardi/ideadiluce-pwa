import { describe, expect, it } from 'vitest'
import type { CatalogFiltersDTO } from '@/types/dto'
import {
  getCatalogSubtypeChips,
  getCatalogTypeTiles,
  isDesignCatalogHub,
  isTechnicalCatalogHub,
} from './catalog-category-nav'

const designFacets: CatalogFiltersDTO = {
  totalMatching: 40,
  appliedFilters: {},
  worlds: [{ value: 'design', label: 'Arredo', count: 40 }],
  categories: [
    {
      slug: 'arredo',
      name: 'Arredo',
      parentSlug: null,
      count: 40,
      children: [
        {
          slug: 'sospensione',
          name: 'Sospensione',
          parentSlug: 'arredo',
          count: 38,
          children: [
            {
              slug: 'sospensione-2',
              name: 'Sospensione 2',
              parentSlug: 'sospensione',
              count: 2,
              children: [],
            },
          ],
        },
        { slug: 'tavolo', name: 'Tavolo', parentSlug: 'arredo', count: 12, children: [] },
        { slug: 'soffitto', name: 'Soffitto', parentSlug: 'arredo', count: 8, children: [] },
      ],
    },
  ],
  brands: [],
  tipologie: [
    { value: 'sospensione', label: 'Sospensione', count: 38 },
    { value: 'tavolo', label: 'Tavolo', count: 12 },
    { value: 'soffitto', label: 'Soffitto', count: 8 },
  ],
  ambienti: [],
  stili: [],
  attacchi: [],
  wattaggi: [],
  colorTemps: [],
  tags: [],
  specs: [],
}

const technicalFacets: CatalogFiltersDTO = {
  totalMatching: 20,
  appliedFilters: {},
  worlds: [{ value: 'technical', label: 'Tecnico', count: 20 }],
  categories: [
    {
      slug: 'tecnico',
      name: 'Tecnico',
      parentSlug: null,
      count: 20,
      children: [
        { slug: 'led', name: 'LED', parentSlug: 'tecnico', count: 10, children: [] },
        { slug: 'alogene', name: 'Alogene', parentSlug: 'tecnico', count: 5, children: [] },
      ],
    },
  ],
  brands: [],
  tipologie: [],
  ambienti: [],
  stili: [],
  attacchi: [],
  wattaggi: [],
  colorTemps: [],
  tags: [],
  specs: [],
}

describe('isDesignCatalogHub', () => {
  it('è hub senza filtri tassonomia', () => {
    expect(isDesignCatalogHub()).toBe(true)
    expect(isDesignCatalogHub({ selectedCategorySlug: 'arredo' })).toBe(true)
  })

  it('non è hub con tipologia/ambiente/stile/categoria foglia/taxonomy path', () => {
    expect(isDesignCatalogHub({ selectedTipologia: 'tavolo' })).toBe(false)
    expect(isDesignCatalogHub({ selectedAmbiente: 'cucina' })).toBe(false)
    expect(isDesignCatalogHub({ selectedStile: 'moderno' })).toBe(false)
    expect(isDesignCatalogHub({ selectedCategorySlug: 'tavolo' })).toBe(false)
    expect(isDesignCatalogHub({ forcedTaxonomy: true })).toBe(false)
  })
})

describe('isTechnicalCatalogHub', () => {
  it('è hub senza categoria foglia né attacco', () => {
    expect(isTechnicalCatalogHub()).toBe(true)
    expect(isTechnicalCatalogHub({ selectedCategorySlug: 'tecnico' })).toBe(true)
  })

  it('non è hub con categoria foglia/attacco/taxonomy path', () => {
    expect(isTechnicalCatalogHub({ selectedCategorySlug: 'led' })).toBe(false)
    expect(isTechnicalCatalogHub({ selectedAttacco: 'GU10' })).toBe(false)
    expect(isTechnicalCatalogHub({ forcedTaxonomy: true })).toBe(false)
  })
})

describe('getCatalogTypeTiles', () => {
  it('restituisce le tipologiche navigabili sull’hub design', () => {
    const tiles = getCatalogTypeTiles(designFacets)
    expect(tiles.map((t) => t.key)).toEqual(['sospensione', 'tavolo', 'soffitto'])
    expect(tiles[0]).toMatchObject({ href: '/tipologia/sospensione', count: '38' })
  })

  it('nasconde le tile fuori hub (tipologia, stile, categoria foglia, taxonomy path)', () => {
    expect(getCatalogTypeTiles(designFacets, { selectedTipologia: 'tavolo' })).toEqual([])
    expect(getCatalogTypeTiles(designFacets, { selectedTipologia: 'Tavolo' })).toEqual([])
    expect(getCatalogTypeTiles(designFacets, { selectedStile: 'moderno' })).toEqual([])
    expect(getCatalogTypeTiles(designFacets, { selectedCategorySlug: 'sospensione' })).toEqual([])
    expect(getCatalogTypeTiles(designFacets, { forcedTaxonomy: true })).toEqual([])
  })

  it('mostra le tile se selectedTipologia è vuoto e categoria è radice', () => {
    expect(getCatalogTypeTiles(designFacets, { selectedTipologia: '  ' }).length).toBeGreaterThan(0)
    expect(getCatalogTypeTiles(designFacets, { selectedCategorySlug: 'arredo' }).length).toBeGreaterThan(0)
    expect(getCatalogTypeTiles(designFacets, {}).length).toBeGreaterThan(0)
  })
})

describe('getCatalogSubtypeChips', () => {
  it('restituisce chip sull’hub tecnico', () => {
    const chips = getCatalogSubtypeChips(undefined, technicalFacets)
    expect(chips.some((c) => c.label === 'LED')).toBe(true)
  })

  it('nasconde chip fuori hub', () => {
    expect(getCatalogSubtypeChips(undefined, technicalFacets, 'led')).toEqual([])
    expect(
      getCatalogSubtypeChips(undefined, technicalFacets, 'tecnico', { selectedAttacco: 'GU10' }),
    ).toEqual([])
    expect(
      getCatalogSubtypeChips(undefined, technicalFacets, undefined, { forcedTaxonomy: true }),
    ).toEqual([])
  })
})
