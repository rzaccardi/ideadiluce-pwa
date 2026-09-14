import { describe, expect, it } from 'vitest'
import type { CartDTO } from '@/types/dto'
import { cartDisplayTotalCents } from './cartTotals'

const emptyReservation = {
  enabled: false,
  startedAt: null,
  expiresAt: null,
  expiresInSeconds: null,
  elapsedSeconds: null,
  expired: false,
  ttlMinutes: 0,
}

function cart(overrides?: Partial<CartDTO>): CartDTO {
  return {
    id: 'cart-1',
    currencyCode: 'EUR',
    status: 'ACTIVE',
    items: [],
    estimatedSubtotal: 0,
    estimatedTax: null,
    estimatedShipping: null,
    estimatedTotal: 0,
    itemCount: 0,
    purchasableItemCount: 0,
    warnings: [],
    deliveryLeadDays: null,
    deliveryEstimateDays: null,
    repricedAt: null,
    reservation: emptyReservation,
    ...overrides,
  }
}

describe('cartDisplayTotalCents', () => {
  it('non mostra 0,00 € se le righe non hanno ancora un prezzo', () => {
    const next = cart({
      items: [
        {
          id: 'line-1',
          productRef: 'lampada',
          variantRef: null,
          quantity: 1,
          clientUnitPriceEstimateCents: null,
          lineTotalEstimateCents: null,
          productSlug: 'lampada',
          productName: 'Lampada',
          imageUrl: null,
          purchasable: true,
          availabilityStatus: 'available',
          availability: { state: 'available', stockQty: null, effectiveLeadDays: null, warning: null },
        },
      ],
      itemCount: 1,
      purchasableItemCount: 1,
    })
    expect(cartDisplayTotalCents(next)).toBeNull()
  })

  it('mostra il totale quando le righe sono prezzate', () => {
    const next = cart({
      items: [
        {
          id: 'line-1',
          productRef: 'lampada',
          variantRef: null,
          quantity: 1,
          clientUnitPriceEstimateCents: 2500,
          lineTotalEstimateCents: 2500,
          productSlug: 'lampada',
          productName: 'Lampada',
          imageUrl: null,
          purchasable: true,
          availabilityStatus: 'available',
          availability: { state: 'available', stockQty: null, effectiveLeadDays: null, warning: null },
        },
      ],
      estimatedSubtotal: 2500,
      estimatedTotal: 2500,
      itemCount: 1,
      purchasableItemCount: 1,
    })
    expect(cartDisplayTotalCents(next)).toBe(2500)
  })
})
