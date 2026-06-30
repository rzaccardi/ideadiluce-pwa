import { describe, expect, it } from 'vitest'
import { absorbCartLines, cartLineKey, mergeCartItemLists } from './cart-merge.js'

describe('cart-merge', () => {
  it('unisce righe con stesso prodotto/variante sommando le quantità', () => {
    const merged = new Map()
    absorbCartLines(merged, [
      {
        productRef: 'lampada-a',
        variantRef: '1',
        quantity: 2,
        clientUnitPriceEstimate: 1000,
        metadataJson: null,
      },
    ])
    absorbCartLines(merged, [
      {
        productRef: 'lampada-a',
        variantRef: '1',
        quantity: 3,
        clientUnitPriceEstimate: 1100,
        metadataJson: null,
      },
    ])

    expect([...merged.values()]).toEqual([
      {
        productRef: 'lampada-a',
        variantRef: '1',
        quantity: 5,
        clientUnitPriceEstimate: 1100,
        metadataJson: null,
      },
    ])
  })

  it('mantiene righe distinte per varianti diverse', () => {
    const lines = mergeCartItemLists([
      {
        items: [
          {
            productRef: 'lampada-a',
            variantRef: '1',
            quantity: 1,
            clientUnitPriceEstimate: null,
            metadataJson: null,
          },
        ],
      },
      {
        items: [
          {
            productRef: 'lampada-a',
            variantRef: '2',
            quantity: 2,
            clientUnitPriceEstimate: null,
            metadataJson: null,
          },
        ],
      },
    ])

    expect(lines).toHaveLength(2)
    expect(cartLineKey('lampada-a', '1')).not.toBe(cartLineKey('lampada-a', '2'))
  })
})
