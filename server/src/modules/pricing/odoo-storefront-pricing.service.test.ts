import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getPricesMock, totalsMock, apiConfigured } = vi.hoisted(() => ({
  getPricesMock: vi.fn(),
  totalsMock: vi.fn(),
  apiConfigured: { value: true },
}))

vi.mock('../../adapters/odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => apiConfigured.value,
}))

vi.mock('../../adapters/odoo-api/odooApi.resources.js', () => ({
  odooApiGetPrices: (...args: unknown[]) => getPricesMock(...args),
  odooApiComputeOrderTotals: (...args: unknown[]) => totalsMock(...args),
}))

import {
  fetchStorefrontOrderTotals,
  fetchStorefrontPrices,
} from './odoo-storefront-pricing.service.js'

describe('odoo-storefront-pricing', () => {
  beforeEach(() => {
    getPricesMock.mockReset()
    totalsMock.mockReset()
    apiConfigured.value = true
  })

  it('mappa GET /prices in centesimi e cache', async () => {
    getPricesMock.mockResolvedValue({
      snapshot_at: '2026-10-12T12:00:00.000Z',
      items: [
        {
          id: 99,
          list_price: 172.13,
          public_price: 154,
          price: 154,
          discount_pct: 10.5,
          source: 'public',
        },
      ],
    })
    const first = await fetchStorefrontPrices({ productIds: [99] })
    expect(first.rows.get(99)?.priceCents).toBe(15400)
    expect(first.rows.get(99)?.listPriceCents).toBe(17213)
    expect(first.fromCache).toBe(false)

    apiConfigured.value = false
    getPricesMock.mockRejectedValue(new Error('down'))
    const cached = await fetchStorefrontPrices({ productIds: [99] })
    expect(cached.rows.get(99)?.priceCents).toBe(15400)
    expect(cached.fromCache).toBe(true)
  })

  it('POST /orders/totals e fallback cache', async () => {
    totalsMock.mockResolvedValue({
      snapshot_at: '2026-10-12T12:00:00.000Z',
      subtotal_net_cents: 30800,
      amount_tax_cents: 6776,
      amount_total_cents: 37576,
      tax_rates: 22,
      lines: [{ product_id: 99, qty: 2, price_unit_net: 154, list_price: 172.13 }],
      warnings: ['price_unit_net mismatch'],
    })
    const live = await fetchStorefrontOrderTotals({
      lines: [{ lineId: 'l1', productId: 99, qty: 2 }],
      allowCacheFallback: true,
    })
    expect(live?.subtotalNetCents).toBe(30800)
    expect(live?.amountTaxCents).toBe(6776)
    expect(live?.amountTotalCents).toBe(37576)
    expect(live?.warnings).toContain('price_unit_net mismatch')
    expect(live?.fromCache).toBe(false)

    totalsMock.mockRejectedValue(new Error('down'))
    const cached = await fetchStorefrontOrderTotals({
      lines: [{ lineId: 'l1', productId: 99, qty: 2 }],
      allowCacheFallback: true,
    })
    expect(cached?.fromCache).toBe(true)
    expect(cached?.lines[0]?.priceUnitNetCents).toBe(15400)
  })
})
