import { describe, expect, it } from 'vitest'
import type { CatalogFiltersDTO, ProductCardDTO } from '@/types/dto'
import {
  buildCatalogApiQuery,
  buildDesignerProjectsHref,
  filterBrandsForCatalogWorld,
  filterCategoryDtosByWorld,
  filterProductsBySpec,
  productMatchesSpecFilter,
  resolveCatalogWorldFromPath,
  resolveEffectiveCatalogCategory,
  scopeCatalogFacetsToWorld,
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

describe('buildDesignerProjectsHref', () => {
  it('punta al listing arredo con q sul nome designer', () => {
    expect(buildDesignerProjectsHref('Michele De Lucchi')).toBe(
      '/negozio?world=design&q=Michele%20De%20Lucchi',
    )
  })

  it('nasconde il link se il nome manca o è un placeholder', () => {
    expect(buildDesignerProjectsHref(null)).toBeNull()
    expect(buildDesignerProjectsHref('  ')).toBeNull()
    expect(buildDesignerProjectsHref('n/a')).toBeNull()
    expect(buildDesignerProjectsHref('—')).toBeNull()
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

describe('filterBrandsForCatalogWorld', () => {
  const brands = [
    { slug: 'artemide', name: 'Artemide', worlds: ['design'] as const },
    { slug: 'osram', name: 'OSRAM', worlds: ['technical'] as const },
    { slug: 'philips', name: 'PHILIPS', worlds: ['design', 'technical'] as const },
  ]

  it('in arredo mostra solo i brand con prodotti arredo', () => {
    expect(filterBrandsForCatalogWorld(brands, 'design').map((b) => b.slug)).toEqual([
      'artemide',
      'philips',
    ])
  })

  it('in tecnica mostra solo i brand con prodotti tecnici', () => {
    expect(filterBrandsForCatalogWorld(brands, 'technical').map((b) => b.slug)).toEqual([
      'osram',
      'philips',
    ])
  })
})

describe('scope catalog worlds', () => {
  const mixedFacets: CatalogFiltersDTO = {
    totalMatching: 10,
    appliedFilters: {},
    worlds: [],
    categories: [
      {
        slug: 'arredo',
        name: 'Arredo',
        parentSlug: null,
        count: 4,
        children: [{ slug: 'tavolo', name: 'Tavolo', parentSlug: 'arredo', count: 2, children: [] }],
      },
      {
        slug: 'tecnico',
        name: 'Tecnico',
        parentSlug: null,
        count: 6,
        children: [{ slug: 'led', name: 'LED', parentSlug: 'tecnico', count: 3, children: [] }],
      },
    ],
    brands: [
      { slug: 'artemide', name: 'Artemide', count: 2 },
      { slug: 'osram', name: 'OSRAM', count: 5 },
    ],
    tipologie: [{ value: 'tavolo', label: 'Tavolo', count: 2 }],
    ambienti: [{ value: 'soggiorno', label: 'Soggiorno', count: 1 }],
    stili: [{ value: 'moderno', label: 'Moderno', count: 1 }],
    attacchi: [{ value: 'gu10', label: 'GU10', count: 3 }],
    wattaggi: [{ value: '10', label: '10 W', count: 2 }],
    colorTemps: [{ value: '3000', label: '3000 K', count: 2 }],
    tags: [],
    specs: [],
  }

  it('nasconde categorie e facet tecnici in arredo', () => {
    const scoped = scopeCatalogFacetsToWorld(mixedFacets, 'design', [
      { slug: 'artemide', worlds: ['design'] },
      { slug: 'osram', worlds: ['technical'] },
    ])
    expect(scoped?.categories.map((c) => c.slug)).toEqual(['arredo'])
    expect(scoped?.brands.map((b) => b.slug)).toEqual(['artemide'])
    expect(scoped?.attacchi).toEqual([])
    expect(scoped?.wattaggi).toEqual([])
    expect(scoped?.colorTemps).toEqual([])
    expect(scoped?.tipologie).toHaveLength(1)
  })

  it('nasconde categorie e facet arredo in tecnica', () => {
    const scoped = scopeCatalogFacetsToWorld(mixedFacets, 'technical')
    expect(scoped?.categories.map((c) => c.slug)).toEqual(['tecnico'])
    expect(scoped?.tipologie).toEqual([])
    expect(scoped?.ambienti).toEqual([])
    expect(scoped?.stili).toEqual([])
    expect(scoped?.attacchi).toHaveLength(1)
  })

  it('filtra CategoryDTO per mondo tramite radice', () => {
    const categories = [
      { id: '1', slug: 'arredo', name: 'Arredo', parentId: null },
      { id: '2', slug: 'tavolo', name: 'Tavolo', parentId: '1' },
      { id: '3', slug: 'tecnico', name: 'Tecnico', parentId: null },
      { id: '4', slug: 'led', name: 'LED', parentId: '3' },
    ]
    expect(filterCategoryDtosByWorld(categories, 'design').map((c) => c.slug)).toEqual([
      'arredo',
      'tavolo',
    ])
    expect(filterCategoryDtosByWorld(categories, 'technical').map((c) => c.slug)).toEqual([
      'tecnico',
      'led',
    ])
  })

  it('risolve il mondo dal path di area', () => {
    expect(resolveCatalogWorldFromPath('/categoria-prodotto/illuminazione-arredo')).toBe('design')
    expect(resolveCatalogWorldFromPath('/en/tipologia/sospensione')).toBe('design')
    expect(resolveCatalogWorldFromPath('/categoria-prodotto/illuminazione-tecnica')).toBe(
      'technical',
    )
    expect(resolveCatalogWorldFromPath('/attacco/gu10')).toBe('technical')
    expect(resolveCatalogWorldFromPath('/negozio', new URLSearchParams('world=design'))).toBe(
      'design',
    )
    expect(resolveCatalogWorldFromPath('/negozio')).toBe('all')
  })
})
