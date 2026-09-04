import { describe, expect, it } from 'vitest'
import { mapOdooSaleLinesToOrderLines } from './odoo-order-lines.js'

describe('mapOdooSaleLinesToOrderLines', () => {
  it('mappa nome, qty, prezzo e SKU', () => {
    const lines = mapOdooSaleLinesToOrderLines(
      [
        {
          id: 11,
          productId: 44,
          productName: 'Lampada sospensione',
          quantity: 2,
          unitPriceCents: 12900,
          subtotalCents: 25800,
        },
      ],
      new Map([
        [
          44,
          {
            defaultCode: 'TLB-322805',
            templateId: 9,
            slug: 'lampada-sospensione',
            name: 'Lampada sospensione nera',
            imageUrl: 'https://img.example/l.png',
          },
        ],
      ]),
    )

    expect(lines).toEqual([
      {
        productRef: 'TLB-322805',
        variantRef: '44',
        quantity: 2,
        productSlug: 'lampada-sospensione',
        productName: 'Lampada sospensione nera',
        imageUrl: 'https://img.example/l.png',
        unitPriceCents: 12900,
        lineTotalCents: 25800,
      },
    ])
  })

  it('ignora righe a quantità zero e usa il nome Odoo senza extra', () => {
    const lines = mapOdooSaleLinesToOrderLines([
      {
        id: 1,
        productId: 8,
        productName: 'Nota sezione',
        quantity: 0,
        unitPriceCents: 0,
        subtotalCents: 0,
      },
      {
        id: 2,
        productId: 9,
        productName: 'Applique',
        quantity: 1,
        unitPriceCents: 4500,
        subtotalCents: 4500,
      },
    ])

    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      productRef: '9',
      productName: 'Applique',
      quantity: 1,
      lineTotalCents: 4500,
    })
  })
})
