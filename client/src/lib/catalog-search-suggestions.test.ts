import { describe, expect, it } from 'vitest'
import {
  buildCatalogSubmitPath,
  searchLocalCatalogSuggestions,
} from './catalog-search-suggestions'

describe('searchLocalCatalogSuggestions', () => {
  it('non restituisce risultati sotto 2 caratteri', () => {
    expect(searchLocalCatalogSuggestions('G', {})).toEqual([])
  })

  it('mappa linguaggio naturale su attacco E27', () => {
    const groups = searchLocalCatalogSuggestions('vite grande', {})
    const attacchi = groups.find((g) => g.kind === 'attacco')?.items ?? []
    expect(attacchi.some((item) => item.label.includes('E27'))).toBe(true)
    expect(attacchi[0]?.path).toContain('attacco=E27')
  })

  it('filtra marchi per nome', () => {
    const groups = searchLocalCatalogSuggestions('osr', {
      brands: [{ slug: 'osram', name: 'OSRAM' }],
    })
    const brands = groups.find((g) => g.kind === 'brand')?.items ?? []
    expect(brands).toHaveLength(1)
    expect(brands[0]?.path).toBe('/negozio?brand=osram')
  })
})

describe('buildCatalogSubmitPath', () => {
  it('costruisce URL catalogo tecnico con attacco GU10', () => {
    expect(buildCatalogSubmitPath('GU10', { world: 'technical' })).toBe(
      '/negozio?world=technical&attacco=GU10',
    )
  })

  it('preserva filtri attivi nel submit', () => {
    expect(
      buildCatalogSubmitPath('lampadina', {
        world: 'technical',
        attacco: 'E27',
        colorTemp: '3000K',
      }),
    ).toBe('/negozio?world=technical&attacco=E27&colorTemp=3000K&q=lampadina')
  })

  it('tronca query troppo lunga nel path', () => {
    const path = buildCatalogSubmitPath('a'.repeat(200))
    const q = new URLSearchParams(path.split('?')[1]).get('q')
    expect(q?.length).toBe(120)
  })
})
