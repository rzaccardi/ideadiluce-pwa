import { describe, expect, it } from 'vitest'
import type { CartDTO } from '@/types/dto'
import {
  cartDisplayTotalCents,
  cartShippingCents,
  cartSubtotalCents,
  cartTotalCents,
} from './cartTotals'

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

const pricedLine = {
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
  availabilityStatus: 'available' as const,
  availability: {
    state: 'available' as const,
    stockQty: null,
    effectiveLeadDays: null,
    warning: null,
    isOrderable: false,
  },
}

describe('cartDisplayTotalCents', () => {
  it('non mostra 0,00 € se le righe non hanno ancora un prezzo', () => {
    const next = cart({
      items: [
        {
          ...pricedLine,
          clientUnitPriceEstimateCents: null,
          lineTotalEstimateCents: null,
        },
      ],
      itemCount: 1,
      purchasableItemCount: 1,
    })
    expect(cartDisplayTotalCents(next)).toBeNull()
  })

  it('mostra il totale quando le righe sono prezzate', () => {
    const next = cart({
      items: [pricedLine],
      estimatedSubtotal: 2500,
      estimatedTotal: 2500,
      itemCount: 1,
      purchasableItemCount: 1,
    })
    expect(cartDisplayTotalCents(next)).toBe(2500)
  })
})

describe('cartShippingCents', () => {
  it('ignora estimatedShipping residuo (es. flat €5,90) senza metodo selezionato', () => {
    const next = cart({
      items: [pricedLine],
      estimatedSubtotal: 2500,
      estimatedShipping: 590,
      estimatedTotal: 3090,
      itemCount: 1,
      purchasableItemCount: 1,
    })
    expect(cartShippingCents(next)).toBeNull()
    expect(cartShippingCents(next, null)).toBeNull()
  })

  it('usa l’importo solo con metodo selezionato in checkout', () => {
    const next = cart({
      items: [pricedLine],
      estimatedSubtotal: 2500,
      estimatedShipping: 590,
      itemCount: 1,
      purchasableItemCount: 1,
    })
    expect(cartShippingCents(next, 590)).toBe(590)
    expect(cartShippingCents(next, 0)).toBe(0)
  })
})

describe('cart totals without premature shipping', () => {
  it('subtotale non include la spedizione flat residua', () => {
    const next = cart({
      items: [pricedLine],
      estimatedSubtotal: 2500,
      estimatedTax: 0,
      estimatedShipping: 590,
      estimatedTotal: 3090,
      itemCount: 1,
      purchasableItemCount: 1,
    })
    expect(cartSubtotalCents(next)).toBe(2500)
    // Senza metodo: totale UI = subtotale (+ tax), non + €5,90
    expect(cartTotalCents(next)).toBe(2500)
    expect(cartTotalCents(next, 590)).toBe(3090)
  })
})
