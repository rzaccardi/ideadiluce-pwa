import { randomUUID } from 'node:crypto'
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
const INVOICE_BASE_FIELDS = ['id', 'name', 'state', 'access_token'] as const
const INVOICE_PDF_FIELDS = ['invoice_pdf_report_id', 'message_main_attachment_id'] as const

function moneyToCents(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) : null
}

function many2OneName(value: unknown): string | null {
  return Array.isArray(value) ? String(value[1] ?? '') || null : null
}

function many2OneId(value: unknown): number | null {
  if (Array.isArray(value) && typeof value[0] === 'number' && value[0] > 0) return value[0]
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  return null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function isUnknownFieldError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  return /invalid field|does not exist/i.test(msg)
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

export function invoicePdfFilename(name: string): string {
  const safe = name.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'fattura'
  return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`
}

export function isPdfBuffer(buffer: Buffer | null | undefined): buffer is Buffer {
  return Boolean(buffer && buffer.length >= 100 && buffer.subarray(0, 4).toString('latin1') === '%PDF')
}

/** URL portale Odoo 18: `/my/invoices/<id>?report_type=pdf&download=true&access_token=`. */
export function buildInvoicePortalPdfUrl(
  base: string,
  odooInvoiceId: number,
  accessToken: string,
): string {
  const url = new URL(`${base.replace(/\/$/, '')}/my/invoices/${odooInvoiceId}`)
  url.searchParams.set('access_token', accessToken)
  url.searchParams.set('report_type', 'pdf')
  url.searchParams.set('download', 'true')
  return url.toString()
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
    [[['email', '=ilike', user.email.trim()]]],
    { fields: ['id'], limit: 5 },
  )
  return partners.map((p) => p.id)
}

function decodeBinaryField(value: unknown): Buffer | null {
  if (typeof value === 'string' && value.length > 0) {
    const buf = Buffer.from(value, 'base64')
    return buf.length > 0 ? buf : null
  }
  if (value instanceof Uint8Array && value.length > 0) {
    return Buffer.from(value)
  }
  return null
}

type OwnedInvoice = {
  accessToken: string | null
  name: string
  state: string
  invoicePdfReportId: number | null
  messageMainAttachmentId: number | null
}

async function searchOwnedInvoice(
  ctx: OdooCallContext,
  odooInvoiceId: number,
  partnerIds: number[],
  fields: string[],
): Promise<Record<string, unknown> | undefined> {
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
    { fields, limit: 1 },
  )
  return rows[0]
}

async function assertInvoiceOwnedByUser(
  ctx: OdooCallContext,
  userId: string,
  odooInvoiceId: number,
): Promise<OwnedInvoice> {
  const partnerIds = await partnerIdsForUser(userId)
  if (partnerIds.length === 0) {
    throw new AppError('INVOICE_NOT_FOUND', 'Invoice not found', 'Fattura non trovata.', 404, false)
  }

  let row: Record<string, unknown> | undefined
  try {
    row = await searchOwnedInvoice(ctx, odooInvoiceId, partnerIds, [
      ...INVOICE_BASE_FIELDS,
      ...INVOICE_PDF_FIELDS,
    ])
  } catch (e) {
    if (!isUnknownFieldError(e)) throw e
    row = await searchOwnedInvoice(ctx, odooInvoiceId, partnerIds, [...INVOICE_BASE_FIELDS])
  }

  if (!row) {
    throw new AppError('INVOICE_NOT_FOUND', 'Invoice not found', 'Fattura non trovata.', 404, false)
  }
  return {
    accessToken: text(row.access_token),
    name: text(row.name) ?? `INV${odooInvoiceId}`,
    state: text(row.state) ?? 'unknown',
    invoicePdfReportId: many2OneId(row.invoice_pdf_report_id),
    messageMainAttachmentId: many2OneId(row.message_main_attachment_id),
  }
}

async function readAttachmentPdf(
  ctx: OdooCallContext,
  attachmentId: number,
): Promise<Buffer | null> {
  try {
    const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
      ctx,
      'ir.attachment',
      'read',
      [[attachmentId]],
      { fields: ['datas', 'mimetype', 'name'], context: { bin_size: false } },
    )
    const buf = decodeBinaryField(rows[0]?.datas)
    return isPdfBuffer(buf) ? buf : null
  } catch (e) {
    logger.debug('invoices.odoo_attachment_read_failed', {
      attachmentId,
      err: e instanceof Error ? e.message : String(e),
    })
    return null
  }
}

async function fetchInvoicePdfFromAttachments(
  ctx: OdooCallContext,
  odooInvoiceId: number,
  invoice: OwnedInvoice,
): Promise<Buffer | null> {
  const preferredIds = [invoice.invoicePdfReportId, invoice.messageMainAttachmentId].filter(
    (id): id is number => id != null,
  )
  for (const attachmentId of preferredIds) {
    const buf = await readAttachmentPdf(ctx, attachmentId)
    if (buf) return buf
  }

  try {
    const rows = await odooExecuteKw<Array<{ id: number }>>(
      ctx,
      'ir.attachment',
      'search_read',
      [
        [
          ['res_model', '=', 'account.move'],
          ['res_id', '=', odooInvoiceId],
          ['mimetype', '=', 'application/pdf'],
        ],
      ],
      { fields: ['id'], limit: 5, order: 'id desc', context: { bin_size: false } },
    )
    for (const row of rows) {
      if (preferredIds.includes(row.id)) continue
      const buf = await readAttachmentPdf(ctx, row.id)
      if (buf) return buf
    }
  } catch (e) {
    logger.debug('invoices.odoo_attachment_search_failed', {
      odooInvoiceId,
      err: e instanceof Error ? e.message : String(e),
    })
  }
  return null
}

async function ensureAccessToken(
  ctx: OdooCallContext,
  odooInvoiceId: number,
  current: string | null,
): Promise<string | null> {
  if (current) return current
  const token = randomUUID()
  try {
    await odooExecuteKw(ctx, 'account.move', 'write', [[odooInvoiceId], { access_token: token }])
    return token
  } catch (e) {
    logger.debug('invoices.odoo_access_token_write_failed', {
      odooInvoiceId,
      err: e instanceof Error ? e.message : String(e),
    })
    return null
  }
}

async function fetchInvoicePdfViaPortal(
  odooInvoiceId: number,
  accessToken: string,
): Promise<Buffer | null> {
  const reportUrl = buildInvoicePortalPdfUrl(getOdooPublicBaseUrl(), odooInvoiceId, accessToken)
  const res = await fetch(reportUrl, {
    signal: AbortSignal.timeout(30_000),
    headers: { Accept: 'application/pdf' },
    redirect: 'follow',
  })
  if (!res.ok) return null
  const buffer = Buffer.from(await res.arrayBuffer())
  const hasPdfHeader = buffer.length >= 100 && buffer.subarray(0, 4).toString('latin1') === '%PDF'
  if (hasPdfHeader) return buffer
  const contentType = res.headers.get('content-type') ?? ''
  if ((contentType.includes('pdf') || contentType.includes('octet-stream')) && buffer.length >= 100) {
    return buffer
  }
  return null
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

    let buffer = await fetchInvoicePdfFromAttachments(ctx, odooInvoiceId, invoice)
    if (!buffer) {
      const accessToken = await ensureAccessToken(ctx, odooInvoiceId, invoice.accessToken)
      if (accessToken) {
        buffer = await fetchInvoicePdfViaPortal(odooInvoiceId, accessToken)
      }
    }

    if (!isPdfBuffer(buffer)) {
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

    return { buffer, filename: invoicePdfFilename(invoice.name) }
  },
}
