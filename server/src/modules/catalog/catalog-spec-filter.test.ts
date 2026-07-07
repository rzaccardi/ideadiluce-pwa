import { describe, expect, it } from 'vitest'
import {
  productMatchesCatalogTextQuery,
  productMatchesSpecFilter,
  sanitizeAttaccoParam,
  sanitizeColorTempParam,
} from './catalog-spec-filter.js'

describe('catalog-spec-filter', () => {
  it('sanitizza attacco GU10', () => {
    expect(sanitizeAttaccoParam('GU10')).toBe('GU10')
    expect(sanitizeAttaccoParam('gu5-3')).toBe('GU5.3')
  })

  it('sanitizza Kelvin', () => {
    expect(sanitizeColorTempParam('3000K')).toBe('3000K')
    expect(sanitizeColorTempParam('2700')).toBe('2700K')
  })

  it('match attacco su titolo prodotto', () => {
    expect(
      productMatchesSpecFilter(
        { name: 'Lampada LED Dicro 6W 3000K GU10 Aigostar', specTags: undefined, shortDescription: null },
        { attacco: 'GU10' },
      ),
    ).toBe(true)
  })

  it('esclude prodotti senza attacco richiesto', () => {
    expect(
      productMatchesSpecFilter(
        { name: 'Lampada E27 60W', specTags: ['E27'], shortDescription: null },
        { attacco: 'GU10' },
      ),
    ).toBe(false)
  })

  it('filtra query testuale per token', () => {
    expect(
      productMatchesCatalogTextQuery(
        { name: 'Lampadina LED GU10 5W', shortDescription: null, sku: null, specTags: undefined },
        'lampadina gu10',
      ),
    ).toBe(true)
    expect(
      productMatchesCatalogTextQuery(
        { name: 'Driver 350mA', shortDescription: null, sku: null, specTags: undefined },
        'lampadina gu10',
      ),
    ).toBe(false)
  })
})
