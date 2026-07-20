import { describe, expect, it } from 'vitest'
import type { OdooCatalogSpec } from '../../adapters/odoo-catalog/odooCatalog.types.js'
import {
  productMatchesCatalogTextQuery,
  productMatchesSpecFilter,
  sanitizeAttaccoParam,
  sanitizeColorTempParam,
} from './catalog-spec-filter.js'

const g4Specs: OdooCatalogSpec[] = [
  {
    key: 'socket_type',
    label: 'Attacco',
    unit: '',
    value_type: 'selection',
    cardinality: 'single',
    value: 'g4',
    display: 'G4',
  },
  {
    key: 'color_temperature_k',
    label: 'Temperatura colore',
    unit: 'K',
    value_type: 'integer',
    cardinality: 'single',
    value: 3000,
    display: '3000 K',
  },
]

describe('catalog-spec-filter', () => {
  it('sanitizza attacco GU10', () => {
    expect(sanitizeAttaccoParam('GU10')).toBe('GU10')
    expect(sanitizeAttaccoParam('gu5-3')).toBe('GU5.3')
  })

  it('sanitizza Kelvin', () => {
    expect(sanitizeColorTempParam('3000K')).toBe('3000K')
    expect(sanitizeColorTempParam('2700')).toBe('2700K')
  })

  it('match attacco su specs tipizzate (value g4 / display G4)', () => {
    expect(
      productMatchesSpecFilter(
        { name: 'Prodotto senza attacco nel titolo', shortDescription: null, specs: g4Specs },
        { attacco: 'G4' },
      ),
    ).toBe(true)
  })

  it('match Kelvin su specs tipizzate', () => {
    expect(
      productMatchesSpecFilter(
        { name: 'Prodotto', shortDescription: null, specs: g4Specs },
        { colorTemp: '3000K' },
      ),
    ).toBe(true)
    expect(
      productMatchesSpecFilter(
        { name: 'Prodotto', shortDescription: null, specs: g4Specs },
        { colorTemp: '4000K' },
      ),
    ).toBe(false)
  })

  it('esclude prodotti con socket_type diverso', () => {
    expect(
      productMatchesSpecFilter(
        {
          name: 'Lampada',
          shortDescription: null,
          specs: [
            {
              key: 'socket_type',
              label: 'Attacco',
              unit: '',
              value_type: 'selection',
              cardinality: 'single',
              value: 'e27',
              display: 'E27',
            },
          ],
        },
        { attacco: 'GU10' },
      ),
    ).toBe(false)
  })

  it('fallback testuale se specs assenti', () => {
    expect(
      productMatchesSpecFilter(
        { name: 'Lampada LED Dicro 6W 3000K GU10 Aigostar', specTags: undefined, shortDescription: null },
        { attacco: 'GU10' },
      ),
    ).toBe(true)
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
