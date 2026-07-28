import { describe, expect, it } from 'vitest'
import {
  mergeDesignSpecRows,
  mergeProductAndVariantSpecs,
  pickDesignHeroMeta,
  specsToRows,
} from './product-specs-parse'

describe('mergeDesignSpecRows', () => {
  it('mantiene le specs canoniche e appende quelle Odoo non in whitelist', () => {
    const merged = mergeDesignSpecRows(
      specsToRows([
        { key: 'designer', label: 'Designer', display: 'Ernesto Gismondi' },
        { key: 'wattage', label: 'Wattaggio', display: '21W' },
        { key: 'material_main', label: 'Materiale principale', display: 'Alluminio' },
        { key: 'socket_type', label: 'Attacco', display: 'LED' },
        { key: 'custom_foo', label: 'Campo custom Odoo', display: 'Sì' },
        { key: 'diameter_mm', label: 'Diametro', display: '220 mm' },
      ]),
    )

    const withValues = merged.filter((r) => r.value?.trim())
    expect(withValues.map((r) => r.label)).toEqual(
      expect.arrayContaining([
        'Designer',
        'Wattaggio',
        'Materiale principale',
        'Attacco',
        'Campo custom Odoo',
        'Diametro',
      ]),
    )
    expect(withValues.find((r) => r.label === 'Campo custom Odoo')?.value).toBe('Sì')
  })

  it('riconosce alias Odoo (Anno di design, Materiale principale)', () => {
    const merged = mergeDesignSpecRows(
      specsToRows([
        { key: 'design_year', label: 'Anno di design', display: '2017' },
        { key: 'style', label: 'Stile', display: 'Contemporaneo' },
      ]),
    )
    expect(merged.find((r) => r.value === '2017')?.label).toBe('Anno di design')
    expect(pickDesignHeroMeta(merged).map((m) => m.value)).toEqual(
      expect.arrayContaining(['2017', 'Contemporaneo']),
    )
  })
})

describe('mergeProductAndVariantSpecs', () => {
  it('non perde le specs template quando la variante ha solo misure', () => {
    const rows = mergeProductAndVariantSpecs({
      productSpecs: [
        { key: 'designer', label: 'Designer', display: 'Michele De Lucchi' },
        { key: 'wattage', label: 'Wattaggio', display: '18W' },
      ],
      variantSpecs: [{ key: 'diameter_mm', label: 'Diametro', display: '30 cm' }],
    })
    expect(rows.map((r) => r.label).sort()).toEqual(['Designer', 'Diametro', 'Wattaggio'])
  })

  it('la variante sovrascrive la stessa key del template', () => {
    const rows = mergeProductAndVariantSpecs({
      productSpecs: [{ key: 'wattage', label: 'Wattaggio', display: '10W' }],
      variantSpecs: [{ key: 'wattage', label: 'Wattaggio', display: '21W' }],
    })
    expect(rows).toEqual([{ label: 'Wattaggio', value: '21W', key: 'wattage' }])
  })
})
