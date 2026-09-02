import { describe, expect, it } from 'vitest'
import {
  buildCartLineVariantMeta,
  parseCartLineVariantMeta,
} from './cart-line-variant-meta.js'

describe('cart odoo prep payload', () => {
  it('il metadata riga include nome e slug usati dal prep senza round-trip catalogo', () => {
    const meta = buildCartLineVariantMeta({
      productName: 'Lampada da tavolo',
      productSlug: 'lampada-da-tavolo',
      variantLabel: '22 cm',
    })
    const parsed = parseCartLineVariantMeta(meta)
    expect(parsed?.productName).toBe('Lampada da tavolo')
    expect(parsed?.productSlug).toBe('lampada-da-tavolo')
  })
})
