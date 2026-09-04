import { describe, expect, it } from 'vitest'
import {
  buildAllProductDimensionRows,
  collectDimensionSpecRows,
  isDimensionSpecLabel,
  isMeasureGalleryTag,
} from './product-specs-parse'

describe('collectDimensionSpecRows', () => {
  it('raccoglie tutte le misure disponibili ordinate', () => {
    const rows = collectDimensionSpecRows([
      { label: 'Diametro', value: '20 cm' },
      { label: 'Potenza', value: '60 W' },
      { label: 'Altezza', value: '45 cm' },
      { label: 'Larghezza', value: '30 cm' },
      { label: 'Profondità', value: '12 cm' },
      { label: 'Peso', value: '1.2 kg' },
    ])
    expect(rows.map((r) => r.label)).toEqual([
      'Larghezza',
      'Profondità',
      'Altezza',
      'Diametro',
      'Peso',
    ])
  })

  it('riconosce label e key dimensionali', () => {
    expect(isDimensionSpecLabel('Larghezza')).toBe(true)
    expect(isDimensionSpecLabel('Diametro')).toBe(true)
    expect(isDimensionSpecLabel('Custom', 'diameter_mm')).toBe(true)
    expect(isDimensionSpecLabel('Profondità')).toBe(true)
    expect(isDimensionSpecLabel('Materiali')).toBe(false)
    expect(isDimensionSpecLabel('Alternativo')).toBe(false)
  })
})

describe('buildAllProductDimensionRows', () => {
  it('unisce dimensions strutturate, peso, specs e attributo variante', () => {
    const rows = buildAllProductDimensionRows({
      dimensions: { lengthCm: 50, widthCm: 30, heightCm: 20 },
      weightKg: 2.5,
      specRows: [{ label: 'Diametro', value: '220 mm', key: 'diameter_mm' }],
      variantAttributes: [{ name: 'Dimensioni', value: '22 cm' }],
    })
    expect(rows.map((r) => `${r.label}:${r.value}`)).toEqual([
      'Dimensioni:22 cm',
      'Lunghezza:50 cm',
      'Larghezza:30 cm',
      'Altezza:20 cm',
      'Diametro:220 mm',
      'Peso:2.5 kg',
    ])
  })

  it('ignora attributo variante non-misura (Cluster)', () => {
    const rows = buildAllProductDimensionRows({
      variantAttributes: [{ name: 'Dimensioni', value: 'Cluster Circular' }],
      specRows: [{ label: 'Diametro', value: '400 mm', key: 'diameter_mm' }],
    })
    expect(rows.map((r) => r.label)).toEqual(['Diametro'])
  })

  it('include attributi variante nominati (Altezza, Larghezza)', () => {
    const rows = buildAllProductDimensionRows({
      variantAttributes: [
        { name: 'Altezza', value: '45 cm' },
        { name: 'Larghezza', value: '30 cm' },
        { name: 'Colore', value: 'Nero' },
      ],
      specRows: [{ label: 'Profondità', value: '12 cm', key: 'depth_mm' }],
    })
    expect(rows.map((r) => r.label)).toEqual(['Larghezza', 'Profondità', 'Altezza'])
  })
})

describe('isMeasureGalleryTag', () => {
  it('riconosce i tag gallery Odoo dello schema dimensioni', () => {
    expect(isMeasureGalleryTag('dimensioni')).toBe(true)
    expect(isMeasureGalleryTag('Dimensioni')).toBe(true)
    expect(isMeasureGalleryTag('  DIMENSIONI  ')).toBe(true)
    expect(isMeasureGalleryTag('misure')).toBe(true)
    expect(isMeasureGalleryTag('misura')).toBe(true)
    expect(isMeasureGalleryTag('dimensions')).toBe(true)
    expect(isMeasureGalleryTag('foto')).toBe(false)
    expect(isMeasureGalleryTag('attacco')).toBe(false)
    expect(isMeasureGalleryTag(null)).toBe(false)
    expect(isMeasureGalleryTag(undefined)).toBe(false)
  })
})
