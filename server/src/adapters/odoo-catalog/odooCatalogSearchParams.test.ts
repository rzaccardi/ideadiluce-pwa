import { describe, expect, it } from 'vitest'
import {
  normalizeOdooCatalogFilters,
  toOdooCatalogQueryParams,
} from './odooCatalogSearchParams.js'

describe('normalizeOdooCatalogFilters', () => {
  it('mappa illuminazione-tecnica → category tecnico (senza world)', () => {
    expect(normalizeOdooCatalogFilters({ category: 'illuminazione-tecnica' })).toEqual({
      category: 'tecnico',
      world: undefined,
    })
  })

  it('mappa prodotti-tecnici e arredo legacy', () => {
    expect(normalizeOdooCatalogFilters({ category: 'prodotti-tecnici' })).toMatchObject({
      category: 'tecnico',
    })
    expect(normalizeOdooCatalogFilters({ category: 'illuminazione-arredo' })).toMatchObject({
      category: 'arredo',
    })
  })

  it('converte world esplicito in category root', () => {
    expect(normalizeOdooCatalogFilters({ world: 'technical' })).toMatchObject({
      category: 'tecnico',
      world: undefined,
    })
    expect(normalizeOdooCatalogFilters({ world: 'design' })).toMatchObject({
      category: 'arredo',
      world: undefined,
    })
  })

  it('non sovrascrive category con world', () => {
    expect(
      normalizeOdooCatalogFilters({ category: 'fluorescente', world: 'technical' }),
    ).toMatchObject({ category: 'fluorescente', world: undefined })
  })

  it('ignora world non valido', () => {
    expect(normalizeOdooCatalogFilters({ world: 'foo' as 'design' }).category).toBeUndefined()
  })
})

describe('toOdooCatalogQueryParams', () => {
  it('include paginazione e sort per search; world → category', () => {
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
      category: 'tecnico',
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
      category: 'tecnico',
      attacco: 'G4',
    })
  })

  it('inoltra q, brand, wattaggio, color_temp, tag, ambiente', () => {
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
          ambiente: 'soggiorno',
          tipologia: 'tavolo',
          stile: 'design',
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
      category: 'tecnico',
      ambiente: 'soggiorno',
      tipologia: 'tavolo',
      stile: 'design',
    })
  })

  it('clamp per_page a max 100', () => {
    expect(
      toOdooCatalogQueryParams({ per_page: 500, page: 1 }, { includePagination: true }),
    ).toMatchObject({ per_page: '100', page: '1' })
  })
})
