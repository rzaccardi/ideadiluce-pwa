import { describe, expect, it } from 'vitest'
import {
  buildPaletteDisplayGroups,
  catalogSearchPaletteView,
  clampSearchActiveIndex,
  nextSearchActiveIndex,
  suggestionOptionId,
} from './catalog-search-palette'

const groups = [
  {
    kind: 'brand' as const,
    items: [{ id: 'brand:osram', kind: 'brand' as const, label: 'OSRAM', path: '/brand/osram' }],
  },
]

const recentGroup = {
  kind: 'query' as const,
  items: [{ id: 'recent:GU10', kind: 'query' as const, label: 'GU10', path: '/negozio?q=GU10' }],
}

describe('buildPaletteDisplayGroups', () => {
  it('unisce recenti e gruppi in idle', () => {
    expect(buildPaletteDisplayGroups({ showIdle: true, recentGroup, groups })).toHaveLength(2)
  })

  it('in ricerca attiva mostra solo i gruppi live', () => {
    expect(buildPaletteDisplayGroups({ showIdle: false, recentGroup, groups })).toEqual(groups)
  })
})

describe('clampSearchActiveIndex', () => {
  it('resta -1 senza risultati', () => {
    expect(clampSearchActiveIndex(2, 0)).toBe(-1)
  })

  it('limita agli estremi della lista', () => {
    expect(clampSearchActiveIndex(5, 3)).toBe(2)
    expect(clampSearchActiveIndex(-2, 3)).toBe(0)
  })
})

describe('nextSearchActiveIndex', () => {
  it('avanza e torna indietro tra le opzioni con wrap', () => {
    expect(nextSearchActiveIndex(-1, 4, 'down')).toBe(0)
    expect(nextSearchActiveIndex(0, 4, 'down')).toBe(1)
    expect(nextSearchActiveIndex(0, 4, 'up')).toBe(3)
    expect(nextSearchActiveIndex(3, 4, 'down')).toBe(0)
  })
})

describe('suggestionOptionId', () => {
  it('genera id stabili per aria-activedescendant', () => {
    expect(suggestionOptionId('list-1', 'product:faretto')).toBe('list-1-option-product:faretto')
  })
})

describe('catalogSearchPaletteView', () => {
  it('resta idle sotto la lunghezza minima', () => {
    expect(
      catalogSearchPaletteView({ queryLength: 1, minLength: 2, loading: false, hasResults: false }),
    ).toBe('idle')
  })

  it('mostra skeleton mentre la ricerca è in corso anche senza risultati', () => {
    expect(
      catalogSearchPaletteView({ queryLength: 4, minLength: 2, loading: true, hasResults: false }),
    ).toBe('pending')
  })

  it('resta in skeleton prima della chiamata prodotti', () => {
    expect(
      catalogSearchPaletteView({
        queryLength: 2,
        minLength: 2,
        minApiLength: 3,
        loading: false,
        hasResults: false,
      }),
    ).toBe('pending')
  })

  it('mostra vuoto solo a ricerca conclusa senza risultati', () => {
    expect(
      catalogSearchPaletteView({
        queryLength: 4,
        minLength: 2,
        minApiLength: 3,
        loading: false,
        hasResults: false,
        currentQuery: 'Lampada da tavo',
        resultsQuery: 'Lampada da tavo',
      }),
    ).toBe('empty')
  })

  it('resta in skeleton se i risultati appartengono a una query precedente', () => {
    expect(
      catalogSearchPaletteView({
        queryLength: 16,
        minLength: 2,
        minApiLength: 3,
        loading: false,
        hasResults: false,
        currentQuery: 'Lampada da tavol',
        resultsQuery: 'Lampada da tavo',
      }),
    ).toBe('pending')
  })

  it('resta in skeleton finché la query corrente non ha una risposta', () => {
    expect(
      catalogSearchPaletteView({
        queryLength: 16,
        minLength: 2,
        minApiLength: 3,
        loading: false,
        hasResults: false,
        currentQuery: 'Lampada da tavo',
        resultsQuery: null,
      }),
    ).toBe('pending')
  })

  it('mostra i risultati quando sono arrivati', () => {
    expect(
      catalogSearchPaletteView({ queryLength: 4, minLength: 2, loading: false, hasResults: true }),
    ).toBe('results')
  })
})
