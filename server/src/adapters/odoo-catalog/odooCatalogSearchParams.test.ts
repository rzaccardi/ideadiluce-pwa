import { describe, expect, it } from 'vitest'
import {
  normalizeOdooCatalogFilters,
  toOdooCatalogQueryParams,
} from './odooCatalogSearchParams.js'

describe('normalizeOdooCatalogFilters', () => {
  it('mappa illuminazione-tecnica → world technical + category tecnico', () => {
    expect(normalizeOdooCatalogFilters({ category: 'illuminazione-tecnica' })).toEqual({
      category: 'tecnico',
      world: 'technical',
    })
  })

  it('mappa prodotti-tecnici e arredo legacy', () => {
    expect(normalizeOdooCatalogFilters({ category: 'prodotti-tecnici' })).toMatchObject({
      category: 'tecnico',
      world: 'technical',
    })
    expect(normalizeOdooCatalogFilters({ category: 'illuminazione-arredo' })).toMatchObject({
      category: 'arredo',
      world: 'design',
    })
  })

  it('rispetta world esplicito', () => {
    expect(
      normalizeOdooCatalogFilters({ category: 'fluorescente', world: 'technical' }),
    ).toMatchObject({ category: 'fluorescente', world: 'technical' })
  })

  it('ignora world non valido', () => {
    expect(normalizeOdooCatalogFilters({ world: 'foo' as 'design' }).world).toBeUndefined()
  })
})

describe('toOdooCatalogQueryParams', () => {
  it('include paginazione e sort per search', () => {
    expect(
      toOdooCatalogQueryParams(
        {
          world: 'technical',
          attacco: 'G4',
          page: 2,
          per_page: 24,
          sort: 'price_asc',
        },
        { includePagination: true },
      ),
    ).toEqual({
      world: 'technical',
      attacco: 'G4',
      page: '2',
      per_page: '24',
      sort: 'price_asc',
    })
  })

  it('esclude paginazione per filters', () => {
    expect(
      toOdooCatalogQueryParams(
        { world: 'technical', attacco: 'G4', page: 2, sort: 'relevance' },
        { includePagination: false },
      ),
    ).toEqual({
      world: 'technical',
      attacco: 'G4',
    })
  })

  it('inoltra q, brand, wattaggio, color_temp, tag', () => {
    expect(
      toOdooCatalogQueryParams(
        {
          q: 'led',
          brand: 'osram,tlb',
          wattaggio: 20,
          wattaggio_min: 10,
          wattaggio_max: 40,
          color_temp: '3000K',
          tag: 'dimmerabile,t5',
          category: 'illuminazione-tecnica',
        },
        { includePagination: false },
      ),
    ).toEqual({
      q: 'led',
      brand: 'osram,tlb',
      wattaggio: '20',
      wattaggio_min: '10',
      wattaggio_max: '40',
      color_temp: '3000K',
      tag: 'dimmerabile,t5',
      world: 'technical',
      category: 'tecnico',
    })
  })

  it('clamp per_page a max 100', () => {
    expect(
      toOdooCatalogQueryParams({ per_page: 500, page: 1 }, { includePagination: true }),
    ).toMatchObject({ per_page: '100', page: '1' })
  })
})
