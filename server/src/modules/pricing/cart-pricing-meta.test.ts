import { beforeEach, describe, expect, it } from 'vitest'
import {
  acknowledgeCartPricingConfirmation,
  clearCartPricingMeta,
  getCartPricingMeta,
  setCartPricingMeta,
} from './cart-pricing-meta.js'

describe('cart-pricing-meta', () => {
  beforeEach(() => {
    clearCartPricingMeta('cart-1')
  })

  it('richiede conferma e la consuma per lo stesso snapshot', () => {
    setCartPricingMeta('cart-1', {
      snapshotAt: '2026-10-12T12:00:00.000Z',
      fromCache: false,
      warnings: ['price_unit_net mismatch'],
      needsConfirmation: true,
      taxRatePct: 22,
    })
    expect(getCartPricingMeta('cart-1')?.needsConfirmation).toBe(true)

    acknowledgeCartPricingConfirmation('cart-1')
    expect(getCartPricingMeta('cart-1')?.needsConfirmation).toBe(false)
    expect(getCartPricingMeta('cart-1')?.acknowledgedSnapshotAt).toBe('2026-10-12T12:00:00.000Z')

    // Stesso snapshot + warning: non richiedere di nuovo
    setCartPricingMeta('cart-1', {
      snapshotAt: '2026-10-12T12:00:00.000Z',
      fromCache: false,
      warnings: ['price_unit_net mismatch'],
      needsConfirmation: true,
      taxRatePct: 22,
    })
    expect(getCartPricingMeta('cart-1')?.needsConfirmation).toBe(false)
  })

  it('richiede di nuovo conferma se cambia lo snapshot', () => {
    setCartPricingMeta('cart-1', {
      snapshotAt: '2026-10-12T12:00:00.000Z',
      fromCache: false,
      warnings: ['w'],
      needsConfirmation: true,
      taxRatePct: 22,
    })
    acknowledgeCartPricingConfirmation('cart-1')

    setCartPricingMeta('cart-1', {
      snapshotAt: '2026-10-12T13:00:00.000Z',
      fromCache: false,
      warnings: ['w'],
      needsConfirmation: true,
      taxRatePct: 22,
    })
    expect(getCartPricingMeta('cart-1')?.needsConfirmation).toBe(true)
  })
})
