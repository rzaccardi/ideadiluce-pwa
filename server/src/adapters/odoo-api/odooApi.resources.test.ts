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

import { odooApiGetInvoicePdf, odooApiGetStock } from './odooApi.resources.js'

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

  it('GET /invoices/<id>/pdf con website e customer_id', async () => {
    requestMock.mockResolvedValue({ status: 200, data: Buffer.from('%PDF') })
    await odooApiGetInvoicePdf(42, 7, 'corr-pdf')
    expect(requestMock).toHaveBeenCalledWith('/api/v2/invoices/42/pdf', {
      accept: 'bytes',
      query: { website: '2', customer_id: 7 },
      correlationId: 'corr-pdf',
    })
  })
})
