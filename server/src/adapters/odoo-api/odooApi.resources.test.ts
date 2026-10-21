import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}))

vi.mock('./odooApiClient.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./odooApiClient.js')>()
  return {
    ...actual,
    odooApiV2Request: (...args: unknown[]) => requestMock(...args),
    odooApiWebsiteQuery: () => ({ website: '2' }),
  }
})

import {
  odooApiAuthRegister,
  odooApiComputeOrderTotals,
  odooApiCreateBusinessRequest,
  odooApiCreateReturnRequest,
  odooApiGetInvoicePdf,
  odooApiGetPrices,
  odooApiGetStock,
} from './odooApi.resources.js'

describe('odooApi v2 resources', () => {
  beforeEach(() => {
    requestMock.mockReset()
    requestMock.mockResolvedValue({ status: 200, data: [] })
  })

  it('GET /stock con website e ids', async () => {
    await odooApiGetStock([11, 22], 'corr-stock')
    expect(requestMock).toHaveBeenCalledWith('/api/v2/stock', {
      query: { website: '2', ids: '11,22' },
      correlationId: 'corr-stock',
    })
  })

  it('GET /prices con website, ids, customer_id e qty', async () => {
    requestMock.mockResolvedValue({
      status: 200,
      data: {
        snapshot_at: '2026-10-12T10:00:00Z',
        items: [{ id: 99, list_price: 172.13, price: 154, discount_pct: 10.5, source: 'public' }],
      },
    })
    const res = await odooApiGetPrices({
      ids: [99],
      customerId: 14245,
      qty: 1,
      correlationId: 'corr-prices',
    })
    expect(requestMock).toHaveBeenCalledWith('/api/v2/prices', {
      query: { website: '2', ids: '99', qty: 1, customer_id: 14245 },
      correlationId: 'corr-prices',
    })
    expect(res.items[0]?.price).toBe(154)
  })

  it('POST /orders/totals con sole righe product_id/qty', async () => {
    requestMock.mockResolvedValue({
      status: 200,
      data: {
        subtotal_net_cents: 30800,
        amount_tax_cents: 6776,
        amount_total_cents: 37576,
        lines: [{ product_id: 99, qty: 2, price_unit_net: 154 }],
        warnings: [],
      },
    })
    const res = await odooApiComputeOrderTotals(
      { lines: [{ product_id: 99, qty: 2 }], currency: 'EUR' },
      'corr-totals',
    )
    expect(requestMock).toHaveBeenCalledWith('/api/v2/orders/totals', {
      method: 'POST',
      body: { lines: [{ product_id: 99, qty: 2 }], currency: 'EUR' },
      correlationId: 'corr-totals',
    })
    expect(res.amount_total_cents).toBe(37576)
  })

  it('GET /invoices/<id>/pdf con website e customer_id', async () => {
    requestMock.mockResolvedValue({ status: 200, data: Buffer.from('%PDF') })
    await odooApiGetInvoicePdf(42, 7, 'corr-pdf')
    expect(requestMock).toHaveBeenCalledWith('/api/v2/invoices/42/pdf', {
      accept: 'bytes',
      query: { website: '2', customer_id: 7 },
      correlationId: 'corr-pdf',
    })
  })

  it('POST /auth/register con customer_id e password', async () => {
    requestMock.mockResolvedValue({
      status: 201,
      data: { user_id: 40, login: 'a@b.it', created: true },
    })
    const res = await odooApiAuthRegister(
      { customer_id: 14645, password: 'secret123' },
      'corr-register',
    )
    expect(requestMock).toHaveBeenCalledWith('/api/v2/auth/register', {
      method: 'POST',
      body: { customer_id: 14645, password: 'secret123' },
      correlationId: 'corr-register',
    })
    expect(res.user_id).toBe(40)
  })

  it('POST /orders/:id/return-request con lines', async () => {
    requestMock.mockResolvedValue({
      status: 201,
      data: { logged: true, activity_id: 1, order_id: 5000 },
    })
    const res = await odooApiCreateReturnRequest(
      5000,
      { customer_id: 14647, lines: [{ product_id: 8025, qty: 1 }], note: 'nota' },
      'corr-return',
    )
    expect(requestMock).toHaveBeenCalledWith('/api/v2/orders/5000/return-request', {
      method: 'POST',
      body: { customer_id: 14647, lines: [{ product_id: 8025, qty: 1 }], note: 'nota' },
      correlationId: 'corr-return',
    })
    expect(res.logged).toBe(true)
  })

  it('POST /customers/:id/business-request con company_name e vat', async () => {
    requestMock.mockResolvedValue({
      status: 201,
      data: { logged: true, activity_id: 2, customer_id: 99 },
    })
    const res = await odooApiCreateBusinessRequest(
      99,
      { company_name: 'Acme SRL', vat: 'IT12345678901', email: 'a@b.it' },
      'corr-biz',
    )
    expect(requestMock).toHaveBeenCalledWith('/api/v2/customers/99/business-request', {
      method: 'POST',
      body: { company_name: 'Acme SRL', vat: 'IT12345678901', email: 'a@b.it' },
      correlationId: 'corr-biz',
    })
    expect(res.customer_id).toBe(99)
  })
})
