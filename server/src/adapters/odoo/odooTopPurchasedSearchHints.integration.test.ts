import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./odooClient.js', () => ({
  assertOdooConfigured: vi.fn(),
  isOdooConfigured: vi.fn(() => true),
  odooExecuteKw: vi.fn(),
}))

import { odooExecuteKw } from './odooClient.js'
import { fetchTopPurchasedSearchHints } from './odooTopPurchasedSearchHints.js'

const ctx = { correlationId: 'test-corr' }

describe('fetchTopPurchasedSearchHints', () => {
  beforeEach(() => {
    vi.mocked(odooExecuteKw).mockReset()
  })

  it('aggrega per template e ordina per quantità venduta', async () => {
    vi.mocked(odooExecuteKw)
      .mockResolvedValueOnce([
        { product_id: [101, 'Variant A'], product_uom_qty: 12 },
        { product_id: [102, 'Variant B'], product_uom_qty: 8 },
        { product_id: [103, 'Spedizione'], product_uom_qty: 50 },
      ])
      .mockResolvedValueOnce([
        {
          id: 101,
          display_name: 'Lampadina GU10',
          default_code: 'TLB 322805',
          sale_ok: true,
          type: 'product',
          product_tmpl_id: [501, 'Lampadina GU10'],
        },
        {
          id: 102,
          display_name: 'Artemide Eclisse',
          default_code: false,
          sale_ok: true,
          type: 'product',
          product_tmpl_id: [502, 'Artemide Eclisse'],
        },
        {
          id: 103,
          display_name: 'Spedizione standard',
          sale_ok: true,
          type: 'service',
          product_tmpl_id: [503, 'Spedizione standard'],
        },
      ])
      .mockResolvedValueOnce([
        { id: 501, name: 'Lampadina GU10', sale_ok: true },
        { id: 502, name: 'Artemide Eclisse', sale_ok: true },
        { id: 503, name: 'Spedizione standard', sale_ok: true },
      ])

    const result = await fetchTopPurchasedSearchHints(ctx, { lookbackDays: 90, limit: 5 })

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      query: 'TLB 322805',
      productTemplateId: 501,
      totalQuantity: 12,
    })
    expect(result[1]).toMatchObject({
      query: 'Artemide Eclisse',
      productTemplateId: 502,
      totalQuantity: 8,
    })
  })

  it('somma quantità di varianti sullo stesso template', async () => {
    vi.mocked(odooExecuteKw)
      .mockResolvedValueOnce([
        { product_id: [201, 'V1'], product_uom_qty: 4 },
        { product_id: [202, 'V2'], product_uom_qty: 6 },
      ])
      .mockResolvedValueOnce([
        {
          id: 201,
          display_name: 'Prodotto X V1',
          default_code: false,
          sale_ok: true,
          type: 'product',
          product_tmpl_id: [601, 'Prodotto X'],
        },
        {
          id: 202,
          display_name: 'Prodotto X V2',
          default_code: false,
          sale_ok: true,
          type: 'product',
          product_tmpl_id: [601, 'Prodotto X'],
        },
      ])
      .mockResolvedValueOnce([{ id: 601, name: 'Prodotto X', sale_ok: true }])

    const result = await fetchTopPurchasedSearchHints(ctx, { lookbackDays: 30, limit: 3 })

    expect(result).toHaveLength(1)
    expect(result[0]?.totalQuantity).toBe(10)
  })

  it('ritorna array vuoto senza righe ordine', async () => {
    vi.mocked(odooExecuteKw).mockResolvedValueOnce([])

    const result = await fetchTopPurchasedSearchHints(ctx, { lookbackDays: 90, limit: 8 })

    expect(result).toEqual([])
    expect(odooExecuteKw).toHaveBeenCalledTimes(1)
  })
})
