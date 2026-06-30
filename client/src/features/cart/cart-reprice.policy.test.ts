import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { shouldRepriceCartOnLoad } from './cart-reprice.policy'

vi.mock('@/lib/cart-local-storage', () => ({
  loadLocalCartMirror: vi.fn(() => null),
}))

import { loadLocalCartMirror } from '@/lib/cart-local-storage'

const freshCart = {
  id: 'c1',
  repricedAt: new Date().toISOString(),
  reservation: { expired: false, enabled: true, expiresAt: null },
  items: [{ clientUnitPriceEstimateCents: 1000 }],
} as never

describe('shouldRepriceCartOnLoad', () => {
  beforeEach(() => {
    vi.mocked(loadLocalCartMirror).mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('non reprica dopo add-to-cart con prezzi freschi', () => {
    expect(shouldRepriceCartOnLoad(freshCart)).toBe(false)
  })

  it('reprica se repricedAt è vecchio', () => {
    const old = new Date(Date.now() - 31 * 60 * 1000).toISOString()
    expect(shouldRepriceCartOnLoad({ ...freshCart, repricedAt: old })).toBe(true)
  })

  it('reprica se il mirror localStorage è vecchio e non c\'è carrello in memoria', () => {
    vi.mocked(loadLocalCartMirror).mockReturnValue({
      cartId: 'x',
      reservationExpiresAt: null,
      updatedAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
    })
    expect(shouldRepriceCartOnLoad(null)).toBe(true)
  })
})
