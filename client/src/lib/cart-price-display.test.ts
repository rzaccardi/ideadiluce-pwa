import { describe, expect, it } from 'vitest'
import type { CartDTO, UserDTO } from '@/types/dto'
import {
  cartCheckoutHeadlineCents,
  cartDisplaySubtotalCents,
  cartLineDisplayCents,
} from './cart-price-display'

const emptyReservation = {
  enabled: false,
  startedAt: null,
  expiresAt: null,
  expiresInSeconds: null,
  elapsedSeconds: null,
  expired: false,
  ttlMinutes: 0,
}

function user(
  segment: UserDTO['customerSegment'],
  extras?: Partial<Pick<UserDTO, 'isProfessional'>>,
): UserDTO {
  return {
    id: 'u1',
    email: 'a@example.com',
    firstName: 'A',
    lastName: 'B',
    phone: null,
    shippingAddress: null,
    preferredPaymentMethod: null,
    status: 'ACTIVE',
    customerSegment: segment,
    pricelistLabel: '',
    isProfessional: extras?.isProfessional ?? segment === 'professional',
    b2bActive: false,
    personalizedPricing: segment === 'business' || segment === 'professional',
    companyName: null,
    vatNumber: null,
    fiscalCode: null,
    pec: null,
    sdiCode: null,
    vatCountryCode: null,
    vatFormatValid: null,
    vatChecksumValid: null,
    fiscalCodeValid: null,
    viesValid: null,
    viesName: null,
    viesAddress: null,
    taxValidationStatus: null,
    taxCheckedAt: null,
    odooPartnerId: null,
    odooPricelistId: null,
  }
}

function cart(overrides?: Partial<CartDTO>): CartDTO {
  return {
    id: 'cart-1',
    currencyCode: 'EUR',
    status: 'ACTIVE',
    items: [
      {
        id: 'line-1',
        productRef: 'sku',
        variantRef: null,
        quantity: 1,
        clientUnitPriceEstimateCents: 82,
        lineTotalEstimateCents: 82,
        productSlug: 'sku',
        productName: 'Prodotto',
        imageUrl: null,
        purchasable: true,
        availabilityStatus: 'available',
        availability: {
          state: 'available',
          stockQty: null,
          effectiveLeadDays: null,
          warning: null,
          isOrderable: false,
        },
      },
    ],
    estimatedSubtotal: 82,
    estimatedTax: null,
    estimatedShipping: null,
    estimatedTotal: 82,
    itemCount: 1,
    purchasableItemCount: 1,
    warnings: [],
    deliveryLeadDays: null,
    deliveryEstimateDays: null,
    repricedAt: null,
    reservation: emptyReservation,
    ...overrides,
  }
}

describe('cart-price-display', () => {
  it('allinea riga carrello alla scheda prodotto (82 → 100 IVA inclusa)', () => {
    expect(cartLineDisplayCents(82, null)).toBe(100)
    expect(cartLineDisplayCents(82, user('retail'))).toBe(100)
    expect(cartLineDisplayCents(82, user('professional'))).toBe(82)
  })

  it('subtotale guest/retail include IVA stimata come in vetrina', () => {
    expect(cartDisplaySubtotalCents(cart(), null)).toBe(100)
    expect(cartDisplaySubtotalCents(cart(), user('retail'))).toBe(100)
  })

  it('subtotale professional resta netto', () => {
    expect(cartDisplaySubtotalCents(cart(), user('professional'))).toBe(82)
  })

  it('preferisce taxBreakdown al catalogo quando presente', () => {
    const withTax = cart({
      estimatedTax: 18,
      taxBreakdown: {
        netCents: 82,
        taxCents: 18,
        taxRatePct: 22,
        taxLabel: 'IVA 22%',
        grossCents: 100,
        isEstimate: true,
      },
    })
    expect(cartDisplaySubtotalCents(withTax, user('retail'))).toBe(100)
  })

  it('headline checkout precoce = subtotale IVA inclusa; finale = totale da pagare', () => {
    const withTax = cart({
      estimatedTax: 18,
      estimatedTotal: 100,
      taxBreakdown: {
        netCents: 82,
        taxCents: 18,
        taxRatePct: 22,
        taxLabel: 'IVA 22%',
        grossCents: 100,
        isEstimate: true,
      },
    })
    expect(
      cartCheckoutHeadlineCents(withTax, {
        user: user('retail'),
        liveTax: withTax.taxBreakdown,
        revealGrandTotal: false,
      }),
    ).toBe(100)
    expect(
      cartCheckoutHeadlineCents(withTax, {
        user: user('retail'),
        liveTax: withTax.taxBreakdown,
        selectedShippingAmountCents: 0,
        revealGrandTotal: true,
      }),
    ).toBe(100)
  })
})
