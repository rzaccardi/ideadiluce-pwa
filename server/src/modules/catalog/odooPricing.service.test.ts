import { describe, expect, it, vi, beforeEach } from 'vitest'

const odooExecuteKw = vi.fn()

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
}))

vi.mock('../checkout/checkout-order-sync.service.js', () => ({
  isCartCheckoutPriceLocked: vi.fn(async () => false),
}))

vi.mock('../../config/env.js', () => ({
  env: { ODOO_CATALOG_LANG: 'it_IT', ODOO_ENABLED: true },
}))

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => true,
  odooExecuteKw: (...args: unknown[]) => odooExecuteKw(...args),
}))

import { resolveCartLineUnitPricesCents } from './odooPricing.service.js'

describe('resolveCartLineUnitPricesCents', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
  })

  it('legge varianti e template in batch (max 2 chiamate Odoo)', async () => {
    odooExecuteKw
      .mockResolvedValueOnce([
        { id: 1622, list_price: 172.13 },
        { id: 1623, list_price: 185 },
      ])
      .mockResolvedValueOnce([{ id: 900, list_price: 99.5 }])

    const prices = await resolveCartLineUnitPricesCents(
      { correlationId: 'test' },
      [
        { lineId: 'line-a', productRef: '800', variantRef: '1622' },
        { lineId: 'line-b', productRef: '800', variantRef: '1623' },
        { lineId: 'line-c', productRef: '900', variantRef: null },
      ],
      { segment: 'RETAIL', pricelistId: 1, partnerId: null },
    )

    expect(odooExecuteKw).toHaveBeenCalledTimes(2)
    expect(odooExecuteKw.mock.calls[0]?.[1]).toBe('product.product')
    expect(odooExecuteKw.mock.calls[0]?.[3]).toEqual([[1622, 1623]])
    expect(odooExecuteKw.mock.calls[1]?.[1]).toBe('product.template')
    expect(odooExecuteKw.mock.calls[1]?.[3]).toEqual([[900]])

    expect(prices.get('line-a')).toBe(17213)
    expect(prices.get('line-b')).toBe(18500)
    expect(prices.get('line-c')).toBe(9950)
  })

  it('salta le read Odoo se non ci sono id risolvibili', async () => {
    const prices = await resolveCartLineUnitPricesCents(
      { correlationId: 'test' },
      [{ lineId: 'line-x', productRef: 'slug-sconosciuto', variantRef: null }],
    )

    expect(odooExecuteKw).not.toHaveBeenCalled()
    expect(prices.get('line-x')).toBeNull()
  })
})
