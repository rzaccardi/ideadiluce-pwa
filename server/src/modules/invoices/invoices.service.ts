import { prisma } from '../../lib/prisma.js'
import {
  getOdooPublicBaseUrl,
  isOdooConfigured,
  odooExecuteKw,
  type OdooCallContext,
} from '../../adapters/odoo/odooClient.js'
import { AppError } from '../../types/errors.js'
import type { InvoiceDTO } from '../../types/dto.js'
import { logger } from '../../lib/logger.js'
import { writeStructuredIntegrationLog } from '../../lib/integration-log-context.js'

const INVOICE_PUBLIC_ID_RE = /^odoo-invoice-(\d+)$/i

function moneyToCents(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) : null
}

function many2OneName(value: unknown): string | null {
  return Array.isArray(value) ? String(value[1] ?? '') || null : null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

export function parseInvoicePublicId(publicId: string): number {
  const match = INVOICE_PUBLIC_ID_RE.exec(publicId.trim())
  if (!match) {
    throw new AppError('INVOICE_NOT_FOUND', 'Invalid invoice id', 'Fattura non trovata.', 404, false)
  }
  const id = Number(match[1])
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('INVOICE_NOT_FOUND', 'Invalid invoice id', 'Fattura non trovata.', 404, false)
  }
  return id
}

function invoicePdfLikelyAvailable(state: string | null): boolean {
  const normalized = (state ?? '').toLowerCase()
  return normalized === 'posted'
}

function mapInvoice(row: Record<string, unknown>): InvoiceDTO {
  const id = typeof row.id === 'number' ? row.id : 0
  const state = text(row.state) ?? 'unknown'
  const accessToken = text(row.access_token)
  const base = getOdooPublicBaseUrl()
  const portalUrl =
    accessToken && base
      ? `${base}/my/invoices/${id}?access_token=${encodeURIComponent(accessToken)}`
      : null
  return {
    id: `odoo-invoice-${id}`,
    name: text(row.name) ?? `INV${id}`,
    state,
    paymentState: text(row.payment_state),
    currencyCode: many2OneName(row.currency_id),
    amountTotalCents: moneyToCents(row.amount_total),
    invoiceDate: text(row.invoice_date),
    pdfAvailable: invoicePdfLikelyAvailable(state),
    portalUrl,
  }
}

async function partnerIdsForUser(userId: string): Promise<number[]> {
  const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
  if (map) return [map.odooPartnerId]
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!user?.email) return []
  const partners = await odooExecuteKw<Array<{ id: number }>>(
    { correlationId: `invoices-${userId}` },
    'res.partner',
    'search_read',
    [[['email', 'ilike', user.email.toLowerCase().trim()]]],
    { fields: ['id'], limit: 5 },
  )
  return partners.map((p) => p.id)
}

function extractPdfBase64(result: unknown): string | null {
  if (!Array.isArray(result) || result.length === 0) return null
  const first = result[0]
  if (typeof first === 'string' && first.length > 0) return first
  if (first instanceof Uint8Array) return Buffer.from(first).toString('base64')
  if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
  return null
}

async function renderInvoicePdfViaOdoo(
  ctx: OdooCallContext,
  odooInvoiceId: number,
): Promise<Buffer | null> {
  const reportRefs = ['account.report_invoice', 'account.report_invoice_with_payments']
  for (const reportRef of reportRefs) {
    try {
      const result = await odooExecuteKw<unknown>(
        ctx,
        'ir.actions.report',
        '_render_qweb_pdf',
        [reportRef, [odooInvoiceId]],
      )
      const b64 = extractPdfBase64(result)
      if (b64) return Buffer.from(b64, 'base64')
    } catch (e) {
      logger.debug('invoices.odoo_render_pdf_failed', {
        odooInvoiceId,
        reportRef,
        err: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return null
}

async function fetchInvoicePdfViaPortal(
  odooInvoiceId: number,
  accessToken: string | null,
): Promise<Buffer | null> {
  const base = getOdooPublicBaseUrl()
  const reportUrl = accessToken
    ? `${base}/report/pdf/account.report_invoice/${odooInvoiceId}?access_token=${encodeURIComponent(accessToken)}`
    : `${base}/report/pdf/account.report_invoice/${odooInvoiceId}`

  const res = await fetch(reportUrl, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) return null
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
    return null
  }
  return Buffer.from(await res.arrayBuffer())
}

async function assertInvoiceOwnedByUser(
  ctx: OdooCallContext,
  userId: string,
  odooInvoiceId: number,
): Promise<{ accessToken: string | null; name: string; state: string }> {
  const partnerIds = await partnerIdsForUser(userId)
  if (partnerIds.length === 0) {
    throw new AppError('INVOICE_NOT_FOUND', 'Invoice not found', 'Fattura non trovata.', 404, false)
  }

  const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
    ctx,
    'account.move',
    'search_read',
    [
      [
        ['id', '=', odooInvoiceId],
        ['move_type', 'in', ['out_invoice', 'out_refund']],
        ['partner_id', 'in', partnerIds],
        ['state', '!=', 'cancel'],
      ],
    ],
    {
      fields: ['id', 'name', 'state', 'access_token'],
      limit: 1,
    },
  )
  const row = rows[0]
  if (!row) {
    throw new AppError('INVOICE_NOT_FOUND', 'Invoice not found', 'Fattura non trovata.', 404, false)
  }
  return {
    accessToken: text(row.access_token),
    name: text(row.name) ?? `INV${odooInvoiceId}`,
    state: text(row.state) ?? 'unknown',
  }
}

export const invoicesService = {
  async list(userId: string, correlationId: string): Promise<InvoiceDTO[]> {
    if (!isOdooConfigured()) return []

    const partnerIds = await partnerIdsForUser(userId)
    if (partnerIds.length === 0) return []

    const ctx: OdooCallContext = { correlationId }
    try {
      const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
        ctx,
        'account.move',
        'search_read',
        [
          [
            ['move_type', 'in', ['out_invoice', 'out_refund']],
            ['partner_id', 'in', partnerIds],
            ['state', '!=', 'cancel'],
          ],
        ],
        {
          fields: [
            'id',
            'name',
            'state',
            'payment_state',
            'amount_total',
            'currency_id',
            'invoice_date',
            'access_token',
          ],
          limit: 50,
          order: 'invoice_date desc, id desc',
        },
      )
      return rows.map(mapInvoice)
    } catch (e) {
      logger.warn('invoices.odoo_list_failed', { userId, err: String(e) })
      throw new AppError(
        'INVOICES_UNAVAILABLE',
        'Invoices list failed',
        'Impossibile caricare le fatture al momento.',
        503,
        true,
      )
    }
  },

  async downloadPdf(
    userId: string,
    invoicePublicId: string,
    correlationId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    if (!isOdooConfigured()) {
      throw new AppError(
        'INVOICES_UNAVAILABLE',
        'Odoo not configured',
        'Download fattura non disponibile.',
        503,
        false,
      )
    }

    const odooInvoiceId = parseInvoicePublicId(invoicePublicId)
    const ctx: OdooCallContext = { correlationId }
    const invoice = await assertInvoiceOwnedByUser(ctx, userId, odooInvoiceId)

    if (!invoicePdfLikelyAvailable(invoice.state)) {
      throw new AppError(
        'INVOICE_PDF_UNAVAILABLE',
        'Invoice PDF not ready',
        'Il PDF della fattura non è ancora disponibile.',
        404,
        false,
      )
    }

    let buffer =
      (await renderInvoicePdfViaOdoo(ctx, odooInvoiceId)) ??
      (await fetchInvoicePdfViaPortal(odooInvoiceId, invoice.accessToken))

    if (!buffer || buffer.length < 100) {
      await writeStructuredIntegrationLog({
        service: 'odoo',
        operation: 'invoice_pdf',
        correlationId,
        success: false,
        userId,
        error: 'PDF non recuperabile da Odoo',
        extra: { invoicePublicId, odooInvoiceId },
      })
      throw new AppError(
        'INVOICE_PDF_UNAVAILABLE',
        'PDF fetch failed',
        'Impossibile scaricare il PDF della fattura.',
        502,
        true,
      )
    }

    await writeStructuredIntegrationLog({
      service: 'odoo',
      operation: 'invoice_pdf',
      correlationId,
      success: true,
      userId,
      extra: { invoicePublicId, odooInvoiceId, bytes: buffer.length },
    })

    const safeName = invoice.name.replace(/[^\w.-]+/g, '_')
    return { buffer, filename: `${safeName}.pdf` }
  },
}
