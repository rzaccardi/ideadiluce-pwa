import { describe, expect, it } from 'vitest'
import {
  buildCartLineVariantMeta,
  parseCartLineVariantMeta,
  variantMetaToChips,
} from './cart-line-variant-meta.js'

describe('cart-line-variant-meta', () => {
  it('persiste attributi matrice e non espone ID grezzi', () => {
    const meta = buildCartLineVariantMeta({
      variantLabel: '22 cm',
      imageUrl: 'https://example.com/v.jpg',
      attributes: [{ name: 'Dimensioni', value: '22 cm' }],
    })
    expect(variantMetaToChips(meta)).toEqual(['Dimensioni: 22 cm'])
    expect(parseCartLineVariantMeta(meta)?.imageUrl).toBe('https://example.com/v.jpg')
  })

  it('persiste nome e slug prodotto per il DTO veloce senza catalogo Odoo', () => {
    const meta = buildCartLineVariantMeta({
      productName: 'Lampada',
      productSlug: 'lampada',
      imageUrl: 'https://example.com/v.jpg',
    })
    expect(parseCartLineVariantMeta(meta)?.productName).toBe('Lampada')
    expect(parseCartLineVariantMeta(meta)?.productSlug).toBe('lampada')
  })

  it('ignora label numerica senza attributi', () => {
    expect(variantMetaToChips({ variantLabel: '1997' })).toEqual([])
  })
})
