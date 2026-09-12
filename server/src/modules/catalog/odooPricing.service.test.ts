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

  it('legge varianti e template in batch e cerca le regole listino', async () => {
    odooExecuteKw.mockImplementation(async (_ctx: unknown, model: string) => {
      if (model === 'product.pricelist.item') return []
      if (model === 'product.product') {
        return [
          { id: 1622, list_price: 172.13 },
          { id: 1623, list_price: 185 },
        ]
      }
      if (model === 'product.template') return [{ id: 900, list_price: 99.5 }]
      return []
    })

    const prices = await resolveCartLineUnitPricesCents(
      { correlationId: 'test' },
      [
        { lineId: 'line-a', productRef: '800', variantRef: '1622' },
        { lineId: 'line-b', productRef: '800', variantRef: '1623' },
        { lineId: 'line-c', productRef: '900', variantRef: null },
      ],
      { segment: 'RETAIL', pricelistId: 1, partnerId: null },
    )

    const models = odooExecuteKw.mock.calls.map((call) => call[1])
    expect(models).toContain('product.product')
    expect(models).toContain('product.template')
    expect(models.filter((model) => model === 'product.pricelist.item')).toHaveLength(2)

    expect(prices.get('line-a')).toBe(17213)
    expect(prices.get('line-b')).toBe(18500)
    expect(prices.get('line-c')).toBe(9950)
  })

  it('sovrascrive list_price col prezzo fisso del listino assegnato', async () => {
    odooExecuteKw.mockImplementation(async (_ctx: unknown, model: string) => {
      if (model === 'product.product') return [{ id: 8718, list_price: 5.41 }]
      if (model === 'product.pricelist.item') {
        return [{ compute_price: 'fixed', fixed_price: 3.18, product_id: [8718, 'T5'] }]
      }
      return []
    })

    const prices = await resolveCartLineUnitPricesCents(
      { correlationId: 'b2b' },
      [{ lineId: 'line-a', productRef: '7531', variantRef: '8718' }],
      { segment: 'BUSINESS', pricelistId: 15, partnerId: null, personalized: true },
    )

    expect(prices.get('line-a')).toBe(318)
  })

  it('passa il listino rivenditori nel context Odoo e converte list_price in centesimi', async () => {
    odooExecuteKw.mockImplementation(async (_ctx: unknown, model: string) => {
      if (model === 'product.product') return [{ id: 1622, list_price: 80 }]
      return []
    })

    const prices = await resolveCartLineUnitPricesCents(
      { correlationId: 'b2b' },
      [{ lineId: 'line-a', productRef: '800', variantRef: '1622' }],
      { segment: 'BUSINESS', pricelistId: 44, partnerId: 99002, personalized: true },
    )

    expect(prices.get('line-a')).toBe(8000)
    expect(odooExecuteKw).toHaveBeenCalledWith(
      expect.anything(),
      'product.product',
      'read',
      [[1622]],
      {
        fields: ['list_price'],
        context: { lang: 'it_IT', pricelist: 44, partner_id: 99002 },
      },
    )
  })

  it('passa il listino installatori nel context Odoo (prezzo diverso dal B2B)', async () => {
    odooExecuteKw.mockImplementation(async (_ctx: unknown, model: string) => {
      if (model === 'product.product') return [{ id: 1622, list_price: 95.5 }]
      if (model === 'product.pricelist.item') {
        return [{ compute_price: 'fixed', fixed_price: 70, product_id: [1622, 'A'] }]
      }
      return []
    })

    const prices = await resolveCartLineUnitPricesCents(
      { correlationId: 'pro' },
      [{ lineId: 'line-a', productRef: '800', variantRef: '1622' }],
      { segment: 'PROFESSIONAL', pricelistId: 31, partnerId: 99003, personalized: true },
    )

    expect(prices.get('line-a')).toBe(7000)
    expect(odooExecuteKw.mock.calls[0]?.[4]).toEqual({
      fields: ['list_price'],
      context: { lang: 'it_IT', pricelist: 31, partner_id: 99003 },
    })
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
