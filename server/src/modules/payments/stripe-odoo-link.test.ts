import { describe, expect, it } from 'vitest'
import {
  parseOdooSaleOrderIdFromStripeMetadata,
  resolveOdooSaleOrderIdForFinalize,
  STRIPE_ODOO_SALE_ORDER_ID_META,
} from './stripe-odoo-link.js'

describe('parseOdooSaleOrderIdFromStripeMetadata', () => {
  it('legge odoo_sale_order_id dalla sessione Stripe', () => {
    expect(
      parseOdooSaleOrderIdFromStripeMetadata({
        pwa_order_id: 'cmtyiitu000225s01fitwlrgc',
        [STRIPE_ODOO_SALE_ORDER_ID_META]: '9568',
      }),
    ).toBe(9568)
  })

  it('ignora id vuoti o non validi', () => {
    expect(parseOdooSaleOrderIdFromStripeMetadata(undefined)).toBeNull()
    expect(parseOdooSaleOrderIdFromStripeMetadata({})).toBeNull()
    expect(parseOdooSaleOrderIdFromStripeMetadata({ odoo_sale_order_id: '' })).toBeNull()
    expect(parseOdooSaleOrderIdFromStripeMetadata({ odoo_sale_order_id: '0' })).toBeNull()
    expect(parseOdooSaleOrderIdFromStripeMetadata({ odoo_sale_order_id: 'abc' })).toBeNull()
  })
})

describe('resolveOdooSaleOrderIdForFinalize', () => {
  it('preferisce l’id della sessione Stripe a quello PWA', () => {
    expect(resolveOdooSaleOrderIdForFinalize({ fromStripe: 9573, fromOrder: 9568 })).toBe(9573)
  })

  it('usa l’id PWA se Stripe non lo ha', () => {
    expect(resolveOdooSaleOrderIdForFinalize({ fromStripe: null, fromOrder: 9568 })).toBe(9568)
    expect(resolveOdooSaleOrderIdForFinalize({ fromStripe: null, fromOrder: null })).toBeNull()
  })
})
