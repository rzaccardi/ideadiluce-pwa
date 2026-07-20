import { describe, expect, it } from 'vitest'
import type { CatalogFiltersDTO } from '@/types/dto'
import {
  buildDesignTypeTilesFromFacets,
  buildLandingFilterGroupsFromFacets,
  buildTechnicalSubtypeChipsFromFacets,
  facetAttaccoOptions,
  facetCategoryOptions,
  facetColorTempOptions,
  facetTaxonomyOptions,
  landingAttaccoValueToCode,
  landingKelvinValueToCode,
} from './catalog-facets-ui'

const facetsFixture: CatalogFiltersDTO = {
  totalMatching: 683,
  appliedFilters: {},
  worlds: [{ value: 'technical', label: 'Tecnici', count: 683 }],
  categories: [
    {
      slug: 'tecnico',
      name: 'Tecnico',
      parentSlug: null,
      count: 683,
      children: [
        {
          slug: 'led',
          name: 'LED',
          parentSlug: 'tecnico',
          count: 80,
          children: [{ slug: 'strip', name: 'Strip', parentSlug: 'led', count: 6, children: [] }],
        },
        { slug: 'alogene', name: 'Alogene', parentSlug: 'tecnico', count: 79, children: [] },
      ],
    },
  ],
  brands: [{ slug: 'osram', name: 'OSRAM', count: 8 }],
  tipologie: [],
  ambienti: [],
  stili: [],
  attacchi: [
    { value: 'g5', label: 'G5', count: 91 },
    { value: 'gu5_3', label: 'GU5.3', count: 21 },
  ],
  wattaggi: [{ value: '20.0', label: '20 W', count: 4 }],
  colorTemps: [
    { value: '3000', label: '3000 K', count: 189 },
    { value: '0', label: '0 K', count: 11 },
  ],
  tags: [{ value: 'dimmerabile', label: 'Dimmerabile', count: 9 }],
  specs: [],
}

describe('catalog-facets-ui', () => {
  it('popola attacco/kelvin da facet e ignora Kelvin 0', () => {
    expect(facetAttaccoOptions(facetsFixture)[0]).toMatchObject({ label: 'G5', count: 91 })
    expect(facetColorTempOptions(facetsFixture).map((o) => o.value)).toEqual(['3000K'])
  })

  it('promuove figli di tecnico come categorie sidebar', () => {
    const { roots, children } = facetCategoryOptions(facetsFixture)
    expect(roots.map((r) => r.slug)).toEqual(['led', 'alogene'])
    expect(children.map((c) => c.slug)).toEqual(['strip'])
  })

  it('costruisce chip tecnici da categorie Odoo', () => {
    const chips = buildTechnicalSubtypeChipsFromFacets(facetsFixture, { catalogMode: true })
    expect(chips[0]?.label).toBe('Tutti')
    expect(chips.some((c) => c.label === 'LED' && c.href?.includes('category=led'))).toBe(true)
  })

  it('costruisce tile design da tipologie verso /tipologia', () => {
    const designFacets: CatalogFiltersDTO = {
      ...facetsFixture,
      totalMatching: 1,
      categories: [
        {
          slug: 'arredo',
          name: 'Arredo',
          parentSlug: null,
          count: 1,
          children: [{ slug: 'tavolo', name: 'Tavolo', parentSlug: 'arredo', count: 1, children: [] }],
        },
      ],
      tipologie: [{ value: 'tavolo', label: 'Tavolo', count: 1 }],
      attacchi: [],
      wattaggi: [],
      colorTemps: [],
      tags: [],
    }
    const tiles = buildDesignTypeTilesFromFacets(designFacets, [])
    expect(tiles[0]).toMatchObject({ key: 'tavolo', label: 'Tavolo', href: '/tipologia/tavolo' })
  })

  it('mappa ambienti facet value/label/count per search', () => {
    const options = facetTaxonomyOptions(
      {
        ...facetsFixture,
        ambienti: [
          { value: 'soggiorno', label: 'Soggiorno', count: 4 },
          { value: 'cucina', label: 'Cucina', count: 0 },
        ],
      },
      'ambienti',
    )
    expect(options).toEqual([{ value: 'soggiorno', label: 'Soggiorno', count: 4 }])
  })

  it('costruisce gruppi landing tecnici da facet', () => {
    const groups = buildLandingFilterGroupsFromFacets('technical', facetsFixture, [])
    const labels = groups.map((g) => g.label)
    expect(labels).toContain('Attacco')
    expect(labels).toContain('Kelvin')
    expect(labels).not.toContain('Wattaggio')
    expect(labels).toContain('Brand')
    expect(labels).toContain('Categoria')
    expect(groups.find((g) => g.label === 'Attacco')?.options[0]?.value).toBe('attacco-g5')
    expect(groups.find((g) => g.label === 'Categoria')?.options.map((o) => o.value)).toContain(
      'category-led',
    )
  })

  it('risolve codici da value landing dinamici', () => {
    expect(landingAttaccoValueToCode('attacco-g4')).toBe('G4')
    expect(landingAttaccoValueToCode('attacco-gu5.3')).toBe('GU5.3')
    expect(landingAttaccoValueToCode('attacco-gu5_3')).toBe('GU5.3')
    expect(landingKelvinValueToCode('kelvin-3000k')).toBe('3000K')
  })

  it('senza facet non inventa attacchi statici se payload vuoto', () => {
    expect(facetAttaccoOptions({ ...facetsFixture, attacchi: [] })).toEqual([])
  })
})
