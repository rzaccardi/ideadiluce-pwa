import { describe, expect, it } from 'vitest'
import type { OdooCatalogFiltersResponse } from '../../adapters/odoo-catalog/odooCatalog.types.js'
import { mapOdooCatalogFiltersResponse } from './catalog-odoo-search.service.js'

const fixture: OdooCatalogFiltersResponse = {
  website: { id: 2, name: 'PWA' },
  lang: 'it_IT',
  total_matching: 13,
  applied_filters: { world: 'technical', attacco: ['G4'] },
  worlds: [
    { value: 'design', label: 'Arredo', count: 0 },
    { value: 'technical', label: 'Tecnici', count: 13 },
  ],
  categories: [
    {
      slug: 'tecnico',
      name: 'Tecnico',
      parent_slug: null,
      count: 13,
      children: [
        {
          slug: 'alogene',
          name: 'Alogene',
          parent_slug: 'tecnico',
          count: 13,
          children: [],
        },
      ],
    },
  ],
  brands: [{ slug: 'osram', name: 'OSRAM', count: 8 }],
  tipologie: [],
  ambienti: [],
  stili: [],
  attacchi: [{ value: 'g4', label: 'G4', count: 13 }],
  wattaggi: [{ value: '20', label: '20 W', count: 4 }],
  color_temps: [{ value: '3000', label: '3000 K', count: 4 }],
  tags: [{ value: 'dimmerabile', label: 'Dimmerabile', count: 9 }],
  specs: [
    {
      key: 'socket_type',
      label: 'Attacco',
      unit: '',
      values: [{ value: 'g4', label: 'G4', count: 13 }],
    },
  ],
}

describe('mapOdooCatalogFiltersResponse', () => {
  it('mappa facet Odoo → DTO camelCase BFF', () => {
    const dto = mapOdooCatalogFiltersResponse(fixture)

    expect(dto.totalMatching).toBe(13)
    expect(dto.appliedFilters).toEqual({ world: 'technical', attacco: ['G4'] })
    expect(dto.worlds).toHaveLength(2)
    expect(dto.worlds[1]).toEqual({ value: 'technical', label: 'Tecnici', count: 13 })
    expect(dto.categories[0]?.slug).toBe('tecnico')
    expect(dto.categories[0]?.parentSlug).toBeNull()
    expect(dto.categories[0]?.children[0]).toMatchObject({
      slug: 'alogene',
      parentSlug: 'tecnico',
      count: 13,
    })
    expect(dto.brands[0]).toEqual({ slug: 'osram', name: 'OSRAM', count: 8 })
    expect(dto.attacchi[0]).toEqual({ value: 'g4', label: 'G4', count: 13 })
    expect(dto.wattaggi[0]).toEqual({ value: '20', label: '20 W', count: 4 })
    expect(dto.colorTemps[0]).toEqual({ value: '3000', label: '3000 K', count: 4 })
    expect(dto.tags[0]?.value).toBe('dimmerabile')
    expect(dto.specs[0]?.key).toBe('socket_type')
    expect(dto.specs[0]?.values[0]).toEqual({ value: 'g4', label: 'G4', count: 13 })
  })

  it('tollera payload minimo senza array opzionali', () => {
    const dto = mapOdooCatalogFiltersResponse({
      website: { id: 2, name: 'PWA' },
      lang: 'it_IT',
      total_matching: 0,
    } as OdooCatalogFiltersResponse)

    expect(dto.totalMatching).toBe(0)
    expect(dto.appliedFilters).toEqual({})
    expect(dto.worlds).toEqual([])
    expect(dto.categories).toEqual([])
    expect(dto.attacchi).toEqual([])
    expect(dto.colorTemps).toEqual([])
    expect(dto.specs).toEqual([])
  })
})
