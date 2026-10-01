import { describe, expect, it, vi, beforeEach } from 'vitest'

const { odooExecuteKw, envState, odooConfigured, odooLive, apiV2 } = vi.hoisted(() => ({
  odooExecuteKw: vi.fn(),
  envState: { ODOO_ENABLED: true },
  odooConfigured: { value: true },
  odooLive: { value: true },
  apiV2: { value: false },
}))

vi.mock('../../config/env.js', () => ({
  env: envState,
}))

vi.mock('./odooClient.js', () => ({
  isOdooConfigured: () => odooConfigured.value,
  isOdooLiveConfigured: () => odooLive.value,
  odooExecuteKw: (...args: unknown[]) => odooExecuteKw(...args),
}))

vi.mock('../odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => apiV2.value,
}))

vi.mock('../odoo-api/odooApi.resources.js', () => ({
  odooApiGetStock: vi.fn(),
}))

import { fetchVariantStockByIds } from './odooInventoryAdapter.js'

describe('fetchVariantStockByIds - supplierinfo', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
    envState.ODOO_ENABLED = true
    odooConfigured.value = true
    odooLive.value = true
    apiV2.value = false
  })

  function mockOdoo(opts: {
    productRows: Array<Record<string, unknown>>
    supplierRows?: Array<Record<string, unknown>>
    supplierError?: boolean
  }) {
    odooExecuteKw.mockImplementation(
      async (_ctx: unknown, model: string, method: string, args: unknown[]) => {
        if (model === 'product.product' && method === 'fields_get') {
          return {
            qty_available: { string: 'Qty' },
            sale_ok: { string: 'Sale' },
            product_tmpl_id: { string: 'Template' },
          }
        }
        if (model === 'product.product' && method === 'read') {
          return opts.productRows
        }
        if (model === 'product.supplierinfo' && method === 'fields_get') {
          if (opts.supplierError) throw new Error('model missing')
          return {
            delay: { string: 'Delay' },
            product_id: { string: 'Product' },
            product_tmpl_id: { string: 'Template' },
          }
        }
        if (model === 'product.supplierinfo' && method === 'search_read') {
          if (opts.supplierError) throw new Error('model missing')
          return opts.supplierRows ?? []
        }
        throw new Error(`Unexpected call ${model}.${method} ${JSON.stringify(args)}`)
      },
    )
  }

  it('orderable = saleOk && hasSuppliers, lead = max delay', async () => {
    mockOdoo({
      productRows: [
        { id: 10, sale_ok: true, product_tmpl_id: [100, 'T'], qty_available: 3 },
        { id: 11, sale_ok: true, product_tmpl_id: [101, 'U'], qty_available: 0 },
      ],
      supplierRows: [
        { delay: 5, product_id: [10, 'A'], product_tmpl_id: false },
        { delay: 12, product_id: [10, 'A'], product_tmpl_id: false },
        { delay: 7, product_id: false, product_tmpl_id: [101, 'U'] },
      ],
    })

    const map = await fetchVariantStockByIds({ correlationId: 't' }, [10, 11])

    const a = map.get(10)!
    expect(a.hasSuppliers).toBe(true)
    expect(a.orderable).toBe(true)
    expect(a.leadTimeDays).toBe(12)
    expect(a.stockQty).toBe(3)

    const b = map.get(11)!
    expect(b.hasSuppliers).toBe(true)
    expect(b.orderable).toBe(true)
    expect(b.leadTimeDays).toBe(7)
    expect(b.stockQty).toBe(0)
  })

  it('senza fornitori → non orderable', async () => {
    mockOdoo({
      productRows: [
        { id: 20, sale_ok: true, product_tmpl_id: [200, 'T'], qty_available: 4 },
      ],
      supplierRows: [],
    })

    const map = await fetchVariantStockByIds({ correlationId: 't' }, [20])
    const snap = map.get(20)!
    expect(snap.hasSuppliers).toBe(false)
    expect(snap.orderable).toBe(false)
    expect(snap.leadTimeDays).toBeNull()
  })

  it('supplierinfo non leggibile → nessun fornitore (conservativo)', async () => {
    mockOdoo({
      productRows: [
        { id: 30, sale_ok: true, product_tmpl_id: [300, 'T'], qty_available: 1 },
      ],
      supplierError: true,
    })

    const map = await fetchVariantStockByIds({ correlationId: 't' }, [30])
    const snap = map.get(30)!
    expect(snap.hasSuppliers).toBe(false)
    expect(snap.orderable).toBe(false)
  })
})
