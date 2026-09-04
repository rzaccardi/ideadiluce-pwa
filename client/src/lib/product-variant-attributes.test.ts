import { describe, expect, it } from 'vitest'
import {
  attributeNames,
  getMatrixValueState,
  htmlColorForAttributeValue,
  isSwatchAttribute,
  pickVariantForAttribute,
  subgroupAttributeValues,
  uniqueValuesForAttr,
} from './product-variant-attributes'
import type { ProductVariantDTO } from '@/types/dto'
import { odooCatalogImageUrlsMatch } from './odoo-catalog/media'

function v(
  ref: string,
  attrs: Array<{ name: string; value: string }>,
): ProductVariantDTO {
  return {
    ref,
    label: attrs.map((a) => a.value).join(' · '),
    imageUrl: null,
    attributes: attrs,
  }
}

describe('product-variant-attributes', () => {
  const tolomeo = [
    v('1', [
      { name: 'Colore', value: 'Alluminio' },
      { name: 'Versione', value: 'Tavolo' },
    ]),
    v('2', [
      { name: 'Colore', value: 'Alluminio' },
      { name: 'Versione', value: 'Terra' },
    ]),
    v('3', [
      { name: 'Colore', value: 'Nero' },
      { name: 'Versione', value: 'Tavolo' },
    ]),
    v('4', [
      { name: 'Colore', value: 'Nero' },
      { name: 'Versione', value: 'Terra' },
    ]),
  ]

  it('espone assi Colore e Versione separati', () => {
    expect(attributeNames(tolomeo)).toEqual(['Colore', 'Versione'])
    expect(uniqueValuesForAttr(tolomeo, 'Colore')).toEqual(['Alluminio', 'Nero'])
    expect(uniqueValuesForAttr(tolomeo, 'Versione')).toEqual(['Tavolo', 'Terra'])
  })

  it('distingue swatch colore da chip versione', () => {
    expect(isSwatchAttribute('Colore')).toBe(true)
    expect(isSwatchAttribute('Finitura')).toBe(true)
    expect(isSwatchAttribute('Versione')).toBe(false)
    expect(isSwatchAttribute('Colore luce')).toBe(false)
  })

  it('usa htmlColor Odoo del valore, senza fallback su un altro colore', () => {
    const colored = [
      {
        ...v('1', [{ name: 'Colore', value: 'Nero' }]),
        attributes: [{ name: 'Colore', value: 'Nero', htmlColor: '#1f1c17' }],
      },
      {
        ...v('2', [{ name: 'Colore', value: 'Oro champagne' }]),
        attributes: [{ name: 'Colore', value: 'Oro champagne', htmlColor: '#d4b896' }],
      },
      v('3', [{ name: 'Colore', value: 'Speciale' }]),
    ]
    expect(htmlColorForAttributeValue(colored, 'Colore', 'Nero')).toBe('#1f1c17')
    expect(htmlColorForAttributeValue(colored, 'Colore', 'Oro champagne')).toBe('#d4b896')
    expect(htmlColorForAttributeValue(colored, 'Colore', 'Speciale')).toBeNull()
  })

  it('cambia un asse tenendo l’altro (match esatto)', () => {
    expect(pickVariantForAttribute(tolomeo, '1', 'Versione', 'Terra')).toBe('2')
    expect(pickVariantForAttribute(tolomeo, '2', 'Colore', 'Nero')).toBe('4')
  })

  it('spezza Dimensioni miste in Misure + Configurazione (Stellar Nebula)', () => {
    const values = ['22 cm', '30 cm', '40 cm', 'Cluster Circular', 'Cluster Linear']
    expect(subgroupAttributeValues('Dimensioni', values)).toEqual([
      { title: 'Dimensioni', values: ['22 cm', '30 cm', '40 cm'] },
      { title: 'Configurazione', values: ['Cluster Circular', 'Cluster Linear'] },
    ])
  })

  it('matrice: preferisce variante acquistabile e marca combinazioni assenti', () => {
    const matrix = [
      v('1', [
        { name: 'Colore', value: 'Nero' },
        { name: 'Versione', value: 'Tavolo' },
      ]),
      v('2', [
        { name: 'Colore', value: 'Nero' },
        { name: 'Versione', value: 'Terra' },
      ]),
      {
        ...v('3', [
          { name: 'Colore', value: 'Bianco' },
          { name: 'Versione', value: 'Tavolo' },
        ]),
        inStock: false,
        availability: { qtyAvailable: 0, isOrderable: false, isUnrecoverable: true },
      },
    ]
    expect(getMatrixValueState(matrix, '1', 'Versione', 'Terra')).toBe('available')
    expect(getMatrixValueState(matrix, '1', 'Colore', 'Bianco')).toBe('out_of_stock')
    expect(pickVariantForAttribute(matrix, '1', 'Colore', 'Bianco')).toBe('3')
  })
})

describe('odooCatalogImageUrlsMatch', () => {
  it('ignora la size Odoo', () => {
    expect(
      odooCatalogImageUrlsMatch(
        'https://tlbdb.odoo.com/web/image/123/image_512',
        'https://tlbdb.odoo.com/web/image/123/image_1920',
      ),
    ).toBe(true)
  })

  it('distingue immagini diverse', () => {
    expect(
      odooCatalogImageUrlsMatch(
        'https://tlbdb.odoo.com/web/image/123/image_512',
        'https://tlbdb.odoo.com/web/image/999/image_512',
      ),
    ).toBe(false)
  })
})
