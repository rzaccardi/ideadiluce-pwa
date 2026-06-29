import { describe, expect, it } from 'vitest'
import type { ArflyVariant } from '../../adapters/arfly/arfly.types.js'
import { matchArflyVariant, pickOdooVariantMatch } from './catalog-code-match.js'

function variant(partial: Partial<ArflyVariant> & Pick<ArflyVariant, 'id'>): ArflyVariant {
  return {
    id: partial.id,
    ced: partial.ced ?? '',
    manufacturer_code: partial.manufacturer_code ?? '',
    attributes: partial.attributes ?? [],
    lst_price: partial.lst_price ?? 0,
    image: partial.image ?? { url: '', alt: '' },
    specs: partial.specs ?? [],
    ean: partial.ean ?? null,
  }
}

describe('matchArflyVariant', () => {
  const variants = [
    variant({ id: 1184, ced: '001520', manufacturer_code: '464749', ean: null }),
    variant({ id: 8484, ced: '002144', manufacturer_code: 'L392702127', ean: '8718739073586' }),
  ]

  it('match su CED interno', () => {
    expect(matchArflyVariant(variants, '001520')?.matchType).toBe('arfly_sku')
  })

  it('match su EAN', () => {
    expect(matchArflyVariant(variants, '8718739073586')?.matchType).toBe('arfly_ean')
  })

  it('match su MPN produttore', () => {
    expect(matchArflyVariant(variants, '464749')?.variant.id).toBe(1184)
    expect(matchArflyVariant(variants, '464749')?.matchType).toBe('arfly_mpn')
  })

  it('match su ID variante numerico', () => {
    expect(matchArflyVariant(variants, '8484')?.matchType).toBe('arfly_variant_id')
  })

  it('restituisce null se nessun match', () => {
    expect(matchArflyVariant(variants, '8711500411990')).toBeNull()
  })
})

describe('pickOdooVariantMatch', () => {
  const rows = [
    {
      id: 1184,
      product_tmpl_id: [1178, 'OSRAM T5'] as [number, string],
      default_code: 'OSRA464749',
      barcode: '4050300464749',
    },
    {
      id: 8484,
      product_tmpl_id: [7369, 'SPL LED'] as [number, string],
      default_code: 'SPL-L392702127',
      barcode: '8718739073586',
    },
  ]

  it('preferisce match esatto su barcode', () => {
    const match = pickOdooVariantMatch(rows, '4050300464749')
    expect(match?.variantId).toBe(1184)
    expect(match?.matchField).toBe('barcode')
  })

  it('match su default_code Odoo', () => {
    const match = pickOdooVariantMatch(rows, 'SPL-L392702127')
    expect(match?.variantId).toBe(8484)
    expect(match?.matchField).toBe('default_code')
  })
})
