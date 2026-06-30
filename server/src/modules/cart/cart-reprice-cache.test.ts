import { describe, expect, it } from 'vitest'
import { canUseCachedCartPricing } from './cart.service.js'

describe('canUseCachedCartPricing', () => {
  it('salta reprice se i prezzi sono recenti e su tutte le righe', () => {
    expect(
      canUseCachedCartPricing({
        lastPricedAt: new Date(),
        items: [
          { clientUnitPriceEstimate: 1000, updatedAt: new Date() } as never,
          { clientUnitPriceEstimate: 2000, updatedAt: new Date() } as never,
        ],
      } as never),
    ).toBe(true)
  })

  it('richiede reprice se manca lastPricedAt o un prezzo riga', () => {
    expect(
      canUseCachedCartPricing({
        lastPricedAt: null,
        items: [{ clientUnitPriceEstimate: 1000, updatedAt: new Date() } as never],
      } as never),
    ).toBe(false)
    expect(
      canUseCachedCartPricing({
        lastPricedAt: new Date(),
        items: [{ clientUnitPriceEstimate: null, updatedAt: new Date() } as never],
      } as never),
    ).toBe(false)
  })

  it('richiede reprice se una riga è nel carrello da troppo tempo', () => {
    const stale = new Date(Date.now() - 31 * 60 * 1000)
    expect(
      canUseCachedCartPricing({
        lastPricedAt: new Date(),
        items: [{ clientUnitPriceEstimate: 1000, updatedAt: stale } as never],
      } as never),
    ).toBe(false)
  })
})
