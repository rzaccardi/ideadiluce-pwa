import { beforeEach, describe, expect, it, vi } from 'vitest'

const { odooExecuteKw, odooConfigured, prismaMock } = vi.hoisted(() => ({
  odooExecuteKw: vi.fn(),
  odooConfigured: { value: true },
  prismaMock: {
    odooCustomerMap: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

vi.mock('../../config/env.js', () => ({
  env: { NODE_ENV: 'test', ODOO_ENABLED: true },
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: prismaMock,
}))

vi.mock('../../lib/integration-log-context.js', () => ({
  writeStructuredIntegrationLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => odooConfigured.value,
  odooExecuteKw: (...args: unknown[]) => odooExecuteKw(...args),
  getOdooPublicBaseUrl: () => 'https://odoo.example.com',
}))

import {
  buildInvoicePortalPdfUrl,
  invoicePdfFilename,
  invoicesService,
  isPdfBuffer,
  parseInvoicePublicId,
} from './invoices.service.js'

const PDF_BYTES = Buffer.from(`%PDF-1.4\n${'x'.repeat(120)}`)

describe('invoices PDF helpers', () => {
  it('parseInvoicePublicId accetta solo id odoo-invoice', () => {
    expect(parseInvoicePublicId('odoo-invoice-42')).toBe(42)
    expect(() => parseInvoicePublicId('42')).toThrow(/Invalid invoice id|Fattura non trovata/)
  })

  it('buildInvoicePortalPdfUrl usa report_type=pdf e download=true', () => {
    const url = buildInvoicePortalPdfUrl('https://odoo.example.com', 99, 'tok-1')
    expect(url).toBe(
      'https://odoo.example.com/my/invoices/99?access_token=tok-1&report_type=pdf&download=true',
    )
  })

  it('isPdfBuffer riconosce il magic number', () => {
    expect(isPdfBuffer(PDF_BYTES)).toBe(true)
    expect(isPdfBuffer(Buffer.from('<html>login</html>'))).toBe(false)
  })

  it('invoicePdfFilename sanitizza il nome', () => {
    expect(invoicePdfFilename('FT/2024 001')).toBe('FT_2024_001.pdf')
  })
})

describe('invoicesService.downloadPdf', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
    odooConfigured.value = true
    prismaMock.odooCustomerMap.findUnique.mockReset()
    prismaMock.user.findUnique.mockReset()
    prismaMock.odooCustomerMap.findUnique.mockResolvedValue({ odooPartnerId: 7 })
    vi.unstubAllGlobals()
  })

  it('scarica il PDF già generato da invoice_pdf_report_id', async () => {
    odooExecuteKw
      .mockResolvedValueOnce([
        {
          id: 42,
          name: 'FT/2024/001',
          state: 'posted',
          access_token: 'tok',
          invoice_pdf_report_id: [88, 'FT_2024_001.pdf'],
          message_main_attachment_id: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 88,
          datas: PDF_BYTES.toString('base64'),
          mimetype: 'application/pdf',
          name: 'FT_2024_001.pdf',
        },
      ])

    const result = await invoicesService.downloadPdf('user-1', 'odoo-invoice-42', 'corr-1')

    expect(result.filename).toBe('FT_2024_001.pdf')
    expect(isPdfBuffer(result.buffer)).toBe(true)
    expect(odooExecuteKw.mock.calls[0]?.[1]).toBe('account.move')
    expect(odooExecuteKw.mock.calls[0]?.[2]).toBe('search_read')
    expect(odooExecuteKw.mock.calls[1]?.[1]).toBe('ir.attachment')
    expect(odooExecuteKw.mock.calls[1]?.[2]).toBe('read')
    expect(odooExecuteKw.mock.calls.some((call: unknown[]) => call[2] === '_render_qweb_pdf')).toBe(
      false,
    )
  })

  it('usa il portale Odoo se manca l’allegato', async () => {
    odooExecuteKw
      .mockResolvedValueOnce([
        {
          id: 42,
          name: 'INV42',
          state: 'posted',
          access_token: 'tok-portal',
          invoice_pdf_report_id: false,
          message_main_attachment_id: false,
        },
      ])
      .mockResolvedValueOnce([])

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/pdf' },
      arrayBuffer: async () => PDF_BYTES.buffer.slice(PDF_BYTES.byteOffset, PDF_BYTES.byteOffset + PDF_BYTES.byteLength),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await invoicesService.downloadPdf('user-1', 'odoo-invoice-42', 'corr-1')

    expect(isPdfBuffer(result.buffer)).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const calledUrl = String(fetchMock.mock.calls[0]?.[0])
    expect(calledUrl).toContain('/my/invoices/42')
    expect(calledUrl).toContain('report_type=pdf')
    expect(calledUrl).toContain('download=true')
    expect(calledUrl).toContain('access_token=tok-portal')
    expect(calledUrl).not.toContain('/report/pdf/')
  })
})
