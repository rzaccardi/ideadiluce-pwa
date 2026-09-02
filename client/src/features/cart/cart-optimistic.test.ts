import { describe, expect, it } from 'vitest'
import type { CartDTO } from '@/types/dto'
import { applyOptimisticAdd, cartLineMatchesAdd, isOptimisticCartId } from './cart-optimistic'

const emptyReservation = {
  enabled: false,
  startedAt: null,
  expiresAt: null,
  expiresInSeconds: null,
  elapsedSeconds: null,
  expired: false,
  ttlMinutes: 0,
}

function cartWithLine(overrides?: Partial<CartDTO['items'][number]>): CartDTO {
  return {
    id: 'cart-1',
    currencyCode: 'EUR',
    status: 'ACTIVE',
    items: [
      {
        id: 'line-1',
        productRef: '1997',
        variantRef: '88',
        quantity: 1,
        clientUnitPriceEstimateCents: 1000,
        lineTotalEstimateCents: 1000,
        productSlug: 'lampada',
        productName: 'Lampada',
        imageUrl: null,
        purchasable: true,
        availabilityStatus: 'available',
        availability: { state: 'available', stockQty: 4, effectiveLeadDays: null, warning: null },
        ...overrides,
      },
    ],
    estimatedSubtotal: 1000,
    estimatedTax: null,
    estimatedShipping: null,
    estimatedTotal: 1000,
    itemCount: 1,
    purchasableItemCount: 1,
    warnings: [],
    deliveryLeadDays: null,
    deliveryEstimateDays: null,
    repricedAt: null,
    reservation: emptyReservation,
  }
}

describe('applyOptimisticAdd', () => {
  it('crea un carrello locale se non esiste', () => {
    const next = applyOptimisticAdd({
      cart: null,
      productRef: 'lampada',
      quantity: 2,
      productHint: {
        odooTemplateId: 1997,
        odooVariantId: 88,
        slug: 'lampada',
        name: 'Lampada',
        unitPriceCents: 2500,
      },
    })
    expect(isOptimisticCartId(next.id)).toBe(true)
    expect(next.itemCount).toBe(2)
    expect(next.items[0]?.productName).toBe('Lampada')
    expect(next.items[0]?.lineTotalEstimateCents).toBe(5000)
    expect(next.estimatedSubtotal).toBe(5000)
  })

  it('incrementa la quantità se la riga è già presente', () => {
    const next = applyOptimisticAdd({
      cart: cartWithLine(),
      productRef: 'lampada',
      quantity: 1,
      variantRef: '88',
      productHint: { odooTemplateId: 1997, odooVariantId: 88, slug: 'lampada', unitPriceCents: 1000 },
    })
    expect(next.items).toHaveLength(1)
    expect(next.items[0]?.quantity).toBe(2)
    expect(next.itemCount).toBe(2)
    expect(next.estimatedSubtotal).toBe(2000)
  })

  it('aggiunge una riga nuova per un altro prodotto', () => {
    const next = applyOptimisticAdd({
      cart: cartWithLine(),
      productRef: 'sedia',
      quantity: 1,
      productHint: { odooTemplateId: 42, slug: 'sedia', name: 'Sedia', unitPriceCents: 800 },
    })
    expect(next.items).toHaveLength(2)
    expect(next.itemCount).toBe(2)
    expect(next.estimatedSubtotal).toBe(1800)
  })
})

describe('cartLineMatchesAdd', () => {
  it('riconosce slug, template Odoo e variante', () => {
    expect(
      cartLineMatchesAdd(
        { productRef: '1997', productSlug: 'lampada', variantRef: '88' },
        'lampada',
        '88',
        { odooTemplateId: 1997, odooVariantId: 88, slug: 'lampada' },
      ),
    ).toBe(true)
  })
})
